# Vercel serverless function entry point
# This file wraps Django WSGI application for Vercel

import os
import sys

# Add project root to path  
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Import and initialize Django
import django
django.setup()

# Import Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# Vercel expects 'handler' to be the WSGI application
# Export both handler and app for compatibility
handler = application
app = application

