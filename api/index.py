# Vercel serverless function entry point for Django
import os
import sys

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Import Django WSGI application
from django.core.wsgi import get_wsgi_application

# Create WSGI application
django_app = get_wsgi_application()

# For Vercel, we need to export the application
# The @vercel/python adapter will handle WSGI applications
def handler(request):
    """Handler function that Vercel can call"""
    return django_app

# Also export directly as app (some Vercel configs expect this)
app = django_app

