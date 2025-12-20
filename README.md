# Landing Page Personal - Alejandro Gilabert

Proyecto Django que contiene la landing page profesional de Alejandro Gilabert.

**🌐 Desplegado en**: [Vercel](https://vercel.com)  
**📦 Repositorio**: [GitHub](https://github.com)

## 🚀 Inicio Rápido

## Inicio Rápido

### Opción 1: Script Automático (Recomendado)

**En macOS/Linux:**
```bash
./start.sh
```

**En Windows:**
```bash
start.bat
```

El script automáticamente:
- Crea el entorno virtual si no existe
- Instala las dependencias
- Ejecuta las migraciones
- Inicia el servidor

### Opción 2: Instalación Manual

1. Crear un entorno virtual:
```bash
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecutar migraciones (si es necesario):
```bash
python3 manage.py migrate
```

4. Copiar las imágenes estáticas (si no están ya copiadas):
```bash
# Copiar desde el directorio original:
cp -r ../images/* static/images/
```

5. Ejecutar el servidor de desarrollo:
```bash
python3 manage.py runserver
```

6. Abrir en el navegador:
```
http://127.0.0.1:8000/
```

## Estructura del Proyecto

```
landing_personal/
├── landing_project/      # Configuración del proyecto Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── landing/              # App principal
│   ├── views.py
│   └── templates/
│       └── landing/
│           └── index_professional.html
├── static/               # Archivos estáticos (CSS, JS, imágenes)
│   └── images/
├── manage.py
└── requirements.txt
```

## Notas

- El template `index_professional.html` contiene todo el HTML, CSS y JavaScript del sitio original
- Las rutas de imágenes están configuradas para usar `/static/images/`
- El sitio es completamente estático, no requiere base de datos para funcionar
- Para producción, configura `DEBUG = False` y ajusta `ALLOWED_HOSTS` en `settings.py`

## 📤 Git y GitHub

### Scripts de Push Automático

**macOS/Linux:**
```bash
chmod +x git-push.sh
./git-push.sh "Mensaje del commit"
```

**Windows:**
```bash
git-push.bat "Mensaje del commit"
```

El script automáticamente:
- Verifica el estado del repositorio
- Agrega todos los cambios
- Hace commit con tu mensaje
- Hace push a GitHub

### Configuración Inicial de Git

Si es la primera vez que subes el proyecto:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

## 🌐 Despliegue en Vercel

Para desplegar en Vercel, sigue la guía completa en [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

**Resumen rápido:**
1. Sube tu código a GitHub
2. Conecta el repositorio en Vercel
3. Configura las variables de entorno
4. ¡Despliega!

## 🔒 Seguridad

- Rate limiting configurado para prevenir spam
- Honeypot anti-bot en formularios
- Variables de entorno para datos sensibles
- Logging de intentos bloqueados

Ver [RATE_LIMITING.md](./RATE_LIMITING.md) para más detalles.

## 📝 Scripts Útiles

- `./push.sh` - Script para subir cambios a GitHub fácilmente
- `./start.sh` - Script para iniciar el servidor de desarrollo

## 🛠️ Tecnologías

- **Django** - Framework web
- **Redis** - Caché para rate limiting (django-ratelimit)
- **Vercel** - Plataforma de despliegue

## 📝 Notas

- La documentación de configuración local está en `docs_local/` (no se sube al repo)
- El proyecto usa Redis para el rate limiting (requiere Redis corriendo localmente)
- Para producción, configura las variables de entorno en Vercel
