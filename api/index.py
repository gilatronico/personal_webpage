# Vercel serverless function entry point for Django
# This file converts Vercel's serverless function format to Django WSGI

import os
import sys
import json

# Add parent directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set Django settings module BEFORE importing Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')

# Import Django and initialize
import django
from django.conf import settings
from django.core.wsgi import get_wsgi_application

# Ensure Django is set up
if not settings.configured:
    django.setup()

# Get WSGI application
wsgi_app = get_wsgi_application()

def handler(event, context):
    """
    Vercel serverless function handler
    Converts Vercel event to WSGI format and calls Django
    """
    from io import BytesIO
    from urllib.parse import urlparse, parse_qs
    
    # Parse the event
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    body = event.get('body', '')
    query_string = event.get('queryStringParameters', {}) or {}
    
    # Build query string
    query_parts = []
    for key, value in query_string.items():
        query_parts.append(f"{key}={value}")
    query_string = '&'.join(query_parts)
    
    # Create WSGI environ
    environ = {
        'REQUEST_METHOD': method,
        'PATH_INFO': path,
        'QUERY_STRING': query_string,
        'CONTENT_TYPE': headers.get('content-type', ''),
        'CONTENT_LENGTH': str(len(body)) if body else '0',
        'SERVER_NAME': headers.get('host', 'localhost'),
        'SERVER_PORT': '443' if headers.get('x-forwarded-proto') == 'https' else '80',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': headers.get('x-forwarded-proto', 'http'),
        'wsgi.input': BytesIO(body.encode() if isinstance(body, str) else body),
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': True,
        'wsgi.run_once': False,
    }
    
    # Add headers to environ
    for key, value in headers.items():
        key = key.upper().replace('-', '_')
        if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            environ[f'HTTP_{key}'] = value
    
    # Create response object
    status_code = 200
    response_headers = []
    response_body = []
    
    def start_response(status, headers):
        nonlocal status_code
        status_code = int(status.split()[0])
        response_headers.extend(headers)
    
    # Call WSGI application
    response_iter = wsgi_app(environ, start_response)
    response_body = b''.join(response_iter)
    
    # Convert response headers to dict
    response_headers_dict = {}
    for header_name, header_value in response_headers:
        # Vercel expects lowercase header names
        response_headers_dict[header_name.lower()] = header_value
    
    # Ensure Content-Type is set for HTML responses
    if 'content-type' not in response_headers_dict:
        response_headers_dict['content-type'] = 'text/html; charset=utf-8'
    
    # Decode body if it's bytes
    if isinstance(response_body, bytes):
        body_str = response_body.decode('utf-8')
    else:
        body_str = str(response_body)
    
    # Convert response to Vercel format
    return {
        'statusCode': status_code,
        'headers': response_headers_dict,
        'body': body_str
    }

