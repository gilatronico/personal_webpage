"""
URL configuration for landing_project project.
"""
from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
from landing import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index_professional, name='index_professional'),
    path('api/contact/', views.submit_contact, name='submit_contact'),
    # Favicon route - many browsers automatically request /favicon.ico
    re_path(r'^favicon\.ico$', lambda request: serve_static_file(request, 'images/favicon_world.png')),
]

# Serve static files - works in both DEBUG and production (Vercel)
# Use STATICFILES_DIRS to serve from the static directory
from django.contrib.staticfiles import finders
from django.http import Http404, HttpResponse
import os

def serve_static_file(request, path):
    """Serve static files using Django's staticfiles finder"""
    import logging
    logger = logging.getLogger(__name__)
    
    # Decode URL-encoded path (handles spaces and special characters)
    from urllib.parse import unquote
    path = unquote(path)
    
    # Try to find the file using staticfiles finders
    static_file = finders.find(path)
    
    # If not found, try direct path from STATICFILES_DIRS
    if not static_file and settings.STATICFILES_DIRS:
        import os
        from pathlib import Path
        static_dir = Path(settings.STATICFILES_DIRS[0])
        direct_path = static_dir / path
        if direct_path.exists() and direct_path.is_file():
            static_file = str(direct_path)
    
    if static_file:
        try:
            with open(static_file, 'rb') as f:
                content = f.read()
            # Determine content type
            if path.endswith('.png'):
                content_type = 'image/png'
            elif path.endswith('.jpg') or path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif path.endswith('.svg'):
                content_type = 'image/svg+xml'
            elif path.endswith('.css'):
                content_type = 'text/css'
            elif path.endswith('.js'):
                content_type = 'application/javascript'
            else:
                content_type = 'application/octet-stream'
            
            response = HttpResponse(content, content_type=content_type)
            # Add cache headers
            response['Cache-Control'] = 'public, max-age=31536000'
            return response
        except Exception as e:
            logger.error(f"Error serving static file {path}: {e}")
            pass
    
    logger.warning(f"Static file not found: {path}")
    raise Http404(f"Static file not found: {path}")

if settings.STATICFILES_DIRS:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve_static_file),
    ]

# Serve media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
