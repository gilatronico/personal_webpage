# Configuración Inicial de GitHub

Esta guía te ayudará a configurar tu repositorio en GitHub y prepararlo para Vercel.

## Paso 1: Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Click en el botón "+" (arriba derecha) → "New repository"
3. Configura:
   - **Repository name**: `landing-personal` (o el nombre que prefieras)
   - **Description**: "Landing page profesional de Alejandro Gilabert"
   - **Visibility**: Private o Public (según prefieras)
   - **NO** marques "Initialize with README" (ya tenemos uno)
4. Click en "Create repository"

## Paso 2: Inicializar Git Localmente

Si aún no has inicializado git en tu proyecto:

```bash
cd landing_personal
git init
git branch -M main
```

## Paso 3: Agregar Remote de GitHub

```bash
# Reemplaza TU_USUARIO y TU_REPO con tus datos
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git

# Verificar que se agregó correctamente
git remote -v
```

## Paso 4: Primer Commit y Push

```bash
# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: Landing page profesional"

# Hacer push
git push -u origin main
```

## Paso 5: Usar el Script de Push

Para futuros cambios, puedes usar el script automático:

**macOS/Linux:**
```bash
chmod +x git-push.sh
./git-push.sh "Descripción de los cambios"
```

**Windows:**
```bash
git-push.bat "Descripción de los cambios"
```

O manualmente:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

## Verificación

1. Ve a tu repositorio en GitHub
2. Verifica que todos los archivos estén presentes
3. Revisa que el `.gitignore` esté funcionando (no deberías ver `venv/`, `db.sqlite3`, etc.)

## Archivos Importantes que DEBEN estar en GitHub

✅ `manage.py`
✅ `requirements.txt`
✅ `vercel.json`
✅ `landing_project/` (toda la carpeta)
✅ `landing/` (toda la carpeta)
✅ `static/` (toda la carpeta)
✅ `.gitignore`
✅ `README.md`
✅ Scripts de git (`git-push.sh`, `git-push.bat`)

## Archivos que NO deben estar en GitHub

❌ `venv/` (entorno virtual)
❌ `db.sqlite3` (base de datos local)
❌ `.env` (variables de entorno)
❌ `*.log` (archivos de log)
❌ `__pycache__/` (cache de Python)
❌ `.DS_Store` (archivos del sistema)

## Siguiente Paso

Una vez que tu código esté en GitHub, puedes proceder a desplegarlo en Vercel siguiendo [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
```

### Error: "failed to push some refs"
```bash
# Si hay cambios en GitHub que no tienes localmente
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "Permission denied"
- Verifica que tengas permisos de escritura en el repositorio
- Asegúrate de estar autenticado en GitHub (puedes usar GitHub CLI o SSH keys)
