# ✅ Email Configurado Correctamente

## Configuración Actual

- **Email de envío**: `agilabertcomunicaciones@gmail.com`
- **Email de recepción**: `agilabertcomunicaciones@gmail.com`
- **Aplicación Gmail**: `correo_landing`
- **Estado**: ✅ Configurado y listo para usar

## Probar la Configuración

Ejecuta el script de prueba:
```bash
python test_email.py
```

Si todo está correcto, recibirás un email de prueba en `agilabertcomunicaciones@gmail.com`.

## Funcionamiento

Cada vez que alguien envíe el formulario de contacto:

1. ✅ Se guarda en la base de datos (SQLite)
2. ✅ Se envía un email a `agilabertcomunicaciones@gmail.com` con:
   - Nombre y email del contacto
   - Tipo de consulta
   - Mensaje completo
   - Fecha, hora, IP y ID de registro

## Ver las Peticiones

### Opción 1: Email
Revisa tu bandeja de entrada en `agilabertcomunicaciones@gmail.com`

### Opción 2: Django Admin
1. Ve a: `http://127.0.0.1:8000/admin/`
2. Inicia sesión con tu usuario admin
3. Ve a **"Landing"** → **"Consultas de contacto"**
4. Verás todas las peticiones guardadas

## Notas de Seguridad

- ⚠️ La contraseña de aplicación está en `settings.py`
- ⚠️ **NO subas este archivo a Git público** con la contraseña
- ✅ El archivo `.gitignore` ya está configurado para proteger archivos sensibles

## Si Necesitas Cambiar la Contraseña

1. Ve a: https://myaccount.google.com/apppasswords
2. Revoca la contraseña antigua si es necesario
3. Genera una nueva
4. Actualiza `EMAIL_HOST_PASSWORD` en `settings.py`
