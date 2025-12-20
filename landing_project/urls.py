"""
URL configuration for landing_project project.
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from landing import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index_professional, name='index_professional'),
    path('api/contact/', views.submit_contact, name='submit_contact'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
