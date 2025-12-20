#!/usr/bin/env python
"""
Script para probar la configuración de email
Ejecuta: python test_email.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'landing_project.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    """Envía un email de prueba"""
    print("=" * 50)
    print("TEST DE CONFIGURACIÓN DE EMAIL")
    print("=" * 50)
    print()
    
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NO CONFIGURADA'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"CONTACT_EMAIL: {settings.CONTACT_EMAIL}")
    print()
    
    if not settings.EMAIL_HOST_PASSWORD or settings.EMAIL_HOST_PASSWORD == 'TU_CONTRASEÑA_DE_APLICACION_AQUI':
        print("⚠️  ERROR: Debes configurar EMAIL_HOST_PASSWORD en settings.py")
        print("   Sigue las instrucciones en GENERAR_PASSWORD_GMAIL.md")
        return False
    
    try:
        print("Enviando email de prueba...")
        send_mail(
            subject='Test de Email - Landing Page',
            message='Este es un email de prueba desde tu landing page Django. Si recibes esto, la configuración está correcta.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_EMAIL],
            fail_silently=False,
        )
        print()
        print("✅ Email enviado correctamente!")
        print(f"   Revisa la bandeja de entrada de: {settings.CONTACT_EMAIL}")
        print("   (También revisa la carpeta de spam)")
        return True
    except Exception as e:
        print()
        print("❌ Error al enviar email:")
        print(f"   {str(e)}")
        print()
        print("Posibles causas:")
        print("   - Contraseña de aplicación incorrecta")
        print("   - Verificación en 2 pasos no activada")
        print("   - Problemas de conexión")
        print("   - Revisa GENERAR_PASSWORD_GMAIL.md para más ayuda")
        return False

if __name__ == '__main__':
    test_email()
