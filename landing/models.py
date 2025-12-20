from django.db import models
from django.utils import timezone

class ContactSubmission(models.Model):
    """
    Modelo para almacenar las peticiones del formulario de contacto
    """
    name = models.CharField(max_length=200, verbose_name='Nombre')
    email = models.EmailField(verbose_name='Email')
    service_type = models.CharField(
        max_length=50,
        choices=[
            ('product', 'Producto & Web3'),
            ('teaching', 'Docencia / Consultoría'),
        ],
        verbose_name='Tipo de consulta'
    )
    message = models.TextField(verbose_name='Mensaje')
    submitted_at = models.DateTimeField(default=timezone.now, verbose_name='Fecha de envío')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP')
    user_agent = models.TextField(null=True, blank=True, verbose_name='User Agent')
    
    class Meta:
        verbose_name = 'Consulta de contacto'
        verbose_name_plural = 'Consultas de contacto'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f'{self.name} - {self.email} ({self.submitted_at.strftime("%Y-%m-%d %H:%M")})'
