# 📚 SMI Corporation - Documentation Complète

## Vue d'Ensemble du Projet

**SMI Corporation** est un système de gestion de contenu (CMS) moderne et robuste construit avec Nuxt.js 3, offrant une gestion complète des utilisateurs, des rôles, des pages dynamiques et des médias. Le projet intègre un système d'authentification avancé, une protection CSRF, une gestion de cache optimisée et une architecture repository pour une maintenabilité maximale.

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend
- **Framework :** Nuxt.js 3.17.5 (Vue.js 3.5.16)
- **UI :** Tailwind CSS via @nuxt/ui 3.1.3
- **State Management :** Pinia 3.0.2
- **Editeur :** TipTap 2.14.0 pour l'édition riche
- **Upload :** FilePond 4.32.8 avec traitement d'images
- **Validation :** Vee-Validate 4.15.1 + Yup + Zod

#### Backend
- **Runtime :** Nuxt.js Server API (Nitro)
- **ORM :** Sequelize 6.37.7
- **Base de données :** MySQL2 / SQLite3 (avec système mock pour développement)
- **Authentification :** JWT custom avec nuxt-auth-utils
- **Sécurité :** bcryptjs, CSRF (nuxt-csurf), DOMPurify
- **Images :** Sharp 0.34.2 pour le traitement

#### Qualité & Tests
- **Tests :** Vitest 3.2.4 avec Happy-DOM
- **Couverture :** 72 tests unitaires
- **Linting :** ESLint avec @nuxt/eslint
- **Types :** TypeScript 5.8.3

## 📁 Structure du Projet

```
smi-corporation/
├── app/                          # Application Nuxt
│   ├── assets/                   # Assets statiques
│   ├── components/               # Composants Vue
│   │   ├── images/               # Gestion d'images
│   │   └── pages/                # Rendu de pages
│   ├── composables/              # Composables Vue
│   ├── layouts/                  # Layouts (default, admin)
│   ├── middleware/               # Middleware de route
│   ├── pages/                    # Pages de l'application
│   │   ├── admin/                # Interface d'administration
│   │   └── auth/                 # Pages d'authentification
│   ├── plugins/                  # Plugins Nuxt
│   └── stores/                   # Stores Pinia
├── server/                       # Code serveur
│   ├── api/                      # Endpoints API
│   ├── config/                   # Configuration centralisée
│   ├── migrations/               # Migrations de base de données
│   ├── repositories/             # Pattern Repository
│   ├── scripts/                  # Scripts utilitaires
│   ├── services/                 # Services métier
│   └── utils/                    # Utilitaires serveur
├── tests/                        # Suite de tests
│   ├── repositories/             # Tests des repositories
│   └── utils/                    # Tests des utilitaires
└── docs/                         # Documentation
```

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Base de données MySQL/SQLite (optionnel pour le développement)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd smi-corporation

# Installer les dépendances
npm install

# Copier la configuration d'environnement
cp .env.example .env

# Valider la configuration
npm run config:validate

# Lancer le serveur de développement
npm run dev
```

### Configuration d'Environnement

Le fichier `.env` contient toutes les variables de configuration :

```bash
# Application
APP_NAME=SMI Corporation
NODE_ENV=development
PORT=3000

# Base de données
USE_MOCK_DB=true              # true pour le développement
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Sécurité
JWT_SECRET=your-secret-key    # ⚠️ À changer en production !
CSRF_ENABLED=true
RATE_LIMIT_ENABLED=true

# Cache
CACHE_DEFAULT_TTL=300000      # 5 minutes
REDIS_ENABLED=false           # true pour la production

# Uploads
UPLOADS_IMAGES_ENABLED=true
UPLOADS_IMAGES_MAX_SIZE=5242880  # 5MB
```

## 🔧 Scripts Disponibles

### Développement
```bash
npm run dev              # Serveur de développement
npm run build            # Build de production  
npm run preview          # Aperçu du build
npm run lint             # Vérification du code
npm run lint:fix         # Correction automatique
```

### Tests
```bash
npm test                 # Exécuter tous les tests
npm run test:watch       # Tests en mode watch
npm run test:ui          # Interface UI pour les tests
npm run test:coverage    # Rapport de couverture
```

### Base de Données
```bash
npm run migrate:indexes  # Ajouter les index de performance
npm run migrate:analyze  # Analyser les performances
npm run migrate:stats    # Statistiques de la base
npm run migrate          # Aide sur les migrations
```

### Configuration
```bash
npm run config:validate  # Valider la configuration
```

## 🔐 Système d'Authentification

### Fonctionnalités
- **Inscription/Connexion** avec validation robuste
- **JWT** avec refresh tokens
- **Rôles et permissions** granulaires
- **Protection CSRF** intégrée
- **Rate limiting** sur les endpoints sensibles
- **Audit logging** des actions utilisateur

### Endpoints API

#### Authentification
```bash
POST /api/auth/login      # Connexion utilisateur
POST /api/auth/logout     # Déconnexion
POST /api/auth/register   # Inscription
GET  /api/_auth/session   # Validation de session
```

#### Gestion Utilisateurs
```bash
GET    /api/users         # Lister les utilisateurs
GET    /api/users/:id     # Détails utilisateur
PUT    /api/users/:id     # Modifier utilisateur
DELETE /api/users/:id     # Supprimer utilisateur
```

### Système de Rôles

```javascript
// Rôles par défaut
const roles = {
  1: 'Administrateur',  // Accès complet
  2: 'Éditeur',        // Gestion de contenu
  3: 'Utilisateur'     // Lecture seule
}

// Permissions granulaires
const permissions = [
  'admin',           // Administration complète
  'edit',           // Édition de contenu
  'view',           // Lecture
  'manage_users',   // Gestion utilisateurs
  'manage_roles',   // Gestion des rôles
  'manage_permissions' // Gestion des permissions
]
```

## 📄 Gestion de Contenu

### Pages Dynamiques
- **Hiérarchie** parent/enfant
- **Statuts** : brouillon/publié
- **Slugs** SEO-friendly auto-générés
- **Éditeur riche** TipTap avec BBCode
- **Cache** intelligent avec invalidation

### Structure des Pages
```javascript
{
  id: 1,
  title: "Page d'accueil",
  slug: "accueil",
  content: "<p>Contenu HTML riche</p>",
  status: "published",
  parent_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

### API Pages
```bash
GET    /api/pages        # Lister toutes les pages
POST   /api/pages        # Créer une page
GET    /api/pages/:id    # Détails d'une page
PUT    /api/pages/:id    # Modifier une page
DELETE /api/pages/:id    # Supprimer une page
```

## 🖼️ Gestion des Médias

### Upload d'Images
- **Types supportés** : JPEG, PNG, GIF, WebP
- **Taille maximale** : 5MB (configurable)
- **Traitement automatique** : redimensionnement, compression
- **Thumbnails** : génération automatique en plusieurs tailles
- **Validation** : type MIME, taille, dimensions

### API Images
```bash
POST   /api/images       # Upload d'image
GET    /api/images       # Lister les images
PATCH  /api/images/:id   # Modifier métadonnées
DELETE /api/images       # Supprimer image
POST   /api/images/:id/crop # Recadrer image
```

## 🏛️ Architecture Repository

### Pattern Repository
Le projet implémente le pattern Repository pour une abstraction propre de l'accès aux données :

```javascript
// BaseRepository - Opérations CRUD communes
class BaseRepository {
  async findById(id)
  async findAll(where, options)
  async create(data)
  async updateById(id, data)
  async deleteById(id)
  async paginate(where, page, limit)
  // + cache intégré, gestion d'erreurs
}

// UserRepository - Spécialisé pour les utilisateurs
class UserRepository extends BaseRepository {
  async findByEmail(email)
  async findWithRole(userId)
  async search(query, page, limit)
  async getStatistics()
  // + invalidation de cache automatique
}
```

### Avantages
- **Abstraction** de la couche de données
- **Cache** intégré avec invalidation intelligente
- **Gestion d'erreurs** centralisée
- **Transactions** supportées
- **Testabilité** améliorée

## 💾 Système de Cache

### Cache Multi-Niveaux
```javascript
// Configuration des caches
const caches = {
  userCache: new MemoryCache(600000),    // 10 minutes
  pageCache: new MemoryCache(900000),    // 15 minutes  
  roleCache: new MemoryCache(1800000),   // 30 minutes
  navigationCache: new MemoryCache(1800000)
}

// TTL par type de données
const ttl = {
  user: 10 * 60 * 1000,        // 10 minutes
  page: 15 * 60 * 1000,        // 15 minutes
  navigation: 30 * 60 * 1000,  // 30 minutes
  session: 5 * 60 * 1000       // 5 minutes
}
```

### Fonctionnalités Cache
- **TTL automatique** avec expiration
- **Cleanup périodique** des entrées expirées
- **Invalidation intelligente** par dépendances
- **Métriques** de performance intégrées
- **Gestion mémoire** avec limits et cleanup

## 🔒 Sécurité

### Mesures Implémentées

#### Protection CSRF
```javascript
// Configuration nuxt.config.ts
csurf: {
  enabled: true,
  cookieHttpOnly: true,
  cookieSameSite: 'strict',
  methods: ['POST', 'PUT', 'DELETE', 'PATCH']
}
```

#### Rate Limiting
```javascript
// Limites par endpoint
const limits = {
  global: { max: 100, window: 15 * 60 * 1000 },    // 100/15min
  api: { max: 1000, window: 60 * 60 * 1000 },      // 1000/h
  auth: { max: 5, window: 15 * 60 * 1000 }         // 5/15min
}
```

#### Validation d'Entrées
```javascript
// Validation robuste avec Yup/Zod
const userSchema = {
  email: yup.string().email().required(),
  password: yup.string()
    .min(8)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
}
```

#### Sanitisation
- **HTML** : DOMPurify avec whitelist de tags
- **SQL** : Requêtes préparées via Sequelize
- **XSS** : Échappement automatique des données
- **Upload** : Validation type MIME + extension

## 📊 Base de Données

### Schéma Principal

#### Utilisateurs
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER,
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

#### Pages
```sql
CREATE TABLE pages (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  content TEXT,
  status ENUM('draft', 'published') DEFAULT 'draft',
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES pages(id)
);
```

### Index de Performance
```sql
-- Index critiques pour les performances
CREATE INDEX idx_users_email_unique ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_pages_slug_unique ON pages(slug);
CREATE INDEX idx_pages_status_updated_at ON pages(status, updated_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
```

### Migrations
```bash
# Scripts de migration disponibles
npm run migrate:indexes     # Ajouter tous les index
npm run migrate:analyze     # Analyser les performances
npm run migrate:stats       # Statistiques des tables
```

## 🧪 Tests

### Suite de Tests Complète (72 tests)

#### Structure des Tests
```
tests/
├── setup.ts                     # Configuration globale
├── utils/                       # Tests des utilitaires
│   ├── cache.test.js            # Cache (18 tests)
│   ├── error-handler.test.js    # Gestion d'erreurs (15 tests)
│   └── input-validation.test.js # Validation (28 tests)
└── repositories/                # Tests des repositories
    └── user-repository.test.js  # UserRepository (11 tests)
```

#### Exécution des Tests
```bash
npm test                  # Tous les tests
npm run test:watch        # Mode watch
npm run test:ui           # Interface graphique
npm run test:coverage     # Avec couverture
```

#### Métriques de Qualité
- **Coverage** : 80%+ des fonctions critiques
- **Performance** : Tests unitaires < 100ms
- **Isolation** : Mocks pour les dépendances externes
- **CI/CD Ready** : Compatible GitHub Actions

## 🚀 Déploiement

### Préparation Production

#### 1. Configuration d'Environnement
```bash
# Variables critiques pour la production
NODE_ENV=production
JWT_SECRET=<clé-ultra-sécurisée-32-chars-minimum>
CSRF_ENABLED=true
RATE_LIMIT_ENABLED=true
USE_MOCK_DB=false
DB_HOST=<host-production>
DB_PASSWORD=<mot-de-passe-sécurisé>
REDIS_ENABLED=true
EMAIL_ENABLED=true
```

#### 2. Build de Production
```bash
# Build optimisé
npm run build

# Test du build
npm run preview

# Validation finale
npm run config:validate
npm run test:run
npm run lint
```

#### 3. Optimisations Base de Données
```bash
# Ajouter les index de performance
npm run migrate:indexes

# Analyser les performances
npm run migrate:analyze

# Vérifier les statistiques
npm run migrate:stats
```

### Options de Déploiement

#### Vercel (Recommandé)
```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### VPS/Serveur Dédié
```bash
# Avec PM2 pour la gestion de processus
npm install -g pm2
pm2 start npm --name "smi-corp" -- start
pm2 startup
pm2 save
```

## 🔧 Configuration Avancée

### Configuration Centralisée

Le système de configuration centralisé (`server/config/index.js`) offre :

```javascript
// Accès typé à la configuration
import { appConfig, authConfig, dbConfig } from '../config/index.js'

// Validation automatique au démarrage
validateConfig()

// Configuration par environnement
const config = {
  development: { /* config dev */ },
  production: { /* config prod */ },
  test: { /* config test */ }
}
```

### Variables d'Environnement Critiques

#### Sécurité
```bash
JWT_SECRET=<minimum-32-caractères>
CSRF_SECRET=<clé-csrf-unique>
DB_PASSWORD=<mot-de-passe-fort>
```

#### Performance
```bash
CACHE_DEFAULT_TTL=300000        # 5 minutes
REDIS_ENABLED=true              # Production
DB_POOL_MAX=10                  # Connexions max
```

#### Fonctionnalités
```bash
FEATURE_USER_REGISTRATION=true
FEATURE_EMAIL_VERIFICATION=false
FEATURE_2FA=false
MAINTENANCE_MODE=false
```

## 📈 Monitoring et Performance

### Métriques Disponibles

#### Cache Performance
```bash
# Statistiques du cache
const stats = cache.stats()
console.log(`Cache size: ${stats.size}`)
console.log(`Memory usage: ${stats.memory}`)
```

#### Base de Données
```bash
# Analyse des requêtes
npm run migrate:analyze

# Statistiques des tables
npm run migrate:stats
```

### Recommandations Performance

#### Production
1. **Redis** pour le cache distribué
2. **Index** de base de données optimisés
3. **CDN** pour les assets statiques
4. **Compression** gzip/brotli activée
5. **Monitoring APM** (Sentry, New Relic)

#### Développement
1. **Hot reload** avec cache intelligent
2. **Mock DB** pour rapidité
3. **Tests** en parallèle
4. **Linting** en temps réel

## 🔄 API Reference

### Format de Réponse Standard

#### Succès
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Opération réussie",
  "data": { /* données */ },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Erreur
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Message d'erreur",
  "details": { /* détails optionnels */ },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Pagination Standard
```json
{
  "data": [/* éléments */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Headers Requis

#### Authentification
```bash
Authorization: Bearer <jwt-token>
```

#### CSRF Protection
```bash
X-XSRF-TOKEN: <csrf-token>
```

## 🛠️ Développement

### Conventions de Code

#### Nomenclature
```javascript
// Fichiers : kebab-case
user-repository.js
auth-service.js

// Classes : PascalCase
class UserRepository {}
class AuthService {}

// Variables/fonctions : camelCase
const userRepository = new UserRepository()
function validateUserInput() {}

// Constantes : UPPER_SNAKE_CASE
const JWT_SECRET = process.env.JWT_SECRET
```

#### Structure des Commits
```bash
feat(auth): ajouter authentification à deux facteurs
fix(cache): corriger fuite mémoire dans cleanup
docs(api): mettre à jour documentation endpoints
test(user): ajouter tests pour UserRepository
```

### Workflow de Développement

#### 1. Nouvelle Fonctionnalité
```bash
# Créer une branche
git checkout -b feature/nouvelle-fonction

# Développer avec tests
npm run test:watch

# Valider avant commit
npm run lint
npm run test:run
npm run config:validate

# Commit et PR
git commit -m "feat: description"
git push origin feature/nouvelle-fonction
```

#### 2. Debugging
```bash
# Mode debug
DEBUG=smi:* npm run dev

# Logs détaillés
LOG_LEVEL=debug npm run dev

# Analyse performance
npm run migrate:analyze
```

## 📋 Checklist de Déploiement

### Avant Production

#### Sécurité ✅
- [ ] JWT_SECRET changé et sécurisé (32+ chars)
- [ ] CSRF_ENABLED=true
- [ ] RATE_LIMIT_ENABLED=true
- [ ] Mots de passe BDD sécurisés
- [ ] Variables sensibles en secrets (non dans .env)

#### Performance ✅
- [ ] USE_MOCK_DB=false
- [ ] REDIS_ENABLED=true
- [ ] Index de BDD ajoutés (`npm run migrate:indexes`)
- [ ] Compression activée
- [ ] Cache TTL optimisés

#### Tests ✅
- [ ] Tous les tests passent (`npm run test:run`)
- [ ] Linting sans erreur (`npm run lint`)
- [ ] Configuration validée (`npm run config:validate`)
- [ ] Build de production OK (`npm run build`)

#### Monitoring ✅
- [ ] Logs de production configurés
- [ ] Métriques de performance activées
- [ ] Alertes configurées
- [ ] Backup automatique BDD

## 🆘 Dépannage

### Problèmes Courants

#### Erreur de Configuration
```bash
# Vérifier la config
npm run config:validate

# Variables manquantes
cp .env.example .env
# Ajuster les valeurs dans .env
```

#### Tests qui Échouent
```bash
# Tests spécifiques
npm test -- tests/utils/cache.test.js

# Mode debug
npm run test:ui

# Nettoyer et relancer
rm -rf node_modules package-lock.json
npm install
npm test
```

#### Performance Lente
```bash
# Analyser la BDD
npm run migrate:analyze

# Vérifier le cache
# Logs dans la console avec stats du cache

# Profiling
NODE_OPTIONS="--inspect" npm run dev
# Ouvrir chrome://inspect
```

#### Erreurs de Mémoire
```bash
# Augmenter la mémoire Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Vérifier les fuites
npm run test:coverage
# Analyser les rapports de mémoire
```

## 🤝 Contribution

### Guide de Contribution

#### 1. Setup Développeur
```bash
git clone <repo>
cd smi-corporation
npm install
cp .env.example .env
npm run config:validate
npm run dev
```

#### 2. Standards de Code
- **Tests** : Écrire des tests pour toute nouvelle fonctionnalité
- **Documentation** : Documenter les APIs publiques
- **Types** : Utiliser TypeScript quand possible
- **Sécurité** : Valider toutes les entrées utilisateur

#### 3. Process de Review
- [ ] Tests automatisés passent
- [ ] Code review par 2+ développeurs
- [ ] Documentation mise à jour
- [ ] Performance validée

## 📞 Support

### Resources

#### Documentation
- [README Principal](./README.md)
- [Guide Architecture](./docs/architecture-et-fonctionnement.md)
- [API Documentation](./docs/)

#### Communauté
- **Issues** : [GitHub Issues](https://github.com/smi-corporation/issues)
- **Discussions** : [GitHub Discussions](https://github.com/smi-corporation/discussions)

#### Maintenance
- **Mises à jour** : Vérifier régulièrement les dépendances
- **Sécurité** : Suivre les CVE et mettre à jour
- **Performance** : Monitoring continu en production

---

**SMI Corporation CMS** - Version 1.0.0  
Construit avec ❤️ et les meilleures pratiques de développement

*Documentation générée automatiquement - Dernière mise à jour : 2024*