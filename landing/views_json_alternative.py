"""
ALTERNATIVA: Almacenamiento en Archivo JSON
Si prefieres guardar en un archivo JSON en lugar de base de datos,
puedes usar esta vista en lugar de submit_contact en urls.py
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json
import os
from datetime import datetime

JSON_FILE_PATH = os.path.join(settings.BASE_DIR, 'contact_submissions.json')

@csrf_exempt
@require_http_methods(["POST"])
def submit_contact_json(request):
    """
    Vista alternativa que guarda las peticiones en un archivo JSON
    """
    try:
        data = json.loads(request.body)
        
        # Validar campos
        if not all([data.get('name'), data.get('email'), data.get('service'), data.get('message')]):
            return JsonResponse({'success': False, 'error': 'Campos requeridos faltantes'}, status=400)
        
        # Preparar entrada
        entry = {
            'timestamp': datetime.now().isoformat(),
            'name': data.get('name', '').strip(),
            'email': data.get('email', '').strip(),
            'service': data.get('service', ''),
            'message': data.get('message', '').strip(),
            'ip': request.META.get('REMOTE_ADDR', ''),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')
        }
        
        # Guardar en archivo JSON (append mode)
        with open(JSON_FILE_PATH, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        
        return JsonResponse({
            'success': True,
            'message': 'Mensaje guardado correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
