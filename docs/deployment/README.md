# Guide de déploiement SMI Corporation

Ce dossier contient tous les guides et scripts nécessaires pour déployer SMI Corporation en production.

## 📁 Contenu

- **[infomaniak-nodejs.md](./infomaniak-nodejs.md)** - Guide complet pour déployer sur l'hébergement Node.js d'Infomaniak
- **[database-migration.md](./database-migration.md)** - Guide pour migrer de la base simulée vers MySQL
- **[deploy-infomaniak.sh](../scripts/deploy-infomaniak.sh)** - Script automatisé de déploiement

## 🚀 Déploiement rapide

### 1. Préparation

```bash
# Cloner le projet
git clone https://github.com/votre-username/smi-corporation.git
cd smi-corporation

# Copier et configurer l'environnement de production
cp .env.production.example .env.production
# Éditer .env.production avec vos valeurs
```

### 2. Configuration de la base de données

Si vous migrez vers une vraie base de données MySQL :

```bash
# Exporter les données actuelles (optionnel)
npm run db:export

# Configurer MySQL sur Infomaniak
# Voir le guide database-migration.md pour les détails
```

### 3. Déploiement automatisé

```bash
# Utiliser le script de déploiement
./scripts/deploy-infomaniak.sh production
```

### 4. Upload et démarrage

```bash
# Sur votre serveur Infomaniak
scp smi-corporation-production-*.tar.gz user@ssh.infomaniak.com:~/
ssh user@ssh.infomaniak.com

# Extraire et démarrer
cd domains/votre-domaine.ch/
tar -xzf ~/smi-corporation-production-*.tar.gz
npm ci --only=production
pm2 start ecosystem.config.js
```

## 📋 Checklist de déploiement

### Avant le déploiement

- [ ] Configuration MySQL créée sur Infomaniak
- [ ] Variables d'environnement configurées dans `.env.production`
- [ ] Secrets JWT et CSRF générés (minimum 64 caractères)
- [ ] Domaine configuré et SSL activé
- [ ] Tests passent en local

### Pendant le déploiement

- [ ] Build de l'application réussi
- [ ] Archive de déploiement créée
- [ ] Upload sur le serveur effectué
- [ ] Installation des dépendances réussie
- [ ] Application démarrée avec PM2

### Après le déploiement

- [ ] Application accessible via l'URL
- [ ] Connexion administrateur fonctionnelle
- [ ] Base de données connectée (si applicable)
- [ ] Upload d'images fonctionnel
- [ ] Pages et organigrammes affichés correctement
- [ ] Logs d'erreur vérifiés

## 🔧 Configuration serveur

### Variables d'environnement requises

```bash
NODE_ENV=production
USE_MOCK_DB=false  # ou true pour utiliser la base simulée

# Sécurité (OBLIGATOIRE)
JWT_SECRET=votre_secret_jwt_64_caracteres_minimum
CSRF_SECRET=votre_secret_csrf_64_caracteres_minimum

# Base de données (si USE_MOCK_DB=false)
DB_HOST=mysql.infomaniak.com
DB_NAME=votre_bdd
DB_USER=votre_user
DB_PASSWORD=votre_password

# Configuration serveur
HOST=0.0.0.0
PORT=3000
BASE_URL=https://votre-domaine.ch
```

### Structure des fichiers sur le serveur

```
domains/votre-domaine.ch/
├── .output/                 # Build Nuxt
├── .env                     # Variables d'environnement
├── package.json             # Dépendances
├── server.js                # Script de démarrage
├── ecosystem.config.js      # Configuration PM2
└── public/
    └── uploads/             # Fichiers uploadés
        └── images/          # Images
```

## 🛠️ Maintenance

### Commandes utiles

```bash
# Statut de l'application
pm2 status smi-corporation

# Voir les logs
pm2 logs smi-corporation

# Redémarrer l'application
pm2 restart smi-corporation

# Arrêter l'application
pm2 stop smi-corporation

# Monitoring en temps réel
pm2 monit
```

### Mise à jour de l'application

```bash
# Nouvelle version
./scripts/deploy-infomaniak.sh production

# Sur le serveur
tar -xzf ~/smi-corporation-production-*.tar.gz
pm2 restart smi-corporation
```

### Sauvegarde

```bash
# Sauvegarde de la base de données
mysqldump -h mysql.infomaniak.com -u user -p database > backup.sql

# Sauvegarde des uploads
tar -czf uploads-backup.tar.gz public/uploads/
```

## 📊 Monitoring

### Health Check

L'application expose un endpoint de santé :

```bash
curl https://votre-domaine.ch/api/health
```

### Logs

Les logs sont disponibles via PM2 et peuvent être configurés pour être envoyés vers un service de monitoring externe.

### Métriques

L'application peut être configurée avec des métriques de performance via des outils comme New Relic ou Sentry.

## 🔒 Sécurité

### Recommandations

1. **HTTPS obligatoire** - Configuré via le Manager Infomaniak
2. **Variables d'environnement sécurisées** - Secrets suffisamment longs
3. **Mises à jour régulières** - Dépendances et Node.js
4. **Monitoring des logs** - Surveillance des erreurs et accès
5. **Sauvegarde régulière** - Base de données et fichiers

### Génération de secrets

```bash
# Générer des secrets sécurisés
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🆘 Résolution de problèmes

### Problèmes courants

1. **Port déjà utilisé** - Vérifier `pm2 status` et arrêter les processus existants
2. **Erreur de base de données** - Vérifier les credentials dans `.env`
3. **Erreur 500** - Consulter `pm2 logs smi-corporation`
4. **Upload d'images** - Vérifier les permissions du dossier `public/uploads/`

### Support

- **Documentation Infomaniak** : https://docs.infomaniak.com/
- **Support Infomaniak** : Via le Manager
- **Issues GitHub** : Pour les bugs de l'application

---

**Note** : Ce guide est spécifique à l'hébergement Infomaniak. Pour d'autres hébergeurs, adaptez les configurations selon leurs spécificités.