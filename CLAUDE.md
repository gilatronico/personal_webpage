# Instrucciones para trabajar en este proyecto

Web personal de Alex Gilabert (alexgilabert.xyz). Django desplegado en Vercel.

## Changelog obligatorio

El archivo `CHANGELOG.md` es la memoria compartida del proyecto. Se usa siempre, lo trabaje Claude, Cursor u otra persona.

**Al empezar cualquier sesión:**
1. Lee `CHANGELOG.md`: el **Último punto**, los **Pendientes abiertos** y la entrada más reciente.
2. Comprueba con `git status` y `git log -1` que el estado real coincide con lo que dice el changelog. Si no coincide, avisa antes de seguir.

**Cada vez que cambies algo (código, contenido, datos o configuración):**
1. Añade una entrada nueva arriba del **Historial** con este formato:
   ```
   ### AAAA-MM-DD #n · Título corto de qué cambia para el visitante
   - **Estado:** en local, sin commit | commit `abc1234` | desplegado
   - **Qué:** lo que cambia, en lenguaje de producto
   - **Archivos:** rutas tocadas (y versión de CSS/JS si se sube)
   - **Pendiente de esta entrada:** lo que falta, si falta algo
   ```
2. Actualiza **Último punto** (fecha, estado, qué hay en producción, siguiente paso).
3. Actualiza **Pendientes abiertos**: añade lo que detectes y marca `[x]` lo que cierres (con la fecha).
4. Al hacer commit, pon el hash en la entrada y cambia su estado. Al desplegar, actualiza "Producción".

No borres entradas antiguas. Si algo se revierte, se añade una entrada nueva que lo explique.

## Notas del proyecto

- Plantillas: `landing/templates/landing/` (`home.html`, `web3.html`, `article.html`, `partials/`).
- La versión inglesa (`/en/`) se genera con `landing/i18n.py`: cada texto nuevo con `data-i18n` necesita su clave en inglés ahí.
- Contenido editable: `landing/content.py` y `data/*.json`.
- Al cambiar un CSS o JS, sube su `?v=` en las plantillas que lo cargan para evitar la caché.
