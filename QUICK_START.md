# 🚀 Inicio Rápido - GitHub y Vercel

Guía rápida para subir tu proyecto a GitHub y desplegarlo en Vercel.

## 📋 Checklist Pre-Deploy

- [ ] Tienes cuenta en GitHub
- [ ] Tienes cuenta en Vercel
- [ ] Has revisado el `.gitignore` (no subir archivos sensibles)
- [ ] Has configurado las variables de entorno localmente

## 🎯 Pasos Rápidos

### 1. Crear Repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `landing-personal`
3. Crea el repositorio (sin README)

### 2. Inicializar Git y Subir Código

```bash
cd landing_personal

# Inicializar git (si no está inicializado)
git init
git branch -M main

# Agregar remote
git remote add origin https://github.com/TU_USUARIO/landing-personal.git

# Primer commit
git add .
git commit -m "Initial commit: Landing page profesional"

# Push inicial
git push -u origin main
```

### 3. Desplegar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Configura:
   - **Framework Preset**: Other
   - **Root Directory**: `landing_personal` (si está en subcarpeta)
4. Agrega variables de entorno:
   ```
   SECRET_KEY=genera-uno-seguro
   DEBUG=False
   ALLOWED_HOSTS=tu-proyecto.vercel.app
   EMAIL_HOST_USER=agilabertcomunicaciones@gmail.com
   EMAIL_HOST_PASSWORD=TU_CONTRASEÑA_DE_APLICACION_AQUI
   DEFAULT_FROM_EMAIL=agilabertcomunicaciones@gmail.com
   CONTACT_EMAIL=agilabertcomunicaciones@gmail.com
   
   ⚠️ Reemplaza TU_CONTRASEÑA_DE_APLICACION_AQUI con tu contraseña real de Gmail App Password
   ```
5. Click en "Deploy"

### 4. Usar Scripts de Git (Opcional)

Para futuros cambios:

```bash
# macOS/Linux
./git-push.sh "Descripción de los cambios"

# Windows
git-push.bat "Descripción de los cambios"
```

## 📚 Documentación Completa

- **GitHub**: [SETUP_GITHUB.md](./SETUP_GITHUB.md)
- **Vercel**: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

## ⚠️ Importante

- **NO** subas archivos `.env` a GitHub
- **NO** subas `db.sqlite3` a GitHub
- **SÍ** configura las variables de entorno en Vercel
- **SÍ** genera un `SECRET_KEY` seguro para producción

## 🔐 Generar SECRET_KEY Seguro

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copia el resultado y úsalo como variable de entorno `SECRET_KEY` en Vercel.
