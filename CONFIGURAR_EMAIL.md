# Configuración de Email para Notificaciones

## Estado Actual

El sistema está configurado para **enviar emails en modo desarrollo** (consola). Los emails se mostrarán en la terminal cuando ejecutes el servidor Django.

## Configuración para Producción (Gmail)

Para recibir emails reales, sigue estos pasos:

### 1. Habilitar Contraseña de Aplicación en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Seguridad → Contraseñas de aplicaciones
4. Genera una nueva contraseña para "Correo" y "Otro (personalizado)" → "Django"
5. Copia la contraseña generada (16 caracteres)

### 2. Editar `landing_project/settings.py`

Descomenta y configura estas líneas:

```python
# Email Configuration para Producción
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tu-email@gmail.com'  # Tu email de Gmail
EMAIL_HOST_PASSWORD = 'xxxx xxxx xxxx xxxx'  # La contraseña de aplicación de 16 caracteres
DEFAULT_FROM_EMAIL = 'tu-email@gmail.com'  # Tu email de Gmail
CONTACT_EMAIL = 'agilabertcomunicaciones@gmail.com'  # Email donde recibir notificaciones
```

### 3. Comentar la línea de desarrollo

Comenta esta línea:
```python
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

## Otras Opciones de Email

### Outlook/Hotmail

```python
EMAIL_HOST = 'smtp-mail.outlook.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

### SendGrid (Recomendado para producción)

1. Crea cuenta en SendGrid
2. Genera API Key
3. Configura:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = 'tu-api-key-de-sendgrid'
DEFAULT_FROM_EMAIL = 'noreply@tudominio.com'
```

### Mailgun

```python
EMAIL_HOST = 'smtp.mailgun.org'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'postmaster@tudominio.mailgun.org'
EMAIL_HOST_PASSWORD = 'tu-password-de-mailgun'
```

## Probar el Envío

1. Ejecuta el servidor: `python manage.py runserver`
2. Envía un mensaje desde el formulario de contacto
3. Revisa:
   - **Modo desarrollo**: La terminal donde corre el servidor
   - **Modo producción**: Tu bandeja de entrada (y spam)

## Formato del Email

Cada email incluye:
- Nombre y email del contacto
- Tipo de consulta
- Mensaje completo
- Fecha y hora
- IP del remitente
- ID de registro en la base de datos

## Notas de Seguridad

- ⚠️ **NUNCA** subas `settings.py` con contraseñas reales a Git
- Usa variables de entorno para producción
- Considera usar `.env` con `python-decouple` para credenciales

### Usar Variables de Entorno (Recomendado)

1. Instala: `pip install python-decouple`
2. Crea `.env` en la raíz del proyecto:
```
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contraseña-app
CONTACT_EMAIL=agilabertcomunicaciones@gmail.com
```

3. En `settings.py`:
```python
from decouple import config

EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
CONTACT_EMAIL = config('CONTACT_EMAIL', default='agilabertcomunicaciones@gmail.com')
```

4. Agrega `.env` a `.gitignore`
