# Instrucciones para Activar el Almacenamiento de Peticiones

## ✅ Implementación: Base de Datos Django (SQLite)

He implementado la opción de **Base de Datos Django** que es la más recomendada. Los datos se almacenarán en SQLite y podrás verlos desde Django Admin.

## Pasos para Activar

### 1. Crear las migraciones
```bash
cd landing_personal
python manage.py makemigrations
```

### 2. Aplicar las migraciones
```bash
python manage.py migrate
```

### 3. Crear un superusuario (para acceder al admin)
```bash
python manage.py createsuperuser
```
Sigue las instrucciones para crear tu usuario admin.

### 4. Ejecutar el servidor
```bash
python manage.py runserver
```

### 5. Acceder al Admin
Ve a: `http://127.0.0.1:8000/admin/`

Inicia sesión con el usuario que creaste y verás la sección **"Landing"** con **"Consultas de contacto"**.

## Estructura de Datos Almacenados

Cada petición guarda:
- **Nombre** del contacto
- **Email**
- **Tipo de consulta** (Producto & Web3 / Docencia / Consultoría)
- **Mensaje**
- **Fecha y hora** de envío
- **IP** del remitente
- **User Agent** (navegador/dispositivo)

## Funcionalidades del Admin

- ✅ Ver todas las consultas
- ✅ Buscar por nombre, email o mensaje
- ✅ Filtrar por tipo de consulta y fecha
- ✅ Ver detalles completos de cada consulta
- ✅ Exportar datos (usando plugins de Django)

## Otras Opciones Disponibles

Si prefieres otra alternativa, revisa el archivo `ALTERNATIVAS_ALMACENAMIENTO.md` donde explico todas las opciones disponibles.

### Cambiar a Email (Alternativa Simple)

Si prefieres recibir las peticiones por email:

1. Edita `landing_project/urls.py`:
```python
from landing.views_email_alternative import submit_contact_email

urlpatterns = [
    # ...
    path('api/contact/', submit_contact_email, name='submit_contact'),
]
```

2. Configura el email en `settings.py`:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tu-email@gmail.com'
EMAIL_HOST_PASSWORD = 'tu-contraseña-app'  # Usa contraseña de aplicación
DEFAULT_FROM_EMAIL = 'tu-email@gmail.com'
```

### Cambiar a Archivo JSON (Alternativa Simple)

Si prefieres guardar en un archivo JSON:

1. Edita `landing_project/urls.py`:
```python
from landing.views_json_alternative import submit_contact_json

urlpatterns = [
    # ...
    path('api/contact/', submit_contact_json, name='submit_contact'),
]
```

Los datos se guardarán en `contact_submissions.json` en la raíz del proyecto.

## Notas

- Los datos se guardan automáticamente cuando alguien envía el formulario
- El formulario ahora envía los datos al backend Django en lugar de solo mostrar un alert
- Si hay un error, se muestra un mensaje al usuario
- El botón se deshabilita durante el envío para evitar duplicados
