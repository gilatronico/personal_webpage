# Vercel serverless function entry point for Django
# The @vercel/python adapter expects 'app' to be the WSGI application

import os
import sys

# Set VERCEL environment variable to enable Vercel-specific settings
os.environ['VERCEL'] = '1'

# Add parent directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set Django settings module BEFORE importing Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Import Django WSGI application
from django.core.wsgi import get_wsgi_application

# Create WSGI application
# Vercel's @vercel/python adapter expects 'app' to be the WSGI callable
app = get_wsgi_application()

