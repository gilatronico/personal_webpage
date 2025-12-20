@echo off
REM Script para facilitar el push a GitHub en Windows
REM Uso: git-push.bat "mensaje del commit"

echo 🚀 Script de actualización y push a GitHub
echo.

REM Verificar que estamos en un repositorio git
if not exist .git (
    echo ❌ Error: No estás en un repositorio git
    echo Inicializando repositorio...
    git init
)

REM Verificar que hay cambios
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No hay cambios para commitear
    exit /b 0
)

REM Mostrar estado
echo 📋 Estado actual:
git status --short
echo.

REM Obtener mensaje del commit
if "%~1"=="" (
    echo 💬 Ingresa el mensaje del commit:
    set /p commit_message=
) else (
    set commit_message=%~1
)

REM Validar que el mensaje no esté vacío
if "%commit_message%"=="" (
    echo ❌ Error: El mensaje del commit no puede estar vacío
    exit /b 1
)

REM Agregar todos los cambios
echo ➕ Agregando cambios...
git add .

REM Hacer commit
echo 💾 Haciendo commit...
git commit -m "%commit_message%"

REM Verificar si hay un remote configurado
git remote | findstr /C:"origin" >nul
if errorlevel 1 (
    echo ⚠️  No hay remote 'origin' configurado
    echo Por favor, agrega tu repositorio de GitHub:
    echo   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
    exit /b 1
)

REM Obtener el branch actual
for /f "tokens=2" %%b in ('git branch --show-current') do set current_branch=%%b

REM Hacer push
echo 📤 Haciendo push a origin/%current_branch%...
git push -u origin %current_branch%
if errorlevel 1 (
    echo.
    echo ❌ Error al hacer push
    echo Verifica que tengas permisos y que el repositorio exista
    exit /b 1
) else (
    echo.
    echo ✅ ¡Push completado exitosamente!
    echo 🔗 Revisa tu repositorio en GitHub
)
