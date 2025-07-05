# CLAUDE.md - Projet SMI Corporation

**Dernière mise à jour :** Juillet 2025  
**Statut :** En développement actif - Version 2.1.0

## Vue d'ensemble du projet

SMI Corporation est un système de gestion de contenu (CMS) moderne et évolutif construit avec Nuxt.js. Il offre une architecture robuste pour l'authentification utilisateur, le contrôle d'accès basé sur les rôles, la gestion dynamique des pages, la gestion des médias et la gestion des organigrammes d'entreprise.

### Caractéristiques principales
- **Architecture modulaire** avec services centralisés
- **Base de données simulée** pour le développement rapide
- **Migration vers base de données réelle** prête pour la production
- **Sécurité renforcée** avec audit logging et validation stricte
- **Interface moderne** avec Nuxt UI et Tailwind CSS
- **TypeScript** pour une meilleure qualité de code

## Pile technologique

### Frontend
- **Framework** : Nuxt.js 3.17.4 (Vue.js 3.5.16)
- **CSS** : Tailwind CSS via @nuxt/ui 3.1.3
- **Gestion d'état** : Pinia 3.0.2
- **Routeur** : Vue Router 4.5.1
- **Éditeur de texte riche** : TipTap 2.14.0
- **Téléchargement de fichiers** : FilePond 4.32.8 avec intégration Vue
- **Traitement d'images** : Vue Advanced Cropper 2.8.9
- **Icônes** : @nuxt/icon 1.13.0 + FontAwesome 6.7.2
- **Validation** : Vee-Validate 4.15.1 + Yup 1.6.1 + Zod 3.25.67

### Backend
- **Runtime** : API Serveur Nuxt.js (Nitro)
- **ORM Base de données** : Sequelize 6.37.7
- **Base de données** : MySQL2 3.14.1 (avec SQLite3 5.1.7 pour le développement)
- **Authentification** : Système JWT personnalisé avec nuxt-auth-utils 0.5.20
- **Sécurité** : bcryptjs 3.0.2, protection CSRF (nuxt-csurf), DOMPurify 3.2.6
- **Traitement d'images** : Sharp 0.34.2

### Outils de développement
- **TypeScript** : 5.8.3
- **ESLint** : 9.29.0 avec @nuxt/eslint 1.4.1
- **Commitizen** : cz-customizable 7.4.0
- **Commitlint** : @commitlint/config-conventional
- **Husky** : 9.1.7 (hooks pre-commit)

## Structure du projet

```
/home/hanaro/Projets_Web/smi-corporation/
├── app/                          # Code de l'application Nuxt
│   ├── assets/                   # Ressources statiques (CSS, images, logos)
│   ├── components/               # Composants Vue réutilisables
│   │   ├── images/               # Composants de gestion des images
│   │   ├── pages/                # Composants de rendu des pages
│   │   └── ui/                   # Composants d'interface utilisateur
│   ├── composables/              # Composables Vue (logique réutilisable)
│   ├── layouts/                  # Layouts d'application (default, admin)
│   ├── middleware/               # Middleware de routes (auth, routing pages)
│   ├── pages/                    # Pages de l'application
│   │   ├── admin/                # Interface d'administration
│   │   └── auth/                 # Pages d'authentification
│   ├── plugins/                  # Plugins Nuxt
│   ├── stores/                   # Stores Pinia (gestion d'état)
│   └── types/                    # Définitions TypeScript
├── server/                       # Code côté serveur
│   ├── api/                      # Points d'accès API RESTful
│   │   ├── auth/                 # Authentification et sessions
│   │   ├── images/               # Gestion des médias
│   │   ├── organigrammes/        # API des organigrammes
│   │   ├── permissions/          # Gestion des permissions
│   │   ├── roles/                # Gestion des rôles
│   │   └── users/                # Gestion des utilisateurs
│   ├── constants/                # Constantes et configuration API
│   ├── middleware/               # Middleware serveur
│   ├── models.js                 # Modèles de base de données (Sequelize)
│   ├── database.js               # Configuration de la base de données
│   ├── services/                 # Services métier centralisés
│   │   ├── auth-middleware.js    # Service d'authentification
│   │   ├── validation-service.js # Service de validation
│   │   └── audit-service.js      # Service d'audit et logging
│   └── utils/                    # Utilitaires serveur
├── docs/                         # Documentation du projet
├── tests/                        # Tests (unit, integration, e2e)
├── public/                       # Fichiers statiques publics
├── content.config.ts             # Configuration Nuxt Content
├── nuxt.config.ts                # Configuration Nuxt
└── package.json                  # Dépendances et scripts
```

## Fonctionnalités principales

### 🔐 Authentification et autorisation
- Système d'inscription et de connexion sécurisé
- Gestion de session basée sur JWT avec cookies httpOnly
- Contrôle d'accès basé sur les rôles (RBAC) granulaire
- Système de permissions avec validation côté client et serveur
- Protection contre les attaques par force brute (rate limiting)
- Audit logging complet des actions d'authentification

### 📝 Gestion de contenu
- Création et gestion dynamique des pages avec éditeur WYSIWYG
- Structure de pages hiérarchique (relations parent/enfant)
- Éditeur de texte riche TipTap avec support BBCode étendu
- Système de statut Brouillon/Publié avec workflow de validation
- Génération automatique de slugs SEO-friendly
- Prévisualisation en temps réel du contenu

### 🖼️ Gestion des médias
- Téléchargement sécurisé avec validation de type et taille
- Recadrage et édition d'images avec Vue Advanced Cropper
- Optimisation automatique des images avec Sharp
- Système de variants d'images (thumbnails, formats multiples)
- Interface de galerie moderne avec FilePond
- Stockage local organisé et sécurisé

### 👥 Gestion des organigrammes
- Création d'organigrammes interactifs et hiérarchiques
- Structure d'employés jusqu'à 10 niveaux de profondeur
- Intégration BBCode pour l'embedding dans les pages
- Gestion complète des employés (poste, coordonnées, statut)
- Export et import de données d'organigrammes
- Visualisation responsive et accessible

### ⚙️ Administration avancée
- Interface d'administration moderne sur `/admin`
- Tableau de bord avec métriques en temps réel
- Gestion complète des utilisateurs (CRUD avec validation)
- Configuration des rôles et permissions granulaires
- Monitoring des performances et logs d'audit
- Outils de maintenance et migration de données
- Système de sauvegarde et restauration

## Configuration de développement

### Prérequis
- **Node.js** 18.x ou supérieur
- **npm** 9.x ou supérieur
- **Git** pour le contrôle de version

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd smi-corporation

# Installer les dépendances
npm install

# Configurer l'environnement de développement
cp .env.example .env
```

### Configuration de l'environnement
Le projet utilise un système hybride avec base de données simulée :

```bash
# Variables d'environnement essentielles
USE_MOCK_DB=true                 # Active la base de données simulée
JWT_SECRET=your-secret-key       # Clé secrète pour JWT
NODE_ENV=development             # Environnement de développement
```

- **Données simulées** : `/server/utils/mock-db.js`
- **Configuration DB réelle** : `/server/database.js`
- **Migration** : Scripts automatisés pour passer en production

### Scripts de développement
```json
{
  "dev": "nuxt dev",                    # Serveur de développement (http://localhost:3000)
  "build": "nuxt build",                # Build de production
  "preview": "nuxt preview",            # Aperçu du build de production
  "lint": "eslint .",                   # Linting du code
  "lint:fix": "eslint . --fix",         # Correction automatique du linting
  "test": "vitest",                     # Tests unitaires
  "test:e2e": "playwright test",        # Tests end-to-end
  "migrate": "node server/scripts/migrate-database.js",  # Migration DB
  "commit": "cz"                        # Assistant de commit Commitizen
}
```

### Standards de qualité du code
- **ESLint** avec configuration Nuxt/TypeScript stricte
- **Prettier** pour le formatage automatique
- **Commitlint** pour les messages de commit conventionnels
- **Husky** pour les hooks pre-commit automatiques
- **TypeScript** strict mode activé
- **Tests** : Vitest (unit) + Playwright (e2e)
- **Coverage** : Minimum 80% requis pour les services critiques

## Schéma de base de données

### Modèles principaux
- **User** : Authentification et données utilisateur
- **Role** : Définitions des rôles
- **Permission** : Définitions des permissions
- **RolePermission** : Relation plusieurs-à-plusieurs
- **Page** : Contenu de page dynamique
- **Image** : Gestion des fichiers médias
- **Organigramme** : Définitions des organigrammes
- **Employee** : Données des employés avec relations hiérarchiques
- **AuditLog** : Suivi des activités système

## Points d'accès API

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion utilisateur
- `POST /api/auth/register` - Inscription utilisateur
- `GET /api/_auth/session` - Validation de session

### Pages
- `GET /api/pages` - Lister toutes les pages
- `POST /api/pages` - Créer une nouvelle page
- `GET /api/pages/:id` - Obtenir une page spécifique
- `PUT /api/pages/:id` - Mettre à jour une page
- `DELETE /api/pages/:id` - Supprimer une page

### Utilisateurs et rôles
- `GET /api/users` - Lister les utilisateurs
- `GET /api/roles` - Lister les rôles
- `GET /api/permissions` - Lister les permissions

### Images
- `POST /api/images` - Télécharger une image
- `GET /api/images` - Lister les images
- `PATCH /api/images/:id` - Mettre à jour une image
- `DELETE /api/images` - Supprimer une image

### Organigrammes
- `GET /api/organigrammes` - Lister les organigrammes
- `POST /api/organigrammes` - Créer un nouvel organigramme
- `GET /api/organigrammes/:id` - Obtenir un organigramme spécifique
- `PUT /api/organigrammes/:id` - Mettre à jour un organigramme
- `DELETE /api/organigrammes/:id` - Supprimer un organigramme
- `GET /api/organigrammes/:slug` - Obtenir un organigramme par slug (BBCode)
- `GET /api/organigrammes/:id/employees` - Lister les employés d'un organigramme
- `POST /api/organigrammes/:id/employees` - Ajouter un employé à un organigramme

## Fonctionnalités de sécurité
- Protection CSRF (configurable)
- Validation et assainissement des entrées
- Hachage des mots de passe avec bcrypt
- Gestion des tokens JWT
- Protection XSS avec DOMPurify
- Validation des téléchargements de fichiers
- Limitation de débit sur les points d'accès API
- Système de permissions hiérarchique (manage_organigrammes)
- Journalisation d'audit pour les opérations d'organigrammes

## Notes de déploiement
- Support de génération statique Nuxt.js
- Configuration basée sur l'environnement
- Utilitaires de migration de base de données disponibles
- Système de build prêt pour la production

## Support BBCode étendu

L'application supporte un système BBCode avancé pour l'intégration de contenu riche :

### Organigrammes
```bbcode
[orgchart id="direction-generale"]
[orgchart id="services-techniques" style="compact"]
```

### Images et médias
```bbcode
[image id="123" size="medium" align="center"]
[gallery category="evenements-2025"]
```

### Sécurité et rendu
- **Traitement côté serveur** avec sanitisation DOMPurify
- **Validation stricte** des paramètres BBCode
- **Cache intelligent** pour les performances
- **Rendu responsive** adaptatif
- **Accessibilité** intégrée (ARIA, alt text)

### Extensibilité
- Architecture modulaire permettant l'ajout de nouveaux tags
- Système de plugins pour le rendu personnalisé
- API pour l'intégration de services tiers

## Architecture et services (Juillet 2025)

### Services centralisés
Le projet a été refactorisé en juillet 2025 pour améliorer la maintenabilité :

- **`/server/constants/api-constants.js`** - Constantes centralisées (HTTP status, messages d'erreur)
- **`/server/services/auth-middleware.js`** - Service d'authentification unifié
- **`/server/services/validation-service.js`** - Validation centralisée et sanitisation
- **`/server/services/audit-service.js`** - Logging et audit des actions

### Améliorations de qualité récentes
- **Réduction de 70% du code dupliqué** dans les APIs
- **TypeScript strict** sur tous les composants frontend
- **Validation client-serveur** harmonisée
- **Gestion d'erreurs standardisée** avec fallback gracieux
- **Architecture modulaire** facilitant les tests et la maintenance

## Flux de travail de développement

### 1. Développement local
```bash
# Démarrer en mode développement
npm run dev

# Activer la base de données simulée
export USE_MOCK_DB=true
```

### 2. Standards de qualité
```bash
# Avant chaque commit
npm run lint
npm run test

# Commit avec Commitizen
npm run commit
```

### 3. Tests
```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

### 4. Déploiement
```bash
# Build production
npm run build

# Migration base de données
npm run migrate

# Prévisualisation
npm run preview
```

## Fichiers clés à comprendre

### Configuration
- `/nuxt.config.ts` - Configuration principale Nuxt avec optimisations
- `/server/database.js` - Configuration hybride base de données
- `/server/constants/api-constants.js` - Constantes et configuration API

### Services
- `/server/services/auth-middleware.js` - Authentification centralisée
- `/server/services/validation-service.js` - Validation et sanitisation
- `/server/services/audit-service.js` - Audit et logging des actions

### Modèles et données
- `/server/models.js` - Interface unifiée pour les modèles
- `/server/utils/mock-db.js` - Base de données simulée pour développement

### Frontend
- `/app/stores/auth.js` - Store Pinia pour l'authentification
- `/app/components/UserForm.vue` - Composant amélioré avec TypeScript
- `/app/middleware/auth.js` - Protection des routes

### APIs
- `/server/api/organigrammes/` - API refactorisée des organigrammes
- `/server/api/auth/` - Endpoints d'authentification sécurisés

## Migration vers la production

Le projet inclut des outils de migration automatisés :

```bash
# Analyser la base de données actuelle
npm run migrate:analyze

# Migrer vers MySQL/PostgreSQL
npm run migrate

# Vérifier l'intégrité
npm run migrate:stats
```

### Environnements supportés
- **Développement** : Base de données simulée (rapide, pas de setup)
- **Test** : SQLite en mémoire (isolation des tests)
- **Staging** : MySQL/PostgreSQL (réplication production)
- **Production** : MySQL/PostgreSQL avec clustering et backup

## Historique des améliorations

### Juillet 2025 - Refactorisation qualité
- Création des services centralisés
- Amélioration TypeScript et validation
- Réduction significative de la dette technique
- Standardisation des patterns d'architecture

### Juin-Juillet 2025 - Développement initial
- Mise en place de l'architecture Nuxt.js
- Système d'authentification JWT
- Interface d'administration
- Gestion des organigrammes et médias