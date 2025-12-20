"""
WSGI config for landing_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

# Configurar el módulo de settings antes de importar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

from django.core.wsgi import get_wsgi_application

# Django usa 'application' por defecto
application = get_wsgi_application()

# Vercel requiere 'handler' como nombre de variable principal
handler = application

# También exportar como 'app' para compatibilidad
app = application
