"""
Django settings for landing_project project.
"""

from pathlib import Path
import os
import secrets

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
# En producción, usar variable de entorno (Vercel > Settings > Environment Variables).
# Si no está configurada, se genera una clave aleatoria por proceso en vez de usar un
# valor público fijo: ese valor por defecto ("django-insecure-change-this...") es un
# patrón conocido y rastreable en repos públicos de GitHub, así que nunca debe usarse
# en producción aunque sea "solo" un fallback.
SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(50)

# SECURITY WARNING: don't run with debug turned on in production!
# En Vercel, detectar automáticamente si estamos en producción
DEBUG_ENV = os.environ.get('DEBUG', '').lower()
# Si VERCEL está definido o DEBUG es explícitamente False, estamos en producción
if os.environ.get('VERCEL') or DEBUG_ENV in ('false', '0', 'no'):
    DEBUG = False
else:
    DEBUG = DEBUG_ENV not in ('false', '0', 'no', '') if DEBUG_ENV else True

# Allowed hosts para producción.
# ALLOWED_HOSTS protege contra ataques de Host header (envenenamiento de caché,
# enlaces de reseteo de contraseña con dominio falso, etc.) incluso detrás de Vercel:
# la plataforma no filtra esto por ti, así que '*' anula la protección por completo.
if os.environ.get('VERCEL'):
    # INCIDENTE 2026-08-02: esto antes usaba el valor de la variable ALLOWED_HOSTS de
    # Vercel *en vez de* los dominios reales si esa variable existía. Ya había una
    # variable ALLOWED_HOSTS configurada de antes (con un valor que no incluía
    # alexgilabert.xyz) y el sitio entero empezó a devolver 400 Bad Request.
    # Ahora los dominios reales SIEMPRE están incluidos, y cualquier valor de esa
    # variable solo se añade encima — nunca puede faltar el dominio real por muy
    # rara que sea la variable de entorno.
    default_hosts = ['alexgilabert.xyz', 'www.alexgilabert.xyz', '.vercel.app']
    allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
    extra_hosts = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
    ALLOWED_HOSTS = list(dict.fromkeys(default_hosts + extra_hosts))
else:
    # En desarrollo, usar la variable de entorno o permitir localhost
    allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1')
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_env.split(',')]

CSRF_TRUSTED_ORIGINS = ['https://alexgilabert.xyz', 'https://www.alexgilabert.xyz']

# Cabeceras de seguridad de producción (checklist estándar de Django). Solo se activan
# fuera de DEBUG: forzarlas en local rompería `runserver` en http://127.0.0.1.
if not DEBUG:
    # Vercel termina TLS en el borde y reenvía la petición por HTTP internamente,
    # indicando el protocolo original en X-Forwarded-Proto. Sin esto, Django no
    # sabría distinguir HTTPS real de HTTP y SECURE_SSL_REDIRECT causaría un bucle.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
    # HSTS: le dice al navegador que recuerde usar HTTPS en este dominio.
    # Se empieza en un valor bajo (1 día) para poder revertir sin castigar a los
    # visitantes si algo fallara; se puede subir a 31536000 (1 año) con confianza
    # una vez confirmado que todo funciona bien en HTTPS de forma sostenida.
    SECURE_HSTS_SECONDS = 86400
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # django_ratelimit solo en producción (Vercel) para evitar problemas en desarrollo local
    # En desarrollo local, el rate limiting se maneja con lógica personalizada en views.py
] + (['django_ratelimit'] if os.environ.get('VERCEL') else []) + [
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
REDIS_URL = os.environ.get('REDIS_URL', '').strip()
# Antes esto excluía Redis explícitamente en Vercel ("and not os.environ.get('VERCEL')"),
# que es justo donde hace falta: LocMemCache vive en memoria de un proceso, y cada
# invocación serverless es un proceso nuevo y aislado, así que el rate limiting nunca
# persistía entre peticiones en producción. Con esto, si REDIS_URL está configurada
# (en cualquier entorno) se usa; si no, cae a LocMemCache como hasta ahora.
if REDIS_URL:
    try:
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': REDIS_URL,
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                }
            }
        }
    except Exception:
        # Si falla la configuración de Redis, usar fallback
        REDIS_URL = ''
        
if not REDIS_URL:
    # Sin Redis, usar LocMemCache (simple y funciona para desarrollo local)
    # En producción (Vercel), se recomienda usar Redis para rate limiting efectivo
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
# STATIC_ROOT para collectstatic (no se usa en Vercel, pero se necesita para compatibilidad)
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Directorio donde están los archivos estáticos (se sirven directamente desde aquí en Vercel)
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
# En desarrollo local sin Redis, django_ratelimit funcionará pero mostrará warnings
# En producción (Vercel), se recomienda usar Redis para rate limiting efectivo
RATELIMIT_ENABLE = True
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
# En Vercel serverless, solo usar console logging (no file logging)
if os.environ.get('VERCEL'):
    # En Vercel, solo usar console logging
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
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'landing': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
        },
    }
else:
    # En desarrollo local, usar console y file logging
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

