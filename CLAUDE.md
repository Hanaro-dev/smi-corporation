# CLAUDE.md - Projet SMI Corporation

## Vue d'ensemble du projet

SMI Corporation est un système de gestion de contenu (CMS) complet construit avec Nuxt.js, offrant l'authentification utilisateur, le contrôle d'accès basé sur les rôles, la gestion dynamique des pages, la gestion des médias et la gestion des organigrammes. L'application est conçue avec un système de base de données simulée pour le développement et peut être migrée vers une vraie base de données pour la production.

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
/mnt/Seagate2T/Projets Web/Code/smi-corporation/
├── app/                          # Code de l'application Nuxt
│   ├── assets/                   # Ressources statiques (CSS, images, logos)
│   ├── components/               # Composants Vue
│   │   ├── images/               # Composants de gestion des images
│   │   └── pages/                # Composants de rendu des pages
│   ├── composables/              # Composables Vue
│   ├── layouts/                  # Layouts d'application (default, admin)
│   ├── middleware/               # Middleware de routes (auth, routing pages)
│   ├── pages/                    # Pages de l'application
│   │   ├── admin/                # Pages de l'interface d'administration
│   │   └── auth/                 # Pages d'authentification
│   ├── plugins/                  # Plugins Nuxt
│   └── stores/                   # Stores Pinia
├── server/                       # Code côté serveur
│   ├── api/                      # Points d'accès API
│   │   ├── auth/                 # Points d'accès d'authentification
│   │   ├── images/               # API de gestion des images
│   │   ├── organigrammes/        # API des organigrammes
│   │   ├── permissions/          # API de gestion des permissions
│   │   ├── roles/                # API de gestion des rôles
│   │   └── users/                # API de gestion des utilisateurs
│   ├── middleware/               # Middleware serveur
│   ├── models.js                 # Modèles de base de données (Sequelize)
│   ├── database.js               # Configuration de la base de données
│   ├── services/                 # Services de logique métier
│   └── utils/                    # Utilitaires serveur
├── public/                       # Fichiers statiques publics
├── content.config.ts             # Configuration Nuxt Content
├── nuxt.config.ts                # Configuration Nuxt
└── package.json                  # Dépendances et scripts
```

## Fonctionnalités principales

### Authentification et autorisation
- Système d'inscription et de connexion des utilisateurs
- Gestion de session basée sur JWT
- Contrôle d'accès basé sur les rôles (RBAC)
- Système de permissions avec contrôle granulaire
- Routes et points d'accès API protégés

### Gestion de contenu
- Création et gestion dynamique des pages
- Structure de pages hiérarchique (relations parent/enfant)
- Éditeur de texte riche avec support BBCode
- Système de statut Brouillon/Publié
- Génération de slugs SEO-friendly

### Gestion des médias
- Téléchargement et stockage d'images
- Capacités de recadrage et d'édition d'images
- Validation et traitement des fichiers
- Interface de gestion de galerie

### Gestion des organigrammes
- Créer et gérer les organigrammes
- Structure d'employés hiérarchique (jusqu'à 10 niveaux)
- Intégration BBCode pour intégrer les organigrammes dans les pages
- Système de statut Brouillon/Publié
- Gestion des employés avec poste et coordonnées

### Administration
- Interface d'administration complète sur `/admin`
- Gestion des utilisateurs (opérations CRUD)
- Gestion des rôles et permissions
- Gestion du contenu des pages
- Gestion de la galerie d'images
- Gestion des organigrammes
- Système de journalisation d'audit

## Configuration de développement

### Configuration de l'environnement
Le projet utilise un système de base de données simulée pour le développement :
- Définir `USE_MOCK_DB=true` dans les variables d'environnement
- Les données simulées sont définies dans `/server/utils/mock-db.js`
- Configuration de vraie base de données dans `/server/database.js`

### Scripts
```json
{
  "dev": "nuxt dev",           # Serveur de développement
  "build": "nuxt build",       # Build de production
  "preview": "nuxt preview",   # Aperçu du build de production
  "lint": "eslint .",          # Linting du code
  "lint:fix": "eslint . --fix", # Correction automatique des erreurs de linting
  "commit": "cz"               # Assistant de commit Commitizen
}
```

### Qualité du code
- Configuration ESLint avec les standards Nuxt
- Commitlint pour les messages de commit conventionnels
- Hooks pre-commit Husky (actuellement dans bak.husky/)
- Support TypeScript dans tout le projet

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

## Support BBCode

L'application supporte BBCode pour l'intégration de contenu riche :

### Organigrammes
- `[orgchart id="slug"]` - Intégrer un organigramme par slug
- Exemple : `[orgchart id="direction-generale"]`

### Utilisation
- BBCode est traité côté serveur pour la sécurité
- Les organigrammes sont rendus comme des structures hiérarchiques interactives
- Seuls les organigrammes publiés sont accessibles via BBCode

## Flux de travail de développement
1. Utiliser la base de données simulée pour le développement (`USE_MOCK_DB=true`)
2. Suivre les standards de commit conventionnels
3. Exécuter le linting avant les commits
4. Tester en modes base de données simulée et réelle
5. Utiliser l'interface d'administration pour la gestion de contenu

## Fichiers importants à comprendre
- `/nuxt.config.ts` - Configuration principale Nuxt
- `/server/models.js` - Modèles de base de données et système simulé
- `/server/database.js` - Configuration de connexion à la base de données
- `/app/stores/auth.js` - Gestion d'état d'authentification
- `/server/api/` - Tous les points d'accès API
- `/server/api/organigrammes/` - Points d'accès des organigrammes
- `/app/middleware/auth.js` - Protection des routes
- `/app/middleware/pages.global.js` - Routage dynamique
- `/app/composables/useBBCode.js` - Logique de traitement BBCode

## Chemin de migration
Le projet inclut des utilitaires pour migrer de la base de données simulée vers une vraie base de données MySQL/SQLite. Voir `/server/utils/db-setup.js` et les fichiers de documentation associés pour les procédures de migration.