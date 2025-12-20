"""
ALTERNATIVA: Envío por Email
Si prefieres recibir las peticiones por email en lugar de base de datos,
puedes usar esta vista en lugar de submit_contact en urls.py
"""

from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json

@csrf_exempt
@require_http_methods(["POST"])
def submit_contact_email(request):
    """
    Vista alternativa que envía las peticiones por email
    """
    try:
        data = json.loads(request.body)
        
        # Validar campos
        if not all([data.get('name'), data.get('email'), data.get('service'), data.get('message')]):
            return JsonResponse({'success': False, 'error': 'Campos requeridos faltantes'}, status=400)
        
        # Preparar el email
        subject = f'Nueva consulta de contacto - {data.get("service", "General")}'
        message = f"""
Nueva consulta recibida desde la landing page:

Nombre: {data.get('name')}
Email: {data.get('email')}
Tipo de consulta: {data.get('service')}

Mensaje:
{data.get('message')}

---
Enviado el: {request.META.get('HTTP_HOST', 'N/A')}
IP: {request.META.get('REMOTE_ADDR', 'N/A')}
"""
        
        # Enviar email
        # NOTA: Necesitas configurar EMAIL_BACKEND en settings.py
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL or 'noreply@alejandrogilabert.com',
            ['agilabertcomunicaciones@gmail.com'],
            fail_silently=False,
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Mensaje enviado correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
