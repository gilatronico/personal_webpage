# Vercel serverless function entry point for Django
import os
import sys

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Import Django WSGI application
from django.core.wsgi import get_wsgi_application

# Create WSGI application - this is what Vercel expects
# The @vercel/python adapter automatically detects WSGI applications
application = get_wsgi_application()
handler = application

