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
if settings.STATICFILES_DIRS:
    static_dir = str(settings.STATICFILES_DIRS[0])
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', static_serve, {'document_root': static_dir}),
    ]

# Serve media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
