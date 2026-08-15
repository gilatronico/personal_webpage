from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import json
import logging
from .models import ContactSubmission

logger = logging.getLogger(__name__)

# Mensajes de error del formulario de contacto en ambos idiomas. El frontend
# manda 'lang' en el body; antes estos textos estaban hardcodeados solo en
# español y se mostraban tal cual aunque el visitante estuviera en inglés.
CONTACT_MESSAGES = {
    'invalid_request': {'es': 'Solicitud inválida', 'en': 'Invalid request'},
    'too_fast': {
        'es': 'Por favor, espera unos segundos antes de enviar otro mensaje.',
        'en': 'Please wait a few seconds before sending another message.',
    },
    'field_required': {'es': 'El campo {field} es requerido', 'en': 'The {field} field is required'},
    'invalid_email': {'es': 'Email inválido', 'en': 'Invalid email'},
    'email_failed': {
        'es': 'No se pudo enviar tu mensaje por un problema técnico. '
              'Por favor, escribe directamente a agilabertcomunicaciones@gmail.com.',
        'en': 'Your message could not be sent due to a technical issue. '
              'Please email agilabertcomunicaciones@gmail.com directly.',
    },
    'success': {'es': 'Mensaje enviado correctamente', 'en': 'Message sent successfully'},
    'rate_limited': {
        'es': 'Has enviado demasiados mensajes. Por favor, espera un momento antes de intentar de nuevo.',
        'en': 'You have sent too many messages. Please wait a moment before trying again.',
    },
    'bad_json': {'es': 'Error al procesar los datos', 'en': 'Error processing data'},
    'unexpected': {
        'es': 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.',
        'en': 'An error occurred. Please try again later.',
    },
}


def get_request_lang(data):
    """'en' si el frontend lo indicó explícitamente, 'es' por defecto."""
    return 'en' if isinstance(data, dict) and data.get('lang') == 'en' else 'es'


def get_lang_from_request(request):
    """
    Igual que get_request_lang, pero a prueba de fallos para usar dentro de los
    'except': si el JSON nunca llegó a parsearse (o el rate limit del decorador
    saltó antes de que la vista empezara a ejecutarse), 'data' no existe.
    """
    try:
        return get_request_lang(json.loads(request.body))
    except Exception:
        return 'es'

# Rate limiting solo si hay Redis disponible
try:
    from django_ratelimit.decorators import ratelimit
    from django_ratelimit.exceptions import Ratelimited
    # Verificar si hay Redis configurado
    REDIS_AVAILABLE = 'redis' in settings.CACHES.get('default', {}).get('BACKEND', '').lower()
    if not REDIS_AVAILABLE:
        # Si no hay Redis, crear decoradores dummy que no hacen nada
        def ratelimit(*args, **kwargs):
            def decorator(func):
                return func
            return decorator
        Ratelimited = Exception
except ImportError:
    # Si django_ratelimit no está instalado
    def ratelimit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
    Ratelimited = Exception
    REDIS_AVAILABLE = False

SITE_URL = 'https://alexgilabert.xyz'


def index_professional(request):
    """
    Vista para la landing page profesional
    """
    return render(request, 'landing/index_professional.html')


def privacidad(request):
    """
    Política de privacidad y aviso legal (RGPD).
    """
    return render(request, 'landing/privacidad.html')


def robots_txt(request):
    """
    robots.txt servido dinámicamente para que apunte siempre al sitemap correcto.
    """
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        # El CV incluye un email personal (no el de contacto público);
        # se evita que buscadores lo indexen y lo dejen cosechable.
        'Disallow: /static/documents/',
        '',
        f'Sitemap: {SITE_URL}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')


def sitemap_xml(request):
    """
    Sitemap mínimo con las URLs indexables del sitio.
    """
    today = timezone.now().strftime('%Y-%m-%d')
    urls = [
        (f'{SITE_URL}/', '1.0', 'monthly'),
        (f'{SITE_URL}/privacidad', '0.3', 'yearly'),
    ]
    entries = '\n'.join(
        f'  <url>\n'
        f'    <loc>{loc}</loc>\n'
        f'    <lastmod>{today}</lastmod>\n'
        f'    <changefreq>{freq}</changefreq>\n'
        f'    <priority>{prio}</priority>\n'
        f'  </url>'
        for loc, prio, freq in urls
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{entries}\n'
        '</urlset>\n'
    )
    return HttpResponse(xml, content_type='application/xml')

@require_http_methods(["POST"])
# El frontend ya envía X-CSRFToken correctamente (ver fetch en el template),
# así que csrf_exempt aquí solo quitaba protección real sin ninguna ventaja.
# Rate limiting - se aplica solo si el cache backend lo soporta
# En desarrollo local con DatabaseCache funcionará correctamente
@ratelimit(key='ip', rate='3/m', method='POST', block=True)  # 3 peticiones por minuto
@ratelimit(key='ip', rate='5/h', method='POST', block=True)   # 5 peticiones por hora
@ratelimit(key='ip', rate='10/d', method='POST', block=True) # 10 peticiones por día
def submit_contact(request):
    """
    Vista para recibir y almacenar las peticiones del formulario de contacto
    Protegida con rate limiting para prevenir spam y ataques
    """
    try:
        # Parsear datos JSON
        data = json.loads(request.body)
        lang = get_request_lang(data)

        # Validar honeypot (campo oculto anti-spam)
        if data.get('website'):  # Si se rellena el campo honeypot, es spam
            logger.warning(f'Spam detectado - honeypot rellenado. IP: {get_client_ip(request)}')
            return JsonResponse({
                'success': False,
                'error': CONTACT_MESSAGES['invalid_request'][lang]
            }, status=400)

        # Validar tiempo mínimo entre peticiones (protección adicional)
        ip_address = get_client_ip(request)
        cache_key = f'contact_submission_{ip_address}'
        last_submission_time = cache.get(cache_key)

        if last_submission_time:
            time_since_last = (timezone.now() - last_submission_time).total_seconds()
            if time_since_last < 10:  # Mínimo 10 segundos entre peticiones
                logger.warning(f'Rate limit adicional: petición demasiado rápida. IP: {ip_address}, tiempo: {time_since_last:.2f}s')
                return JsonResponse({
                    'success': False,
                    'error': CONTACT_MESSAGES['too_fast'][lang],
                    'retry_after': int(10 - time_since_last)
                }, status=429)

        # Guardar timestamp de esta petición
        cache.set(cache_key, timezone.now(), timeout=60)  # Cache por 60 segundos

        # Validar campos requeridos
        required_fields = ['name', 'email', 'service', 'message']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': CONTACT_MESSAGES['field_required'][lang].format(field=field)
                }, status=400)

        # Validar email
        email = data.get('email', '').strip()
        if '@' not in email or '.' not in email.split('@')[1]:
            return JsonResponse({
                'success': False,
                'error': CONTACT_MESSAGES['invalid_email'][lang]
            }, status=400)
        
        # Obtener IP y User Agent
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Crear registro en la base de datos (opcional, si falla continuamos)
        submission_id = None
        try:
            submission = ContactSubmission.objects.create(
                name=data.get('name', '').strip(),
                email=email,
                service_type=data.get('service', ''),
                message=data.get('message', '').strip(),
                ip_address=ip_address,
                user_agent=user_agent
            )
            submission_id = submission.id
        except Exception as db_error:
            # Si falla el guardado en BD, continuamos de todas formas
            logger.warning(f'Error al guardar en BD: {db_error}. Continuando sin guardar.')
            submission_id = None
        
        # Enviar email de notificación
        try:
            service_type_display = dict(ContactSubmission._meta.get_field('service_type').choices).get(
                data.get('service', ''), 
                data.get('service', 'General')
            )
            
            subject = f'Nueva consulta de contacto - {service_type_display}'
            email_message = f"""
Has recibido una nueva consulta desde tu landing page:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMACIÓN DE CONTACTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre: {data.get('name', '').strip()}
Email: {data.get('email', '').strip()}
Tipo de consulta: {service_type_display}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENSAJE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{data.get('message', '').strip()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METADATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fecha: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}
IP: {ip_address or 'N/A'}
ID de registro: #{submission_id or 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para responder, simplemente responde a este email o contacta a: {email}
"""
            
            sent_count = send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [settings.CONTACT_EMAIL],
                fail_silently=False,  # Necesitamos saber si falla: es el único canal fiable
            )
            email_sent = sent_count > 0
        except Exception as email_error:
            # La BD en Vercel es efímera (/tmp), así que si el email falla el
            # mensaje se pierde de verdad. Lo registramos con detalle para depurar.
            logger.error(f'Error al enviar email de contacto: {email_error}. IP: {ip_address}')
            print(f'Error al enviar email: {email_error}')
            email_sent = False

        if not email_sent:
            return JsonResponse({
                'success': False,
                'error': CONTACT_MESSAGES['email_failed'][lang],
            }, status=502)

        return JsonResponse({
            'success': True,
            'message': CONTACT_MESSAGES['success'][lang],
            'id': submission_id
        })

    except Ratelimited:
        logger.warning(f'Rate limit excedido. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': CONTACT_MESSAGES['rate_limited'][get_lang_from_request(request)],
            'rate_limited': True
        }, status=429)
    except json.JSONDecodeError:
        logger.error(f'Error al parsear JSON. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': CONTACT_MESSAGES['bad_json'][get_lang_from_request(request)]
        }, status=400)
    except Exception as e:
        logger.error(f'Error inesperado en submit_contact: {str(e)}. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': CONTACT_MESSAGES['unexpected'][get_lang_from_request(request)]
        }, status=500)

def get_client_ip(request):
    """
    Obtiene la IP real del cliente
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
