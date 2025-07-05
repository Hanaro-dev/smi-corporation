# Déploiement sur Infomaniak Node.js

Ce guide vous explique comment déployer SMI Corporation sur l'hébergement Node.js d'Infomaniak.

## Prérequis

- Un compte Infomaniak avec un hébergement Node.js actif
- Accès SSH à votre hébergement
- Node.js 18+ et npm installés localement
- Git configuré

## Vue d'ensemble

SMI Corporation est une application Nuxt.js 3 qui peut être déployée en mode SSR (Server-Side Rendering) sur l'hébergement Node.js d'Infomaniak. L'application utilise actuellement une base de données simulée (mock) qui peut être migrée vers MySQL fourni par Infomaniak.

## Étapes de déploiement

### 1. Préparation du projet

```bash
# Cloner le projet
git clone https://github.com/votre-username/smi-corporation.git
cd smi-corporation

# Installer les dépendances
npm install

# Vérifier que le build fonctionne
npm run build
```

### 2. Configuration de l'environnement

Créez un fichier `.env` pour la production :

```bash
# .env.production
NODE_ENV=production
USE_MOCK_DB=false
JWT_SECRET=votre_jwt_secret_securise_64_caracteres_minimum
CSRF_SECRET=votre_csrf_secret_securise_64_caracteres_minimum

# Configuration base de données MySQL Infomaniak
DB_HOST=mysql.infomaniak.com
DB_PORT=3306
DB_NAME=votre_nom_de_bdd
DB_USER=votre_utilisateur_mysql
DB_PASSWORD=votre_mot_de_passe_mysql

# URL de base pour les images
BASE_URL=https://votre-domaine.ch

# Configuration email (optionnel)
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=votre@email.ch
SMTP_PASSWORD=votre_mot_de_passe_email
```

### 3. Configuration de la base de données

#### Migration depuis la base simulée

```bash
# Exporter les données de la base simulée
npm run export-mock-data

# Créer les tables en base de données
npm run db:migrate

# Importer les données initiales
npm run db:seed
```

#### Configuration MySQL Infomaniak

1. **Accédez à votre Manager Infomaniak**
2. **Section "Hébergement Web" > "Bases de données"**
3. **Créez une nouvelle base MySQL**
4. **Notez les informations de connexion**

### 4. Optimisation pour la production

#### Configuration Nuxt.js

Modifiez `nuxt.config.ts` pour la production :

```typescript
export default defineNuxtConfig({
  // Configuration existante...
  
  nitro: {
    preset: 'node-server',
    minify: true,
    sourceMap: false
  },
  
  runtimeConfig: {
    // Variables serveur (privées)
    jwtSecret: process.env.JWT_SECRET,
    csrfSecret: process.env.CSRF_SECRET,
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    
    public: {
      // Variables publiques
      baseUrl: process.env.BASE_URL || 'https://votre-domaine.ch'
    }
  }
})
```

### 5. Déploiement sur Infomaniak

#### Méthode 1 : Déploiement via SSH

```bash
# Se connecter au serveur
ssh votre-username@ssh.infomaniak.com

# Aller dans le répertoire de votre domaine
cd domains/votre-domaine.ch/

# Cloner le projet
git clone https://github.com/votre-username/smi-corporation.git app
cd app

# Installer les dépendances de production
npm ci --only=production

# Copier le fichier d'environnement
cp .env.production .env

# Builder l'application
npm run build

# Démarrer l'application
npm run preview
```

#### Méthode 2 : Déploiement via FTP/SFTP

1. **Buildez l'application localement** :
   ```bash
   npm run build
   ```

2. **Uploadez les fichiers suivants via SFTP** :
   - `.output/` (dossier de build complet)
   - `package.json`
   - `.env` (fichier de production)

3. **Connectez-vous en SSH et installez** :
   ```bash
   cd domains/votre-domaine.ch/
   npm ci --only=production
   ```

### 6. Configuration du serveur Node.js

#### Fichier de démarrage (server.js)

Créez un fichier `server.js` à la racine :

```javascript
#!/usr/bin/env node

const { createServer } = require('http')
const { resolve } = require('path')

// Importer l'application Nuxt buildée
const { handler } = require('./.output/server/index.mjs')

const port = process.env.PORT || 3000
const host = process.env.HOST || '0.0.0.0'

const server = createServer(handler)

server.listen(port, host, () => {
  console.log(`SMI Corporation server running on http://${host}:${port}`)
})

// Gestion gracieuse de l'arrêt
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
```

#### Configuration PM2 (optionnel)

Créez `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'smi-corporation',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 7. Gestion des fichiers statiques

#### Images et uploads

```bash
# Créer le répertoire d'uploads
mkdir -p public/uploads/images

# Configurer les permissions
chmod 755 public/uploads
chmod 755 public/uploads/images
```

#### Configuration Nginx (si applicable)

Si vous utilisez un reverse proxy Nginx :

```nginx
server {
    listen 80;
    server_name votre-domaine.ch;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads/ {
        alias /path/to/your/app/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8. Scripts de déploiement automatisé

Créez un script `deploy.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement de SMI Corporation sur Infomaniak..."

# Variables
REMOTE_HOST="ssh.infomaniak.com"
REMOTE_USER="votre-username"
REMOTE_PATH="domains/votre-domaine.ch/app"
BRANCH="main"

# Build local
echo "📦 Build de l'application..."
npm run build

# Upload via rsync
echo "📤 Upload des fichiers..."
rsync -avz --delete \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env.local \
  ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Commandes distantes
echo "🔧 Installation et redémarrage..."
ssh $REMOTE_USER@$REMOTE_HOST << EOF
  cd $REMOTE_PATH
  npm ci --only=production
  pm2 restart smi-corporation || pm2 start ecosystem.config.js
EOF

echo "✅ Déploiement terminé !"
```

## Surveillance et maintenance

### Logs

```bash
# Voir les logs de l'application
pm2 logs smi-corporation

# Logs du serveur
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Sauvegarde de la base de données

```bash
# Script de sauvegarde quotidienne
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h mysql.infomaniak.com -u votre_user -p votre_bdd > backup_smi_$DATE.sql
```

### Monitoring

Ajoutez un endpoint de health check dans votre application :

```javascript
// server/api/health.get.js
export default defineEventHandler(() => {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  }
})
```

## Résolution de problèmes

### Problèmes courants

#### Port déjà utilisé
```bash
# Trouver le processus qui utilise le port
netstat -tulpn | grep :3000
kill -9 PID_DU_PROCESSUS
```

#### Problèmes de permissions
```bash
# Corriger les permissions des fichiers
chmod -R 755 public/
chown -R www-data:www-data public/uploads/
```

#### Problèmes de mémoire
```bash
# Augmenter la limite mémoire Node.js
node --max-old-space-size=2048 server.js
```

### Support

- **Documentation Infomaniak** : https://docs.infomaniak.com/
- **Support technique** : Via le Manager Infomaniak
- **Documentation Nuxt.js** : https://nuxt.com/docs/getting-started/deployment

## Sécurité

### Recommandations

1. **Variables d'environnement** : Ne jamais commiter les fichiers `.env`
2. **HTTPS** : Activer SSL/TLS via le Manager Infomaniak
3. **Firewall** : Configurer les règles de pare-feu
4. **Mises à jour** : Maintenir Node.js et les dépendances à jour
5. **Monitoring** : Surveiller les logs d'accès et d'erreur

### Checklist de sécurité

- [ ] Variables d'environnement sécurisées
- [ ] HTTPS activé
- [ ] Authentification renforcée
- [ ] Sauvegarde régulière de la base de données
- [ ] Monitoring des erreurs
- [ ] Logs de sécurité activés

---

**Note** : Ce guide est spécifique à l'hébergement Node.js d'Infomaniak. Pour d'autres types d'hébergement, consultez la documentation officielle de Nuxt.js pour le déploiement.