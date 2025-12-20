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
]

# Serve static files - works in both DEBUG and production (Vercel)
# Use STATICFILES_DIRS to serve from the static directory
from django.contrib.staticfiles import finders
from django.http import Http404, HttpResponse
import os

def serve_static_file(request, path):
    """Serve static files using Django's staticfiles finder"""
    # Try to find the file using staticfiles finders
    static_file = finders.find(path)
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
            return response
        except Exception:
            pass
    raise Http404("Static file not found")

if settings.STATICFILES_DIRS:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve_static_file),
    ]

# Serve media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
