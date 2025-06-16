# Architecture et Fonctionnement du Site SMI Corporation

Ce document présente l'architecture technique, les fonctionnalités et la structure des fichiers du site SMI Corporation.

## Vue d'ensemble

SMI Corporation est une application web complète basée sur Nuxt.js, offrant un système de gestion de contenu (CMS) avec authentification, gestion d'utilisateurs, pages dynamiques et gestion de médias. L'application est divisée en deux parties principales :

- **Interface publique** : accessible à tous les visiteurs
- **Interface d'administration** : accessible uniquement aux utilisateurs authentifiés avec les permissions appropriées

## Architecture Technique

### Technologies principales

- **Framework** : Nuxt.js (Vue.js)
- **CSS** : Tailwind CSS
- **Gestion d'état** : Pinia
- **Base de données** : Base de données simulée (mock-db) pour le développement
- **Authentification** : Système personnalisé avec sessions et cookies
- **Éditeur de contenu** : TipTap
- **Gestion d'images** : Système personnalisé

### Structure générale

L'application suit l'architecture standard de Nuxt.js avec une séparation claire entre :

- Frontend (app/*)
- Backend (server/*)
- Configuration (fichiers à la racine)

## Fonctionnalités Principales

### 1. Système d'authentification

- Inscription utilisateur
- Connexion/déconnexion
- Gestion des sessions
- Protection des routes

### 2. Gestion des utilisateurs

- Création/modification/suppression d'utilisateurs
- Attribution de rôles et permissions
- Profils utilisateurs

### 3. Gestion de pages

- Création/modification/suppression de pages dynamiques
- Éditeur de contenu riche
- Système de rendu des pages

### 4. Gestion d'images

- Téléchargement d'images
- Galerie d'images
- Modification et recadrage
- Statistiques d'utilisation

### 5. Système de permissions

- Gestion des rôles
- Permissions granulaires
- Contrôle d'accès

### 6. Mode sombre/clair

- Bascule entre thème clair et sombre
- Respect des préférences système

## Structure des Fichiers

### Fichiers racine

- **nuxt.config.ts** : Configuration principale de Nuxt
- **package.json** : Dépendances du projet
- **tsconfig.json** : Configuration TypeScript
- **eslint.config.mjs** : Configuration ESLint
- **content.config.ts** : Configuration du module de contenu

### Frontend (app/)

#### Pages principales

- **app/pages/index.vue** : Page d'accueil
- **app/pages/page.vue** : Rendu des pages dynamiques
- **app/pages/404.vue** : Page d'erreur 404
- **app/pages/error.vue** : Page d'erreur générique

#### Pages d'authentification

- **app/pages/auth/login.vue** : Page de connexion
- **app/pages/auth/register.vue** : Page d'inscription

#### Pages d'administration

- **app/pages/admin/index.vue** : Tableau de bord admin
- **app/pages/admin/users.vue** : Gestion des utilisateurs
- **app/pages/admin/pages.vue** : Gestion des pages
- **app/pages/admin/permissions.vue** : Gestion des permissions
- **app/pages/admin/images.vue** : Gestion des images
- **app/pages/admin/organigrammes.vue** : Gestion des organigrammes
- **app/pages/admin/profile.vue** : Profil utilisateur

#### Layouts

- **app/layouts/default.vue** : Layout principal pour l'interface publique
- **app/layouts/admin.vue** : Layout pour l'interface d'administration

#### Composants

- **app/components/HeaderBar.vue** : Barre de navigation
- **app/components/FooterBar.vue** : Pied de page
- **app/components/UserMenu.vue** : Menu utilisateur
- **app/components/UserForm.vue** : Formulaire utilisateur
- **app/components/TipTapEditor.vue** : Éditeur de contenu riche
- **app/components/ColorModePicker.vue** : Sélecteur de thème
- **app/components/ToastNotification.vue** : Notifications

##### Composants spécifiques

- **app/components/pages/PageRenderer.vue** : Rendu des pages dynamiques
- **app/components/images/ImageGallery.vue** : Galerie d'images
- **app/components/images/ImageUploader.vue** : Téléchargement d'images
- **app/components/images/ImageEditor.vue** : Édition d'images

#### Stores

- **app/stores/auth.js** : Gestion de l'état d'authentification

#### Middleware

- **app/middleware/auth.js** : Protection des routes authentifiées
- **app/middleware/pages.global.js** : Middleware global pour les pages

### Backend (server/)

#### API Routes

- **server/api/auth/login.post.js** : API de connexion
- **server/api/auth/register.post.js** : API d'inscription
- **server/api/auth/logout.post.js** : API de déconnexion
- **server/api/_auth/session.get.js** : Vérification de session

##### API Utilisateurs

- **server/api/users.js** : API principale utilisateurs
- **server/api/users/[id].js** : API utilisateur spécifique

##### API Pages

- **server/api/pages.js** : API des pages

##### API Images

- **server/api/images.post.js** : Upload d'images
- **server/api/images.delete.js** : Suppression d'images
- **server/api/images/index.js** : Liste des images
- **server/api/images/[id].js** : Image spécifique
- **server/api/images/[id].patch.js** : Modification d'image
- **server/api/images/[id]/crop.post.js** : Recadrage d'image
- **server/api/images/stats.js** : Statistiques d'images

##### API Permissions

- **server/api/permissions/index.js** : Liste des permissions
- **server/api/permissions/[id].js** : Permission spécifique
- **server/api/roles/index.js** : Liste des rôles
- **server/api/roles/[id].js** : Rôle spécifique
- **server/api/roles/[id]/permissions.js** : Permissions d'un rôle
- **server/api/roles/assign-permission.post.js** : Attribution de permission

#### Middleware Serveur

- **server/middleware/auth.js** : Middleware d'authentification
- **server/middleware/check-permission.js** : Vérification des permissions

#### Utilitaires

- **server/utils/mock-db.js** : Base de données simulée
- **server/utils/db-setup.js** : Configuration de la base de données
- **server/utils/permission-utils.js** : Utilitaires de permissions
- **server/utils/validators.js** : Validateurs de données

#### Services

- **server/services/audit-service.js** : Service d'audit

## Base de données

Le projet utilise actuellement une base de données simulée pour le développement (mock-db.js). La structure de la base de données est définie dans les fichiers :

- **server/models.js** : Définition des modèles de données
- **smi.sql** : Structure SQL de la base de données
- **pages-sample-data.sql** : Données d'exemple pour les pages

## Workflow typique

### Utilisateur public

1. Visite la page d'accueil (app/pages/index.vue)
2. Consulte les pages dynamiques via la route /page (app/pages/page.vue)
3. Peut s'inscrire ou se connecter via les pages d'authentification

### Utilisateur administrateur

1. Se connecte via la page de connexion
2. Accède au tableau de bord administrateur
3. Peut gérer les utilisateurs, pages, permissions et médias
4. Peut modifier son profil

## Configuration

La configuration principale du projet se trouve dans **nuxt.config.ts**, qui inclut :

- Configuration de l'application
- Modules Nuxt activés
- Mode couleur (thème clair/sombre)
- Configuration du runtime
- Hooks d'erreur

## Développement

Pour démarrer le serveur de développement :

```bash
npm run dev
```

Le serveur sera accessible à l'adresse http://localhost:3000.

## Production

Pour construire l'application pour la production :

```bash
npm run build
```

Pour prévisualiser la version de production localement :

```bash
npm run preview
```

## Points d'amélioration potentiels

1. Remplacement de la base de données simulée par une vraie base de données
2. Activation de la protection CSRF (commentée dans nuxt.config.ts)
3. Amélioration de la gestion des erreurs
4. Tests unitaires et d'intégration
5. Optimisation des performances