"""
WSGI config for landing_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys

# Configurar el módulo de settings antes de importar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

try:
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
except Exception as e:
    # En caso de error, loguear para debugging en Vercel
    import traceback
    print(f"Error initializing Django WSGI application: {e}")
    print(traceback.format_exc())
    sys.exit(1)
