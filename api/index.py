# Vercel serverless function entry point for Django
# The @vercel/python adapter automatically handles WSGI applications

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
# The @vercel/python adapter will automatically detect and use this
from django.core.wsgi import get_wsgi_application

# Create WSGI application - this is what Vercel expects
application = get_wsgi_application()

# Export as handler for Vercel
# The @vercel/python adapter automatically converts WSGI to HTTP responses
handler = application
app = application

