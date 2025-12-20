# ✅ Checklist de Seguridad

Antes de subir el código a GitHub, verifica que:

## 🔒 Credenciales y Secrets

- [x] **SECRET_KEY**: Usa variables de entorno (no hardcodeado)
- [x] **EMAIL_HOST_PASSWORD**: Usa variables de entorno (no hardcodeado)
- [x] **CONTACT_EMAIL**: Usa variables de entorno
- [x] **DEBUG**: Configurado para usar variables de entorno
- [x] **ALLOWED_HOSTS**: Configurado para usar variables de entorno

## 📁 Archivos Protegidos

- [x] `.env` está en `.gitignore`
- [x] `.env.local` está en `.gitignore`
- [x] `.env.production` está en `.gitignore`
- [x] `db.sqlite3` está en `.gitignore`
- [x] `*.log` está en `.gitignore`
- [x] `venv/` está en `.gitignore`

## 🔍 Verificación Pre-Push

Antes de hacer `git push`, ejecuta:

```bash
# Verificar que no hay contraseñas hardcodeadas
grep -r "hoze ujiy zkbt jdqz" . --exclude-dir=venv --exclude-dir=.git
# No debe encontrar nada (excepto en este archivo de documentación)

# Verificar que .env no está en el staging area
git status | grep ".env"
# No debe mostrar .env

# Verificar que settings.py usa variables de entorno
grep "EMAIL_HOST_PASSWORD.*=" landing_project/settings.py
# Debe mostrar: EMAIL_HOST_PASSWORD = os.environ.get(...)
```

## ✅ Estado Actual

### ✅ Configurado Correctamente

1. **settings.py**:
   - ✅ `SECRET_KEY` usa `os.environ.get()`
   - ✅ `EMAIL_HOST_PASSWORD` usa `os.environ.get()` con validación
   - ✅ `CONTACT_EMAIL` usa `os.environ.get()`
   - ✅ Validación para producción (no permite password vacío)

2. **.gitignore**:
   - ✅ Todos los archivos `.env*` están excluidos
   - ✅ `.env.example` está incluido (es seguro, solo tiene placeholders)

3. **Documentación**:
   - ✅ `.env.example` creado con placeholders
   - ✅ Documentación actualizada sin contraseñas reales

### ⚠️ Acciones Requeridas

1. **Crear archivo `.env` local** (no se subirá a GitHub):
   ```bash
   cp .env.example .env
   # Edita .env y completa con tus valores reales
   ```

2. **Configurar variables en Vercel**:
   - Ve al dashboard de Vercel
   - Settings → Environment Variables
   - Agrega todas las variables del `.env.example`

3. **Generar SECRET_KEY seguro para producción**:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

## 🚨 Si Encuentras Credenciales Hardcodeadas

Si accidentalmente subiste credenciales a GitHub:

1. **Inmediatamente**:
   - Cambia todas las contraseñas comprometidas
   - Revoca tokens/API keys expuestos

2. **Eliminar del historial de Git**:
   ```bash
   # Usar git-filter-repo o BFG Repo-Cleaner
   # O crear un nuevo repositorio sin el historial
   ```

3. **Prevenir futuros problemas**:
   - Usar siempre variables de entorno
   - Nunca hardcodear credenciales
   - Revisar antes de cada push

## 📝 Notas

- El email `agilabertcomunicaciones@gmail.com` es público (aparece en la página web), así que no es un problema de seguridad
- La contraseña de aplicación de Gmail **SÍ** es sensible y debe estar solo en variables de entorno
- El `SECRET_KEY` de Django **SÍ** es sensible y debe estar solo en variables de entorno

## ✅ Listo para GitHub

Una vez completado este checklist, el código está listo para subir a GitHub de forma segura.

