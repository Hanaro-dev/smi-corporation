# Référence API - SMI Corporation CMS

Documentation complète de l'API pour le système de gestion de contenu SMI Corporation.

## Vue d'ensemble

Le CMS SMI Corporation fournit une API REST complète pour la gestion des utilisateurs, du contenu, des médias et de l'administration système. L'API suit les conventions RESTful et utilise JSON pour l'échange de données.

**URL de base :** `/api`  
**Authentification :** Basée sur JWT avec cookies httpOnly  
**Content-Type :** `application/json` (sauf téléchargements de fichiers)  
**Protection CSRF :** Protection configurable basée sur les tokens  

## Table des Matières

- [Authentification et Sécurité](#authentication--security)
- [Gestion des Utilisateurs](#user-management)  
- [Rôles et Permissions](#roles--permissions)
- [Gestion de Contenu](#content-management)
- [Gestion des Médias](#media-management)
- [Système et Audit](#system--audit)
- [Gestion des Erreurs](#error-handling)
- [Limitation de Débit](#rate-limiting)

---

## Authentification et Sécurité

### Connexion
**POST** `/api/auth/login`

Authentifier l'utilisateur et créer une session.

**Corps de la Requête :**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "redirect": "/admin" // optionnel, par défaut: "/"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": {
      "id": 1,
      "name": "admin"
    }
  },
  "token": "jwt.token.here",
  "expiresIn": 3600,
  "redirect": "/admin"
}
```

**Fonctionnalités de Sécurité :**
- Limitation de débit : 5 tentatives par minute par IP
- Validation et assainissement des entrées
- Journalisation d'audit
- Vérification sécurisée des mots de passe

**Réponses d'Erreur :**
- `400` - Erreurs de validation
- `401` - Identifiants invalides
- `429` - Limite de débit dépassée

### Connexion Améliorée
**POST** `/api/auth/login-improved`

Connexion améliorée avec intégration AuthService et meilleur suivi.

Même format de requête/réponse que la connexion standard avec des fonctionnalités de sécurité supplémentaires :
- Détection IP client améliorée
- Suivi de l'agent utilisateur
- Journalisation d'audit améliorée

### Déconnexion
**POST** `/api/auth/logout`

Terminer la session utilisateur.

**Requête :** Aucun corps requis

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Actions Effectuées :**
- Supprime la session serveur
- Retire le cookie d'authentification
- Efface le contexte utilisateur
- Enregistre l'événement de déconnexion

### Inscription Utilisateur
**POST** `/api/auth/register`

Enregistrer un nouveau compte utilisateur.

**Corps de la Requête :**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "username": "newusername"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Utilisateur enregistré avec succès",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "username": "newusername"
  }
}
```

**Validation :**
- Vérification de l'unicité de l'email
- Validation des champs requis
- Force du mot de passe (TODO production)

### Validation de Session
**GET** `/api/_auth/session`

Valider la session actuelle et récupérer les informations utilisateur.

**En-têtes :** Requiert le cookie d'authentification

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": {
      "id": 1,
      "name": "admin",
      "permissions": ["manage_users", "manage_pages"]
    }
  }
}
```

**Response (401):**
```json
{
  "user": null
}
```

### Token CSRF
**GET** `/api/csrf-token`

Initialiser le token de protection CSRF.

**Response (200):**
```json
{
  "success": true,
  "message": "CSRF token initialized",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Gestion des Utilisateurs

Tous les endpoints de gestion des utilisateurs nécessitent une authentification et des permissions appropriées.

### Lister les Utilisateurs
**GET** `/api/users`

Récupérer une liste paginée des utilisateurs.

**Permission Requise :** `manage_users`

**Paramètres de Requête :**
- `page` (nombre, par défaut : 1) - Numéro de page
- `limit` (nombre, par défaut : 10) - Éléments par page
- `role_id` (nombre, optionnel) - Filtrer par ID de rôle

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": {
        "id": 1,
        "name": "admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Créer un Utilisateur
**POST** `/api/users`

Créer un nouveau compte utilisateur.

**Permission Requise :** `manage_users`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "password": "securepassword",
  "role_id": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 3,
    "name": "Jane Smith",
    "username": "janesmith",
    "email": "jane@example.com",
    "role_id": 2
  }
}
```

**Validation :**
- Unicité de l'email
- Existence du rôle
- Champs requis

### Obtenir un Utilisateur
**GET** `/api/users/:id`

Récupérer les informations d'un utilisateur spécifique.

**Contrôle d'Accès :** Propre profil OU permission `manage_users`

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "role": {
    "id": 1,
    "name": "admin",
    "permissions": ["manage_users", "manage_pages"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Mettre à Jour un Utilisateur
**PUT** `/api/users/:id`

Mettre à jour les informations utilisateur.

**Contrôle d'Accès :** Propre profil OU permission `manage_users`

**Corps de la Requête :** (tous les champs optionnels)
```json
{
  "name": "John Updated",
  "username": "johnupdated",
  "email": "johnupdated@example.com",
  "password": "newpassword",
  "role_id": 2
}
```

**Règles Spéciales :**
- Les changements de rôle nécessitent la permission `manage_users`
- Validation de l'unicité de l'email
- Invalidation de session lors du changement de rôle
- Piste d'audit complète

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur mis à jour avec succès",
  "user": {
    "id": 1,
    "name": "John Updated"
  }
}
```

### Supprimer un Utilisateur
**DELETE** `/api/users/:id`

Supprimer un compte utilisateur.

**Permission Requise :** `manage_users`

**Restrictions :** Ne peut pas supprimer son propre compte

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

**Actions :**
- Nettoie les sessions utilisateur
- Supprime l'utilisateur de la base de données
- Journalisation d'audit

### Suppression en Lot d'Utilisateur
**DELETE** `/api/users`

Supprimer un utilisateur par paramètre de requête.

**Permission Requise :** `manage_users`

**Paramètres de Requête :**
- `id` (nombre, requis) - ID de l'utilisateur à supprimer

**Même réponse et restrictions que la suppression individuelle**

---

## Rôles et Permissions

Système de contrôle d'accès basé sur les rôles avec des permissions granulaires.

### Lister les Rôles
**GET** `/api/roles`

Récupérer tous les rôles avec leurs permissions.

**Requis :** Authentification

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "admin",
    "permissions": [
      {
        "id": 1,
        "name": "manage_users"
      },
      {
        "id": 2,
        "name": "manage_pages"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Créer un Rôle
**POST** `/api/roles`

Créer un nouveau rôle.

**Permission Requise :** `manage_roles`

**Corps de la Requête :**
```json
{
  "name": "editor"
}
```

**Réponse (201) :**
```json
{
  "success": true,
  "message": "Rôle créé avec succès",
  "role": {
    "id": 3,
    "name": "editor"
  }
}
```

**Validation :** Unicité du nom

### Obtenir un Rôle
**GET** `/api/roles/:id`

Récupérer un rôle spécifique avec ses permissions.

**Requis :** Authentification

**Response (200):**
```json
{
  "id": 1,
  "name": "admin",
  "permissions": [
    {
      "id": 1,
      "name": "manage_users"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Mettre à Jour un Rôle
**PUT** `/api/roles/:id`

Mettre à jour le nom du rôle.

**Permission Requise :** `manage_roles`

**Corps de la Requête :**
```json
{
  "name": "super_admin"
}
```

**Validation :** Unicité du nom

### Supprimer un Rôle
**DELETE** `/api/roles/:id`

Supprimer un rôle.

**Permission Requise :** `manage_roles`

**Restrictions :** Ne peut pas supprimer un rôle assigné aux utilisateurs

**Response (200):**
```json
{
  "success": true,
  "message": "Rôle supprimé avec succès"
}
```

### Permissions du Rôle
**GET** `/api/roles/:id/permissions`

Obtenir toutes les permissions pour un rôle spécifique.

**Requis :** Authentification

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "manage_users",
    "description": "Gérer les utilisateurs"
  }
]
```

### Assigner une Permission au Rôle
**POST** `/api/roles/:id/permissions`

Assigner une permission à un rôle.

**Permission Requise :** `manage_permissions`

**Request Body:**
```json
{
  "permissionId": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permission assignée avec succès"
}
```

**Validation :**
- Existence du rôle
- Existence de la permission
- Vérification des assignations en double

### Retirer une Permission du Rôle
**DELETE** `/api/roles/:id/permissions`

Retirer une permission d'un rôle.

**Permission Requise :** `manage_permissions`

**Paramètres de Requête :**
- `permissionId` (nombre, requis) - ID de la permission à retirer

**Response (200):**
```json
{
  "success": true,
  "message": "Permission retirée avec succès"
}
```

### Lister les Permissions
**GET** `/api/permissions`

Récupérer toutes les permissions.

**Requis :** Authentification

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "manage_users",
    "description": "Gérer les utilisateurs",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Créer une Permission
**POST** `/api/permissions`

Créer une nouvelle permission.

**Permission Requise :** `manage_permissions`

**Request Body:**
```json
{
  "name": "manage_content",
  "description": "Gérer le contenu"
}
```

**Validation :** Unicité du nom

### Mettre à Jour une Permission
**PUT** `/api/permissions/:id`

Mettre à jour une permission.

**Permission Requise :** `manage_permissions`

**Request Body:**
```json
{
  "name": "manage_content_advanced",
  "description": "Gérer le contenu avancé"
}
```

### Supprimer une Permission
**DELETE** `/api/permissions/:id`

Supprimer une permission.

**Permission Requise :** `manage_permissions`

**Restrictions :** Ne peut pas supprimer une permission assignée aux rôles

---

## Gestion de Contenu

Système de gestion de pages dynamiques avec structure hiérarchique.

### Lister les Pages
**GET** `/api/pages`

Récupérer une liste paginée des pages.

**Paramètres de Requête :**
- `page` (nombre, par défaut : 1) - Numéro de page
- `limit` (nombre, par défaut : 10) - Éléments par page
- `search` (chaîne, optionnel) - Recherche dans les titres

**Response (200):**
```json
{
  "pages": [
    {
      "id": 1,
      "title": "Welcome Page",
      "slug": "welcome",
      "content": "<p>Welcome to our site</p>",
      "status": "published",
      "parentId": null,
      "order": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### Lister les Pages Publiées
**GET** `/api/pages/published`

Récupérer uniquement les pages publiées.

**Mêmes paramètres et format de réponse que Lister les Pages**

**Filtre :** `status: 'published'`

### Obtenir l'Arbre des Pages
**GET** `/api/pages/tree`

Récupérer la structure hiérarchique des pages.

**Response (200):**
```json
{
  "tree": [
    {
      "id": 1,
      "title": "Home",
      "slug": "home",
      "children": [
        {
          "id": 2,
          "title": "About",
          "slug": "about",
          "children": []
        }
      ]
    }
  ]
}
```

**Fonctionnalités :**
- Support complet de la hiérarchie
- Compatible avec les bases de données simulaires et réelles

### Obtenir une Page par Slug
**GET** `/api/pages/by-slug/:slug`

Récupérer une page par identifiant slug.

**Response (200):**
```json
{
  "id": 1,
  "title": "Welcome Page",
  "slug": "welcome",
  "content": "<p>Welcome content</p>",
  "status": "published",
  "parentId": null,
  "order": 1
}
```

**Response (404):**
```json
{
  "error": "Page not found"
}
```

### Obtenir une Page par ID
**GET** `/api/pages/:id`

Récupérer une page spécifique par ID.

**Même format de réponse que Obtenir une Page par Slug**

### Créer une Page
**POST** `/api/pages`

Créer une nouvelle page.

**Requis :** Authentification

**Corps de la Requête :**
```json
{
  "title": "New Page",
  "content": "<p>Page content here</p>",
  "slug": "new-page", // optionnel, auto-généré si non fourni
  "status": "draft", // optionnel, par défaut: "draft"
  "parentId": 1 // optionnel, pour la hiérarchie
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Page créée avec succès",
  "page": {
    "id": 3,
    "title": "New Page",
    "slug": "new-page",
    "content": "<p>Page content here</p>",
    "status": "draft",
    "parentId": 1,
    "order": 1
  }
}
```

**Fonctionnalités :**
- Génération automatique de slug à partir du titre
- Assainissement du contenu avec DOMPurify
- Validation de la hiérarchie (max 3 niveaux de profondeur)
- Validation de l'unicité du slug

**Erreurs de Validation :**
- Le slug existe déjà
- Le parent n'existe pas
- Profondeur maximale de la hiérarchie dépassée

### Mettre à Jour une Page
**PUT** `/api/pages/:id`

Mettre à jour une page existante.

**Requis :** Authentification

**Corps de la Requête :** (tous les champs optionnels)
```json
{
  "title": "Updated Page Title",
  "content": "<p>Updated content</p>",
  "slug": "updated-slug",
  "status": "published",
  "parentId": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Page mise à jour avec succès",
  "page": {
    "id": 3,
    "title": "Updated Page Title"
  }
}
```

**Validation Spéciale :**
- Empêche les relations parent circulaires
- Validation de la profondeur de la hiérarchie pour les changements de parent
- Unicité du slug (excluant la page actuelle)

### Mettre à Jour le Statut de la Page
**PATCH** `/api/pages/:id/status`

Mettre à jour uniquement le statut de la page.

**Requis :** Authentification

**Request Body:**
```json
{
  "status": "published" // or "draft"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Statut de la page mis à jour",
  "page": {
    "id": 3,
    "status": "published"
  }
}
```

### Réorganiser les Pages
**PATCH** `/api/pages/:id/order`

Changer l'ordre des pages dans le même parent.

**Requis :** Authentification

**Request Body:**
```json
{
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ordre de la page mis à jour"
}
```

**Fonctionnalités :**
- Réorganisation atomique avec transactions de base de données
- Ajustement automatique de l'ordre des autres pages

### Supprimer une Page
**DELETE** `/api/pages/:id`

Supprimer une page.

**Requis :** Authentification

**Restrictions :** Ne peut pas supprimer les pages avec des enfants

**Response (200):**
```json
{
  "success": true,
  "message": "Page supprimée avec succès"
}
```

**Actions :**
- Réorganise les pages frères restantes
- Valide qu'aucune page enfant n'existe

---

## Media Management

Comprehensive image upload, processing, and management system.

### Upload Image
**POST** `/api/images`

Upload and process new image.

**Required:** Authentication

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `image` (file, required) - Image file to upload
- `title` (string, optional) - Image title
- `description` (string, optional) - Image description
- `altText` (string, optional) - Alt text for accessibility

**File Validation:**
- **Max Size:** 10MB
- **Allowed Types:** JPEG, PNG, GIF, WebP, SVG
- **Magic Number Validation:** File type verification beyond extension

**Response (201):**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "image": {
    "id": 15,
    "filename": "vacation-photo.jpg",
    "originalName": "IMG_2024.jpg",
    "url": "/images/2024-01/vacation-photo.jpg",
    "width": 1920,
    "height": 1080,
    "size": 245760,
    "format": "jpeg",
    "title": "Vacation Photo",
    "description": "Summer vacation 2024",
    "altText": "Beach sunset view",
    "md5Hash": "d41d8cd98f00b204e9800998ecf8427e",
    "variants": [
      {
        "type": "thumbnail",
        "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
        "width": 150,
        "height": 84
      },
      {
        "type": "small",
        "url": "/images/2024-01/vacation-photo-small.jpg",
        "width": 400,
        "height": 225
      },
      {
        "type": "medium",
        "url": "/images/2024-01/vacation-photo-medium.jpg",
        "width": 800,
        "height": 450
      },
      {
        "type": "large",
        "url": "/images/2024-01/vacation-photo-large.jpg",
        "width": 1200,
        "height": 675
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Processing Features:**
- **Duplicate Detection:** MD5 hash comparison prevents duplicate uploads
- **Automatic Variants:** Generates thumbnail, small, medium, large sizes
- **Sharp Processing:** High-quality image resizing and optimization
- **Organized Storage:** Files organized by date (YYYY-MM format)
- **Metadata Extraction:** Width, height, format detection

**Error Examples:**
```json
// File too large
{
  "error": "File too large. Maximum size is 10MB",
  "code": "FILE_TOO_LARGE"
}

// Invalid file type
{
  "error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG",
  "code": "INVALID_FILE_TYPE"
}

// Duplicate file
{
  "error": "Cette image existe déjà",
  "code": "DUPLICATE_FILE",
  "existingImage": {
    "id": 12,
    "url": "/images/2024-01/existing-photo.jpg"
  }
}
```

### List Images
**GET** `/api/images`

Retrieve images with filtering and pagination.

**Query Parameters:**
- `limit` (number, default: 24) - Images per page
- `offset` (number, default: 0) - Skip images
- `search` (string, optional) - Search in title, filename, description
- `format` (string, optional) - Filter by format (jpeg, png, gif, webp, svg)
- `date` (string, optional) - Date filter: 'today', 'week', 'month', 'year'

**Response (200):**
```json
{
  "images": [
    {
      "id": 15,
      "filename": "vacation-photo.jpg",
      "originalName": "IMG_2024.jpg",
      "url": "/images/2024-01/vacation-photo.jpg",
      "width": 1920,
      "height": 1080,
      "size": 245760,
      "format": "jpeg",
      "title": "Vacation Photo",
      "description": "Summer vacation 2024",
      "altText": "Beach sunset view",
      "variants": [
        {
          "type": "thumbnail",
          "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
          "width": 150,
          "height": 84
        }
      ],
      "user": {
        "id": 1,
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 156,
  "totalSize": 52428800,
  "offset": 0,
  "limit": 24
}
```

**Search Features:**
- Full-text search across title, filename, description
- Format filtering
- Date-based filtering
- Pagination support

### Get Image
**GET** `/api/images/:id`

Retrieve specific image with all variants.

**Response (200):**
```json
{
  "id": 15,
  "filename": "vacation-photo.jpg",
  "originalName": "IMG_2024.jpg",
  "url": "/images/2024-01/vacation-photo.jpg",
  "width": 1920,
  "height": 1080,
  "size": 245760,
  "format": "jpeg",
  "title": "Vacation Photo",
  "description": "Summer vacation 2024",
  "altText": "Beach sunset view",
  "md5Hash": "d41d8cd98f00b204e9800998ecf8427e",
  "variants": [
    {
      "type": "thumbnail",
      "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
      "width": 150,
      "height": 84
    },
    {
      "type": "small",
      "url": "/images/2024-01/vacation-photo-small.jpg",
      "width": 400,
      "height": 225
    },
    {
      "type": "medium",
      "url": "/images/2024-01/vacation-photo-medium.jpg",
      "width": 800,
      "height": 450
    },
    {
      "type": "large",
      "url": "/images/2024-01/vacation-photo-large.jpg",
      "width": 1200,
      "height": 675
    }
  ],
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Update Image Metadata
**PATCH** `/api/images/:id`

Update image title, description, and alt text.

**Request Body:**
```json
{
  "title": "Updated Image Title",
  "description": "Updated description",
  "altText": "Updated alt text"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image mise à jour avec succès",
  "image": {
    "id": 15,
    "title": "Updated Image Title",
    "description": "Updated description",
    "altText": "Updated alt text"
  }
}
```

### Crop Image
**POST** `/api/images/:id/crop`

Crop image and regenerate all variants.

**Request Body:**
```json
{
  "coordinates": {
    "left": 100,
    "top": 50,
    "width": 800,
    "height": 600
  },
  "aspectRatio": 1.33 // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image recadrée avec succès",
  "image": {
    "id": 15,
    "url": "/images/2024-01/vacation-photo.jpg",
    "width": 800,
    "height": 600,
    "variants": [
      {
        "type": "thumbnail",
        "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
        "width": 150,
        "height": 113
      }
    ]
  }
}
```

**Processing:**
- Crops original image using Sharp
- Regenerates all variant sizes
- Updates database with new dimensions
- Cleans up old variant files
- Maintains aspect ratio if specified

### Get Image Statistics
**GET** `/api/images/stats`

Retrieve image statistics and storage information.

**Response (200):**
```json
{
  "totalImages": 156,
  "totalSize": 52428800, // bytes
  "formats": [
    {
      "format": "jpeg",
      "count": 89,
      "size": 35651200
    },
    {
      "format": "png",
      "count": 45,
      "size": 12582400
    },
    {
      "format": "gif",
      "count": 15,
      "size": 3145728
    },
    {
      "format": "webp",
      "count": 7,
      "size": 1049600
    }
  ]
}
```

### Delete Image
**DELETE** `/api/images`

Delete image and all its variants.

**Request Body:**
```json
{
  "id": 15
}
```

**Alternative Request Body:**
```json
{
  "url": "/images/2024-01/vacation-photo.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "id": 15,
  "message": "Image supprimée avec succès",
  "errors": null // or array of file deletion errors
}
```

**Actions:**
- Deletes original image file
- Deletes all variant files
- Removes database entries
- Returns any file system errors

**Error Response with Partial Failure:**
```json
{
  "success": true,
  "id": 15,
  "message": "Image supprimée avec succès",
  "errors": [
    "Failed to delete /images/2024-01/vacation-photo-medium.jpg: File not found"
  ]
}
```

---

## System & Audit

System administration and audit logging capabilities.

### Get Audit Logs
**GET** `/api/audit/logs`

Retrieve system audit logs with filtering.

**Required Permission:** `admin` role OR `manage_audit` permission

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Logs per page
- `entity_type` (string, optional) - Filter by entity type (User, Page, Role, etc.)
- `action` (string, optional) - Filter by action (CREATE, UPDATE, DELETE)
- `entity_id` (number, optional) - Filter by specific entity ID
- `user_id` (number, optional) - Filter by user who performed action

**Response (200):**
```json
{
  "logs": [
    {
      "id": 123,
      "entity_type": "User",
      "entity_id": 5,
      "action": "UPDATE",
      "changes": {
        "before": {
          "name": "Old Name",
          "email": "old@example.com"
        },
        "after": {
          "name": "New Name",
          "email": "new@example.com"
        }
      },
      "user": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1543,
  "page": 1,
  "limit": 20,
  "totalPages": 78
}
```

**Log Types:**
- User management (CREATE, UPDATE, DELETE)
- Role and permission changes
- Page content modifications
- Login/logout events
- System configuration changes

### CSRF Test Endpoint
**POST** `/api/test/csrf`

Test CSRF protection functionality (development only).

**Response (200):**
```json
{
  "success": true,
  "message": "CSRF test endpoint",
  "csrf": {
    "token": "csrf-token-value",
    "valid": true
  },
  "request": {
    "method": "POST",
    "headers": {},
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Error Handling

The API uses consistent error response formats across all endpoints.

### Standard Error Response

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE", // optional
  "details": {}, // optional additional context
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, constraint violations |
| 422 | Unprocessable Entity | Validation errors with details |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Server-side errors |

### Common Error Examples

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

**Authentication Required (401):**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Permission Denied (403):**
```json
{
  "error": "Permission denied",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": "manage_users"
}
```

**Resource Not Found (404):**
```json
{
  "error": "User not found",
  "code": "RESOURCE_NOT_FOUND",
  "resource": "User",
  "id": 999
}
```

**Duplicate Resource (409):**
```json
{
  "error": "Email already exists",
  "code": "DUPLICATE_RESOURCE",
  "field": "email",
  "value": "existing@example.com"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 5,
  "window": "1 minute"
}
```

---

## Rate Limiting

Rate limiting is implemented on authentication endpoints to prevent abuse.

### Login Rate Limiting

**Endpoint:** `/api/auth/login`, `/api/auth/login-improved`

**Limits:**
- 5 attempts per minute per IP address
- Counter resets after successful authentication
- Applies to all login attempts regardless of success/failure

**Headers in Response:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1705317000
```

**Rate Limit Exceeded Response (429):**
```json
{
  "error": "Too many login attempts",
  "code": "RATE_LIMIT_EXCEEDED", 
  "retryAfter": 45,
  "message": "Please try again in 45 seconds"
}
```

### Future Rate Limiting

Plans for additional rate limiting include:
- API endpoints: 100 requests per minute per user
- File uploads: 10 uploads per minute per user
- User registration: 3 registrations per hour per IP

---

## Authentication Headers

### Required Headers

**For authenticated requests:**
```
Cookie: auth_token=jwt.token.here
```

**For CSRF-protected requests:**
```
X-XSRF-TOKEN: csrf-token-value
Cookie: XSRF-TOKEN=csrf-token-value
```

**For file uploads:**
```
Content-Type: multipart/form-data
Cookie: auth_token=jwt.token.here
```

### Optional Headers

**API versioning (future):**
```
Accept: application/json; version=1
```

**Request tracking:**
```
X-Request-ID: unique-request-identifier
```

---

## Database Modes

The API supports dual database modes for development and production.

### Mock Database Mode

**Environment:** `USE_MOCK_DB=true`

**Features:**
- In-memory data storage
- Predefined sample data
- Fast development setup
- Page management with full functionality
- Limited user/role functionality

**Limitations:**
- Data resets on server restart
- No persistence across sessions
- Simplified relationship handling

### Production Database Mode

**Environment:** `USE_MOCK_DB=false` or unset

**Features:**
- Full MySQL/SQLite database
- Complete relationship integrity
- Transaction support
- Full audit logging
- Production-ready performance

**Setup:** Requires database configuration in environment variables

---

## 🔄 API v2.1 - Améliorations (Juillet 2025)

### Services Centralisés
- **Authentification unifiée** : `authenticateUser()` dans tous les endpoints
- **Validation standardisée** : Classes de validation réutilisables
- **Audit automatique** : Logging systématique des actions sensibles
- **Gestion d'erreurs** : Messages d'erreur cohérents et informatifs

### Nouveaux Services Disponibles
```javascript
// Services centralisés maintenant disponibles
/server/services/auth-middleware.js     // Authentification
/server/services/validation-service.js  // Validation  
/server/services/audit-service.js       // Audit et logging
/server/constants/api-constants.js      // Constantes API
```

### Performance et Sécurité
- **70% de réduction** du code dupliqué dans les APIs
- **Validation plus stricte** des paramètres d'entrée
- **Protection renforcée** contre les injections et XSS
- **Audit complet** de toutes les actions administratives

Cette référence API fournit une documentation complète pour l'intégration avec SMI Corporation CMS. Pour des exemples d'implémentation et des patterns d'usage avancés, consultez le [Guide Développeur](DEVELOPER_GUIDE.md).

---

**API Reference mise à jour :** Juillet 2025  
**Version API :** v2.1.0  
**Compatible avec :** SMI Corporation CMS v2.x