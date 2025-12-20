@echo off
REM Script para iniciar el proyecto Django Landing Personal (Windows)
REM Uso: start.bat

echo ========================================
echo   Django Landing Personal
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python no esta instalado
    pause
    exit /b 1
)

REM Verificar o crear entorno virtual
if not exist "venv" (
    echo Creando entorno virtual...
    python -m venv venv
    echo Entorno virtual creado
) else (
    echo Entorno virtual encontrado
)

REM Activar entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate.bat

REM Actualizar pip
echo Actualizando pip...
python -m pip install --upgrade pip --quiet

REM Instalar dependencias
if exist "requirements.txt" (
    echo Instalando dependencias...
    pip install -r requirements.txt --quiet
    echo Dependencias instaladas
) else (
    echo No se encontro requirements.txt
)

REM Ejecutar migraciones
echo Ejecutando migraciones...
python manage.py migrate --noinput
echo Migraciones completadas

REM Recolectar archivos estáticos
echo Verificando archivos estaticos...
python manage.py collectstatic --noinput --clear >nul 2>&1

echo.
echo ========================================
echo   Servidor iniciando...
echo ========================================
echo.
echo Abre tu navegador en:
echo http://127.0.0.1:8000/
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar servidor
python manage.py runserver

pause
