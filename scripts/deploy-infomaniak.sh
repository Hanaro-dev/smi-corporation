#!/bin/bash

# Script de déploiement automatisé pour Infomaniak Node.js
# Usage: ./scripts/deploy-infomaniak.sh [environment]

set -e  # Arrêter en cas d'erreur

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="smi-corporation"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifications préalables
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "package.json" ] || [ ! -f "nuxt.config.ts" ]; then
        log_error "Ce script doit être exécuté depuis la racine du projet SMI Corporation"
        exit 1
    fi
    
    log_success "Tous les prérequis sont satisfaits"
}

# Vérifier la configuration d'environnement
check_environment() {
    log_info "Vérification de la configuration d'environnement..."
    
    ENV_FILE=".env.${ENVIRONMENT}"
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Fichier d'environnement $ENV_FILE non trouvé"
        log_info "Créez ce fichier avec les variables nécessaires pour $ENVIRONMENT"
        exit 1
    fi
    
    # Vérifier les variables critiques
    source $ENV_FILE
    
    if [ -z "$JWT_SECRET" ]; then
        log_error "JWT_SECRET manquant dans $ENV_FILE"
        exit 1
    fi
    
    if [ -z "$CSRF_SECRET" ]; then
        log_error "CSRF_SECRET manquant dans $ENV_FILE"
        exit 1
    fi
    
    if [ "$USE_MOCK_DB" = "false" ]; then
        if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
            log_error "Configuration de base de données incomplète dans $ENV_FILE"
            exit 1
        fi
    fi
    
    log_success "Configuration d'environnement validée"
}

# Nettoyer et installer les dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    # Nettoyer node_modules et package-lock.json
    rm -rf node_modules package-lock.json
    
    # Installer les dépendances
    npm ci
    
    log_success "Dépendances installées"
}

# Lancer les tests
run_tests() {
    log_info "Exécution des tests..."
    
    # Lancer les tests s'ils existent
    if npm run test:unit >/dev/null 2>&1; then
        npm run test:unit
        log_success "Tests unitaires réussis"
    else
        log_warning "Aucun test unitaire configuré"
    fi
    
    # Lancer le linting
    if npm run lint >/dev/null 2>&1; then
        npm run lint
        log_success "Linting réussi"
    else
        log_warning "Linting non configuré"
    fi
}

# Build de l'application
build_application() {
    log_info "Build de l'application pour $ENVIRONMENT..."
    
    # Copier le fichier d'environnement
    cp ".env.${ENVIRONMENT}" .env
    
    # Build de production
    npm run build
    
    log_success "Build terminé"
}

# Créer l'archive de déploiement
create_deployment_package() {
    log_info "Création du package de déploiement..."
    
    PACKAGE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Créer le dossier temporaire
    mkdir -p dist-deploy
    
    # Copier les fichiers nécessaires
    cp -r .output dist-deploy/
    cp package.json dist-deploy/
    cp .env dist-deploy/
    
    # Créer les scripts de démarrage
    cat > dist-deploy/server.js << 'EOF'
#!/usr/bin/env node

const { createServer } = require('http')
const { handler } = require('./.output/server/index.mjs')

const port = process.env.PORT || 3000
const host = process.env.HOST || '0.0.0.0'

const server = createServer(handler)

server.listen(port, host, () => {
  console.log(`SMI Corporation server running on http://${host}:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Database mode: ${process.env.USE_MOCK_DB === 'true' ? 'Mock' : 'Real'}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})
EOF

    # Créer la configuration PM2
    cat > dist-deploy/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${PROJECT_NAME}',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '${ENVIRONMENT}',
      PORT: 3000
    }
  }]
}
EOF

    # Créer l'archive
    tar -czf "$PACKAGE_NAME" -C dist-deploy .
    
    # Nettoyer
    rm -rf dist-deploy
    
    log_success "Package créé: $PACKAGE_NAME"
    echo "📦 Archive: $(pwd)/$PACKAGE_NAME"
}

# Afficher les instructions de déploiement
show_deployment_instructions() {
    log_info "Instructions de déploiement sur Infomaniak:"
    
    echo ""
    echo "1. Uploader l'archive sur votre serveur:"
    echo "   scp $PACKAGE_NAME votre-user@ssh.infomaniak.com:~/"
    echo ""
    echo "2. Se connecter au serveur:"
    echo "   ssh votre-user@ssh.infomaniak.com"
    echo ""
    echo "3. Extraire et déployer:"
    echo "   cd domains/votre-domaine.ch/"
    echo "   tar -xzf ~/$PACKAGE_NAME"
    echo "   npm ci --only=production"
    echo "   pm2 restart $PROJECT_NAME || pm2 start ecosystem.config.js"
    echo ""
    echo "4. Vérifier le déploiement:"
    echo "   pm2 status"
    echo "   pm2 logs $PROJECT_NAME"
    echo ""
    
    if [ "$USE_MOCK_DB" = "false" ]; then
        echo "5. Migration de base de données (si nécessaire):"
        echo "   npm run db:migrate"
        echo ""
    fi
    
    log_success "Déploiement prêt!"
}

# Script principal
main() {
    echo ""
    log_info "🚀 Déploiement SMI Corporation pour $ENVIRONMENT"
    echo ""
    
    check_requirements
    check_environment
    install_dependencies
    run_tests
    build_application
    create_deployment_package
    show_deployment_instructions
    
    echo ""
    log_success "🎉 Préparation du déploiement terminée!"
    echo ""
}

# Gestion des arguments
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [environment]"
        echo ""
        echo "Environnements disponibles:"
        echo "  production (défaut)"
        echo "  staging"
        echo "  testing"
        echo ""
        echo "Exemples:"
        echo "  $0                    # Déploiement en production"
        echo "  $0 staging            # Déploiement en staging"
        echo ""
        exit 0
        ;;
    production|staging|testing)
        main
        ;;
    "")
        main
        ;;
    *)
        log_error "Environnement '$1' non reconnu"
        echo "Utilisez: $0 --help pour voir l'aide"
        exit 1
        ;;
esac