#!/bin/bash

# Script para iniciar el proyecto Django Landing Personal
# Uso: ./start.sh

set -e  # Salir si hay algún error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Django Landing Personal${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Obtener el directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Error: Python3 no está instalado${NC}"
    exit 1
fi

# Verificar o crear entorno virtual
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creando entorno virtual...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Entorno virtual creado${NC}"
else
    echo -e "${GREEN}✓ Entorno virtual encontrado${NC}"
fi

# Activar entorno virtual
echo -e "${YELLOW}Activando entorno virtual...${NC}"
source venv/bin/activate

# Desactivar checks de django_ratelimit en desarrollo local (sin Redis)
# Esto debe establecerse ANTES de ejecutar cualquier comando de Django
export DJANGO_RATELIMIT_DISABLE_CHECKS=1

# Actualizar pip
echo -e "${YELLOW}Actualizando pip...${NC}"
pip install --upgrade pip --quiet

# Instalar dependencias
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Instalando dependencias...${NC}"
    pip install -r requirements.txt --quiet
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${YELLOW}No se encontró requirements.txt${NC}"
fi

# Ejecutar migraciones
echo -e "${YELLOW}Ejecutando migraciones...${NC}"
python3 manage.py migrate --noinput
echo -e "${GREEN}✓ Migraciones completadas${NC}"

# Recolectar archivos estáticos (solo en producción, pero útil para desarrollo)
echo -e "${YELLOW}Verificando archivos estáticos...${NC}"
python3 manage.py collectstatic --noinput --clear 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Servidor iniciando...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Abre tu navegador en:${NC}"
echo -e "${GREEN}http://127.0.0.1:8000/${NC}"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener el servidor${NC}"
echo ""

# Iniciar servidor
# La variable DJANGO_RATELIMIT_DISABLE_CHECKS ya está establecida al inicio del script
python3 manage.py runserver
