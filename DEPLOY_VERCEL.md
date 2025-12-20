# Despliegue en Vercel

Esta guía te ayudará a desplegar tu landing page Django en Vercel.

## Prerrequisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Repositorio en GitHub con el código
3. CLI de Vercel instalado (opcional, puedes usar la interfaz web)

## Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en GitHub:

```bash
# Si aún no has subido a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, ve a tu proyecto → Settings → Environment Variables y agrega:

```
SECRET_KEY=tu-secret-key-super-segura-aqui
DEBUG=False
ALLOWED_HOSTS=tu-dominio.vercel.app,www.tu-dominio.com
EMAIL_HOST_USER=agilabertcomunicaciones@gmail.com
EMAIL_HOST_PASSWORD=TU_CONTRASEÑA_DE_APLICACION_AQUI
DEFAULT_FROM_EMAIL=agilabertcomunicaciones@gmail.com
CONTACT_EMAIL=agilabertcomunicaciones@gmail.com
```

**⚠️ IMPORTANTE**: 
- Reemplaza `TU_CONTRASEÑA_DE_APLICACION_AQUI` con tu contraseña de aplicación real de Gmail
- Esta contraseña es la que generaste en [Google App Passwords](https://myaccount.google.com/apppasswords)
- **NUNCA** compartas esta contraseña públicamente

**⚠️ IMPORTANTE**: 
- Genera un `SECRET_KEY` seguro para producción (puedes usar: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- Cambia `DEBUG` a `False` en producción
- Ajusta `ALLOWED_HOSTS` con tu dominio real

### 3. Desplegar desde GitHub

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Django
5. Configura:
   - **Framework Preset**: Other
   - **Root Directory**: `landing_personal` (si tu proyecto está en una subcarpeta)
   - **Build Command**: (dejar vacío o `pip install -r requirements.txt`)
   - **Output Directory**: (dejar vacío)
6. Click en "Deploy"

### 4. Configurar Build Settings (si es necesario)

Si Vercel no detecta automáticamente Django, puedes crear un `vercel.json` (ya está incluido en el proyecto).

### 5. Verificar el Despliegue

Una vez desplegado:
- Vercel te dará una URL como `tu-proyecto.vercel.app`
- Visita la URL para verificar que todo funciona
- Revisa los logs en el dashboard de Vercel si hay errores

## Configuración Adicional

### Base de Datos

Para producción, considera usar una base de datos externa:
- **PostgreSQL**: Vercel Postgres (recomendado)
- **SQLite**: Solo para desarrollo (no recomendado para producción)

### Archivos Estáticos

Vercel maneja automáticamente los archivos estáticos si están en `static/`. Asegúrate de ejecutar:

```bash
python manage.py collectstatic
```

Antes de hacer commit (aunque Vercel puede hacerlo automáticamente).

### Migraciones

Las migraciones se ejecutan automáticamente en Vercel durante el build. Si necesitas ejecutarlas manualmente, puedes usar Vercel CLI:

```bash
vercel env pull .env.local
python manage.py migrate
```

## Troubleshooting

### Error: "Module not found"
- Verifica que `requirements.txt` incluya todas las dependencias
- Revisa los logs de build en Vercel

### Error: "SECRET_KEY not set"
- Asegúrate de haber configurado la variable de entorno `SECRET_KEY` en Vercel

### Error: "Static files not found"
- Verifica que `STATIC_ROOT` y `STATIC_URL` estén correctamente configurados
- Asegúrate de que `collectstatic` se ejecute durante el build

### Error: "Database locked"
- SQLite no es adecuado para producción en Vercel
- Considera usar PostgreSQL o deshabilitar la base de datos si no la necesitas

## Actualizaciones

Para actualizar el sitio después de hacer cambios:

```bash
# Usa el script de git
./git-push.sh "Descripción de los cambios"

# O manualmente
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel detectará automáticamente el push y desplegará la nueva versión.

## Dominio Personalizado

Para usar tu propio dominio:

1. Ve a Settings → Domains en tu proyecto de Vercel
2. Agrega tu dominio
3. Sigue las instrucciones para configurar los DNS
4. Actualiza `ALLOWED_HOSTS` en las variables de entorno

## Monitoreo

- Revisa los logs en el dashboard de Vercel
- Configura alertas para errores
- Monitorea el uso de recursos

## Recursos

- [Documentación de Vercel para Python](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python)
- [Django en Vercel](https://vercel.com/guides/deploying-django-to-vercel)
