#!/bin/bash

# Script simple para subir cambios a GitHub
# Uso: ./push.sh "mensaje del commit"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Subir Cambios a GitHub          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}\n"

# Verificar que estamos en un repositorio git
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: No estás en un repositorio git${NC}"
    exit 1
fi

# Verificar si hay un remote configurado
if ! git remote | grep -q origin; then
    echo -e "${RED}❌ Error: No hay remote 'origin' configurado${NC}"
    echo -e "${YELLOW}💡 Configura el remote primero:${NC}"
    echo "   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
    exit 1
fi

# Obtener mensaje del commit
if [ -z "$1" ]; then
    echo -e "${YELLOW}💬 Ingresa el mensaje del commit:${NC}"
    read -r commit_message
else
    commit_message="$1"
fi

# Validar que el mensaje no esté vacío
if [ -z "$commit_message" ]; then
    echo -e "${RED}❌ Error: El mensaje del commit no puede estar vacío${NC}"
    exit 1
fi

# Mostrar cambios
echo -e "\n${BLUE}📋 Cambios detectados:${NC}"
git status --short
echo ""

# Agregar todos los cambios
echo -e "${GREEN}➕ Agregando cambios...${NC}"
git add .

# Hacer commit
echo -e "${GREEN}💾 Haciendo commit: \"$commit_message\"...${NC}"
if ! git commit -m "$commit_message"; then
    echo -e "${RED}❌ Error: No se pudo hacer el commit${NC}"
    echo -e "${YELLOW}💡 Puede que no haya cambios para commitear${NC}"
    exit 1
fi

# Obtener el branch actual
current_branch=$(git branch --show-current)

# Hacer push
echo -e "${GREEN}📤 Subiendo a origin/$current_branch...${NC}"
if git push -u origin "$current_branch" 2>&1; then
    echo -e "\n${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ¡Push completado exitosamente!   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}\n"
    echo -e "${BLUE}🔗 Revisa tu repositorio en GitHub${NC}"
else
    echo -e "\n${RED}❌ Error al hacer push${NC}"
    echo -e "${YELLOW}💡 Verifica que:${NC}"
    echo "   - Tengas permisos en el repositorio"
    echo "   - El repositorio exista en GitHub"
    echo "   - Estés autenticado en GitHub"
    exit 1
fi

