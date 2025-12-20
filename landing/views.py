from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.core.cache import cache
import json
import logging
from .models import ContactSubmission

logger = logging.getLogger(__name__)

def index_professional(request):
    """
    Vista para la landing page profesional
    """
    return render(request, 'landing/index_professional.html')

@csrf_exempt
@require_http_methods(["POST"])
# Rate limiting solo si está habilitado (requiere Redis)
# Si no hay Redis, los decoradores se ignoran automáticamente
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
        
        # Validar honeypot (campo oculto anti-spam)
        if data.get('website'):  # Si se rellena el campo honeypot, es spam
            logger.warning(f'Spam detectado - honeypot rellenado. IP: {get_client_ip(request)}')
            return JsonResponse({
                'success': False,
                'error': 'Solicitud inválida'
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
                    'error': 'Por favor, espera unos segundos antes de enviar otro mensaje.',
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
                    'error': f'El campo {field} es requerido'
                }, status=400)
        
        # Validar email
        email = data.get('email', '').strip()
        if '@' not in email or '.' not in email.split('@')[1]:
            return JsonResponse({
                'success': False,
                'error': 'Email inválido'
            }, status=400)
        
        # Obtener IP y User Agent
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Crear registro en la base de datos
        submission = ContactSubmission.objects.create(
            name=data.get('name', '').strip(),
            email=email,
            service_type=data.get('service', ''),
            message=data.get('message', '').strip(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
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

Fecha: {submission.submitted_at.strftime('%d/%m/%Y %H:%M:%S')}
IP: {ip_address or 'N/A'}
ID de registro: #{submission.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para responder, simplemente responde a este email o contacta a: {email}
"""
            
            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL or 'noreply@alejandrogilabert.com',
                [settings.CONTACT_EMAIL or 'agilabertcomunicaciones@gmail.com'],
                fail_silently=False,
            )
        except Exception as email_error:
            # Si falla el email, aún guardamos en BD pero registramos el error
            print(f'Error al enviar email: {email_error}')
            # No fallamos la petición si el email falla, solo lo registramos
        
        return JsonResponse({
            'success': True,
            'message': 'Mensaje enviado correctamente',
            'id': submission.id
        })
        
    except Ratelimited:
        logger.warning(f'Rate limit excedido. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': 'Has enviado demasiados mensajes. Por favor, espera un momento antes de intentar de nuevo.',
            'rate_limited': True
        }, status=429)
    except json.JSONDecodeError:
        logger.error(f'Error al parsear JSON. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': 'Error al procesar los datos'
        }, status=400)
    except Exception as e:
        logger.error(f'Error inesperado en submit_contact: {str(e)}. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.'
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
