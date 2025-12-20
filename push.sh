#!/bin/bash

# Script completo para subir cambios a GitHub y verificar deployment
# Uso: ./push.sh "mensaje del commit"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Push Completo: GitHub + Vercel         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}\n"

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

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    # Hay cambios sin commitear - necesitamos mensaje de commit
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
    
    echo -e "\n${BLUE}📋 Cambios detectados:${NC}"
    git status --short
    
    # Contar archivos modificados
    modified_count=$(git status --short | wc -l | tr -d ' ')
    echo -e "${CYAN}   Total: $modified_count archivo(s)${NC}\n"
    
    # Agregar todos los cambios
    echo -e "${GREEN}➕ Agregando cambios al staging...${NC}"
    git add .
    
    # Mostrar resumen de lo que se va a commitear
    echo -e "${CYAN}📦 Archivos en staging:${NC}"
    git diff --cached --name-status | sed 's/^/   /'
    echo ""
    
    # Hacer commit
    echo -e "${GREEN}💾 Haciendo commit: \"$commit_message\"...${NC}"
    if ! git commit -m "$commit_message"; then
        echo -e "${RED}❌ Error: No se pudo hacer el commit${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Commit creado exitosamente${NC}\n"
else
    # No hay cambios, verificar si hay commits pendientes de push
    commits_ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    if [ "$commits_ahead" = "0" ] || [ -z "$commits_ahead" ]; then
        echo -e "${YELLOW}⚠️  No hay cambios para commitear${NC}"
        echo -e "${YELLOW}💡 No hay commits pendientes de subir${NC}"
        echo -e "${CYAN}ℹ️  El repositorio está actualizado${NC}\n"
        exit 0
    else
        echo -e "${BLUE}ℹ️  No hay cambios nuevos, pero hay $commits_ahead commit(s) pendiente(s) de subir${NC}"
        echo -e "${CYAN}📝 Últimos commits pendientes:${NC}"
        git log @{u}..HEAD --oneline -5 | sed 's/^/   /'
        echo ""
        echo -e "${GREEN}📤 Subiendo commits existentes...${NC}\n"
    fi
fi

# Obtener el branch actual
current_branch=$(git branch --show-current)

# Mostrar información del repositorio antes de push
echo -e "\n${CYAN}📊 Información del repositorio:${NC}"
remote_url=$(git remote get-url origin 2>/dev/null || echo "No configurado")
echo -e "   ${BLUE}Remote:${NC} $remote_url"
echo -e "   ${BLUE}Branch:${NC} $current_branch"
commits_ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
if [ "$commits_ahead" != "0" ] && [ -n "$commits_ahead" ]; then
    echo -e "   ${BLUE}Commits pendientes:${NC} $commits_ahead"
fi
echo ""

# Hacer push
echo -e "${GREEN}📤 Subiendo a origin/$current_branch...${NC}"
push_output=$(git push -u origin "$current_branch" 2>&1)
push_exit_code=$?

if [ $push_exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ Push completado exitosamente${NC}\n"
    
    # Mostrar información post-push
    echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   📋 Resumen del Push                       ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}\n"
    
    # Obtener información del último commit
    last_commit=$(git log -1 --pretty=format:"%h - %s (%an, %ar)")
    echo -e "${BLUE}📝 Último commit:${NC}"
    echo -e "   $last_commit\n"
    
    # Obtener URL del repositorio
    repo_url=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    if [ -n "$repo_url" ]; then
        echo -e "${BLUE}🔗 Repositorio:${NC} $repo_url"
        echo -e "${BLUE}🔗 Commits:${NC} $repo_url/commits/$current_branch"
        echo ""
    fi
    
    # Verificar si hay configuración de Vercel
    if [ -f "vercel.json" ] || [ -d ".vercel" ]; then
        echo -e "${MAGENTA}╔══════════════════════════════════════════════╗${NC}"
        echo -e "${MAGENTA}║   🌐 Información de Vercel                    ║${NC}"
        echo -e "${MAGENTA}╚══════════════════════════════════════════════╝${NC}\n"
        echo -e "${YELLOW}ℹ️  Vercel debería detectar el push automáticamente${NC}"
        echo -e "${YELLOW}💡 Verifica el deployment en:${NC}"
        echo -e "   https://vercel.com/dashboard\n"
        
        # Verificar si hay GitHub Actions configurado
        if [ -d ".github/workflows" ]; then
            echo -e "${GREEN}✅ GitHub Actions configurado${NC}"
            echo -e "${YELLOW}💡 Revisa el workflow en:${NC}"
            echo -e "   $repo_url/actions\n"
        fi
    fi
    
    # Mostrar estado final
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ¡Proceso completado exitosamente!      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}\n"
    
    # Verificar si hay cambios sin commitear después del push
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Nota: Hay cambios sin commitear${NC}"
        echo -e "${YELLOW}💡 Ejecuta './push.sh' nuevamente para subirlos${NC}\n"
    fi
    
else
    echo -e "\n${RED}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ Error al hacer push                     ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════╝${NC}\n"
    echo -e "${YELLOW}💡 Posibles soluciones:${NC}"
    echo -e "   1. Verifica que tengas permisos en el repositorio"
    echo -e "   2. Asegúrate de que el repositorio exista en GitHub"
    echo -e "   3. Verifica tu autenticación en GitHub"
    echo -e "   4. Si hay conflictos, ejecuta: git pull origin $current_branch"
    echo ""
    echo -e "${RED}Detalles del error:${NC}"
    echo "$push_output" | tail -5
    exit 1
fi

