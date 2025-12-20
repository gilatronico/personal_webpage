#!/bin/bash

# Script para facilitar el push a GitHub
# Uso: ./git-push.sh "mensaje del commit"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Script de actualización y push a GitHub${NC}\n"

# Verificar que estamos en un repositorio git
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: No estás en un repositorio git${NC}"
    echo "Inicializando repositorio..."
    git init
fi

# Verificar que hay cambios
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No hay cambios para commitear${NC}"
    exit 0
fi

# Mostrar estado
echo -e "${YELLOW}📋 Estado actual:${NC}"
git status --short
echo ""

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

# Agregar todos los cambios
echo -e "${GREEN}➕ Agregando cambios...${NC}"
git add .

# Hacer commit
echo -e "${GREEN}💾 Haciendo commit...${NC}"
git commit -m "$commit_message"

# Verificar si hay un remote configurado
if ! git remote | grep -q origin; then
    echo -e "${YELLOW}⚠️  No hay remote 'origin' configurado${NC}"
    echo "Por favor, agrega tu repositorio de GitHub:"
    echo "  git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
    exit 1
fi

# Obtener el branch actual
current_branch=$(git branch --show-current)

# Hacer push
echo -e "${GREEN}📤 Haciendo push a origin/$current_branch...${NC}"
if git push -u origin "$current_branch"; then
    echo -e "\n${GREEN}✅ ¡Push completado exitosamente!${NC}"
    echo -e "${GREEN}🔗 Revisa tu repositorio en GitHub${NC}"
else
    echo -e "\n${RED}❌ Error al hacer push${NC}"
    echo "Verifica que tengas permisos y que el repositorio exista"
    exit 1
fi
