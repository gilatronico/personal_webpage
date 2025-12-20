# 🔐 Guía para Generar Contraseña de Aplicación de Gmail

## ⚠️ IMPORTANTE
Esta contraseña es diferente a tu contraseña normal de Gmail. Es una contraseña de 16 caracteres específica para aplicaciones.

## Pasos Detallados

### Paso 1: Activar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, haz clic en **"Seguridad"**
3. Busca la sección **"Cómo iniciar sesión en Google"**
4. Si **"Verificación en 2 pasos"** está **desactivada**:
   - Haz clic en **"Verificación en 2 pasos"**
   - Sigue las instrucciones para activarla
   - Necesitarás tu teléfono para completar el proceso
5. Si ya está activada, continúa al Paso 2

### Paso 2: Generar Contraseña de Aplicación

1. En la misma página de **"Seguridad"**, busca la sección **"Cómo iniciar sesión en Google"**
2. Haz clic en **"Contraseñas de aplicaciones"**
   - Si no ves esta opción, asegúrate de que la verificación en 2 pasos esté activada
3. Te pedirá que inicies sesión de nuevo (seguridad adicional)
4. En la página de "Contraseñas de aplicaciones":
   - **Selecciona la app**: Elige **"Correo"**
   - **Selecciona el dispositivo**: Elige **"Otro (nombre personalizado)"**
   - **Escribe un nombre**: Por ejemplo, "Django Landing Page"
   - Haz clic en **"Generar"**
5. **¡IMPORTANTE!** Copia la contraseña de 16 caracteres que aparece
   - Formato: `xxxx xxxx xxxx xxxx` (con espacios) o `xxxxxxxxxxxxxxxx` (sin espacios)
   - **Guárdala en un lugar seguro** - solo se muestra una vez

### Paso 3: Configurar en Django

1. Abre el archivo `landing_project/settings.py`
2. Busca la línea:
   ```python
   EMAIL_HOST_PASSWORD = 'TU_CONTRASEÑA_DE_APLICACION_AQUI'
   ```
3. Reemplaza `'TU_CONTRASEÑA_DE_APLICACION_AQUI'` con tu contraseña de 16 caracteres
   - Puedes usar con o sin espacios, ambos funcionan
   - Ejemplo: `EMAIL_HOST_PASSWORD = 'abcd efgh ijkl mnop'`
   - O: `EMAIL_HOST_PASSWORD = 'abcdefghijklmnop'`

### Paso 4: Verificar Configuración

1. Asegúrate de que en `settings.py` esté:
   ```python
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = 'smtp.gmail.com'
   EMAIL_PORT = 587
   EMAIL_USE_TLS = True
   EMAIL_HOST_USER = 'agilabertcomunicaciones@gmail.com'
   EMAIL_HOST_PASSWORD = 'tu-contraseña-de-16-caracteres'
   DEFAULT_FROM_EMAIL = 'agilabertcomunicaciones@gmail.com'
   ```

2. Ejecuta el servidor:
   ```bash
   python manage.py runserver
   ```

3. Envía un mensaje de prueba desde el formulario

4. Revisa tu bandeja de entrada (y carpeta de spam) en `agilabertcomunicaciones@gmail.com`

## 🔒 Seguridad

- ⚠️ **NUNCA** subas `settings.py` con la contraseña real a Git
- La contraseña de aplicación es específica para esta aplicación
- Puedes revocarla en cualquier momento desde Google
- Si cambias tu contraseña de Gmail, las contraseñas de aplicación siguen funcionando

## ❓ Solución de Problemas

### Error: "Username and Password not accepted"
- Verifica que la contraseña de aplicación sea correcta (16 caracteres)
- Asegúrate de copiar sin espacios extra
- Verifica que la verificación en 2 pasos esté activada

### Error: "Less secure app access"
- Gmail ya no usa "menos seguras", usa contraseñas de aplicación
- Asegúrate de usar una contraseña de aplicación, no tu contraseña normal

### Los emails van a spam
- Revisa la carpeta de spam
- Marca como "No es spam" los primeros emails
- Considera usar un servicio profesional como SendGrid para producción

## 📝 Nota sobre Variables de Entorno (Recomendado)

Para mayor seguridad, puedes usar variables de entorno:

1. Instala: `pip install python-decouple`
2. Crea archivo `.env` en la raíz:
   ```
   EMAIL_HOST_PASSWORD=tu-contraseña-de-16-caracteres
   ```
3. En `settings.py`:
   ```python
   from decouple import config
   EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
   ```
4. Agrega `.env` a `.gitignore`
