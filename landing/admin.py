from django.contrib import admin
from .models import ContactSubmission

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'service_type', 'submitted_at', 'ip_address')
    list_filter = ('service_type', 'submitted_at')
    search_fields = ('name', 'email', 'message')
    readonly_fields = ('submitted_at', 'ip_address', 'user_agent')
    
    fieldsets = (
        ('Información de contacto', {
            'fields': ('name', 'email', 'service_type')
        }),
        ('Mensaje', {
            'fields': ('message',)
        }),
        ('Metadatos', {
            'fields': ('submitted_at', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )
