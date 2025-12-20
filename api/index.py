# Vercel serverless function entry point for Django
import os
import sys

# Set VERCEL environment variable to enable Vercel-specific settings
os.environ['VERCEL'] = '1'

# Add parent directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set Django settings module BEFORE importing Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Initialize Django
import django
from django.conf import settings
if not settings.configured:
    django.setup()

# Import Django WSGI application
from django.core.wsgi import get_wsgi_application

# Create WSGI application
wsgi_application = get_wsgi_application()

# Create handler function for Vercel
# The @vercel/python adapter expects a WSGI application or handler function
def handler(request, response):
    """
    Vercel serverless function handler
    Uses the WSGI application to handle requests
    """
    # The @vercel/python adapter will automatically call the WSGI application
    # But we need to ensure it's properly set up
    return wsgi_application(request.environ, response.start_response)

# Also export as WSGI application directly (preferred method)
# The @vercel/python adapter can detect and use WSGI applications automatically
application = wsgi_application
app = wsgi_application

