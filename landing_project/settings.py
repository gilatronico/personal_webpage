"""
Django settings for landing_project project.
"""

from pathlib import Path
import os

# Crear directorio de logs si no existe (solo si es posible)
try:
    logs_dir = Path(__file__).resolve().parent.parent / 'logs'
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir, exist_ok=True)
except (OSError, PermissionError):
    # En entornos serverless como Vercel, puede que no se puedan crear directorios
    pass

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# En producción, usar variable de entorno
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production-1234567890')

# SECURITY WARNING: don't run with debug turned on in production!
# En Vercel, detectar automáticamente si estamos en producción
DEBUG = os.environ.get('DEBUG', '').lower() not in ('false', '0', 'no', '')
# Si VERCEL está definido, estamos en producción
if os.environ.get('VERCEL'):
    DEBUG = False

# Allowed hosts para producción
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_ratelimit',  # Rate limiting para protección contra spam/ataques
    'landing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'landing_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'landing_project.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
# En Vercel serverless, SQLite puede tener problemas de permisos
# Usar /tmp para la base de datos en entornos serverless
if os.environ.get('VERCEL'):
    # En Vercel, usar /tmp para la base de datos
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': '/tmp/db.sqlite3',
        }
    }
else:
    # En desarrollo local, usar la ubicación normal
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Cache Configuration
# ============================================
# django_ratelimit requiere un caché que soporte incremento atómico
# En Vercel, si no hay Redis, usar LocMemCache como fallback
REDIS_URL = os.environ.get('REDIS_URL', '')
if REDIS_URL:
    # Usar Redis si está disponible
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }
else:
    # Fallback a LocMemCache si no hay Redis (para desarrollo/Vercel sin Redis)
    # Nota: django_ratelimit puede mostrar warnings pero funcionará
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'es-es'

TIME_ZONE = 'Europe/Madrid'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email Configuration
# ============================================
# MODO PRODUCCIÓN: SMTP Gmail
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
# Email configuration - usar variables de entorno en producción
# ⚠️ NUNCA hardcodear contraseñas aquí. Usar variables de entorno.
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'agilabertcomunicaciones@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')  # ⚠️ OBLIGATORIO: Configurar en variables de entorno
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'agilabertcomunicaciones@gmail.com')

# Email donde recibir las notificaciones de contacto
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', os.environ.get('EMAIL_HOST_USER', 'agilabertcomunicaciones@gmail.com'))

# Validar que las credenciales críticas estén configuradas en producción
# Solo validar si realmente se intenta enviar un email (no al iniciar)
# Esto evita errores en el startup si falta la configuración

# Rate Limiting Configuration
# ============================================
# Configuración para protección contra spam y ataques
# Desactivar rate limiting si no hay Redis disponible (para evitar errores)
RATELIMIT_ENABLE = bool(REDIS_URL)  # Solo activar si hay Redis
RATELIMIT_USE_CACHE = 'default'  # Usar la cache de Django

# Límites para el formulario de contacto:
# - 5 peticiones por hora por IP
# - 10 peticiones por día por IP
# - 3 peticiones por minuto por IP (protección contra bursts)
CONTACT_RATE_LIMIT_PER_HOUR = 5
CONTACT_RATE_LIMIT_PER_DAY = 10
CONTACT_RATE_LIMIT_PER_MINUTE = 3

# Logging Configuration
# ============================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'landing': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

