# Vercel serverless function entry point
# This file wraps Django WSGI application for Vercel

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Import Django WSGI application
from landing_project.wsgi import application

# Vercel expects 'handler' to be the WSGI application
handler = application

