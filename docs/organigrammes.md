# Documentation des Organigrammes - SMI Corporation

## Vue d'ensemble

Le système d'organigrammes de SMI Corporation permet de créer, gérer et afficher des structures organisationnelles hiérarchiques. Cette fonctionnalité s'intègre parfaitement dans le CMS existant avec support BBCode pour l'intégration dans les pages de contenu.

## Table des matières

1. [Architecture du système](#architecture-du-système)
2. [Modèles de données](#modèles-de-données)
3. [API Endpoints](#api-endpoints)
4. [Intégration BBCode](#intégration-bbcode)
5. [Interface d'administration](#interface-dadministration)
6. [Sécurité et permissions](#sécurité-et-permissions)
7. [Guide d'utilisation](#guide-dutilisation)
8. [Exemples pratiques](#exemples-pratiques)

## Architecture du système

### Stack technique
- **Backend** : Nuxt.js Server API (Nitro)
- **Base de données** : Sequelize ORM avec support MySQL/SQLite
- **Authentification** : JWT avec système de permissions
- **Validation** : DOMPurify + validation personnalisée
- **Cache** : Support dual-mode (mock/real database)

### Structure des fichiers
```
server/api/organigrammes/
├── index.js                    # CRUD organigrammes (GET, POST)
├── [id].js                     # Operations par ID (GET, PUT, DELETE)
├── [slug].get.js              # Endpoint BBCode (GET par slug)
└── [id]/
    └── employees.js           # Gestion des employés (GET, POST)

server/models.js               # Export des modèles Organigramme & Employee
server/utils/mock-db.js        # Données simulées avec exemples
```

## Modèles de données

### Modèle Organigramme

```javascript
{
  id: INTEGER,                 // Identifiant unique
  title: STRING(255),          // Titre de l'organigramme
  description: TEXT,           // Description optionnelle
  slug: STRING(255),           // URL-friendly identifier (auto-généré)
  status: ENUM('draft', 'published'), // Statut de publication
  userId: INTEGER,             // ID du créateur
  createdAt: DATETIME,         // Date de création
  updatedAt: DATETIME          // Date de dernière modification
}
```

**Validations :**
- `title` : requis, 3-255 caractères
- `slug` : unique, généré automatiquement depuis le titre
- `status` : 'draft' ou 'published' uniquement
- `userId` : requis, doit exister dans la table User

### Modèle Employee

```javascript
{
  id: INTEGER,                 // Identifiant unique
  name: STRING(100),           // Nom complet de l'employé
  position: STRING(150),       // Poste/titre du poste
  email: STRING(255),          // Email (optionnel)
  phone: STRING(50),           // Téléphone (optionnel)
  parentId: INTEGER,           // ID du supérieur hiérarchique
  organigrammeId: INTEGER,     // ID de l'organigramme
  level: INTEGER,              // Niveau dans la hiérarchie (0-9)
  orderIndex: INTEGER,         // Ordre d'affichage parmi les pairs
  isActive: BOOLEAN,           // Statut actif/inactif
  createdAt: DATETIME,         // Date de création
  updatedAt: DATETIME          // Date de dernière modification
}
```

**Validations :**
- `name` : requis, 2-100 caractères
- `position` : requis, 2-150 caractères
- `email` : format email valide si fourni
- `phone` : caractères numériques et symboles uniquement
- `level` : maximum 9 (10 niveaux de profondeur)

### Relations
- Un `Organigramme` a plusieurs `Employee`
- Un `Employee` appartient à un `Organigramme`
- Un `Employee` peut avoir un parent (`parentId`)
- Un `Employee` peut avoir plusieurs enfants

## API Endpoints

### Authentification requise
Tous les endpoints nécessitent un token JWT valide via le cookie `auth_token`.

### GET /api/organigrammes
**Liste paginée des organigrammes**

**Paramètres de requête :**
```javascript
{
  page: number = 1,           // Numéro de page
  limit: number = 10,         // Nombre d'éléments par page
  search: string = '',        // Recherche dans titre/description
  status: string = ''         // Filtrer par statut ('draft'|'published')
}
```

**Réponse :**
```javascript
{
  organigrammes: [
    {
      id: 1,
      title: "Direction Générale",
      description: "Structure organisationnelle...",
      slug: "direction-generale",
      status: "published",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      user: {
        id: 1,
        name: "Admin User",
        username: "admin"
      }
    }
  ],
  total: 3,
  page: 1,
  totalPages: 1
}
```

**Permissions requises :** `view`

### POST /api/organigrammes
**Créer un nouvel organigramme**

**Corps de la requête :**
```javascript
{
  title: "Nouveau Département",        // Requis
  description: "Description...",       // Optionnel
  status: "draft"                      // Optionnel, défaut: 'draft'
}
```

**Réponse :** Objet organigramme créé avec slug auto-généré

**Permissions requises :** `manage_organigrammes`

### GET /api/organigrammes/:id
**Récupérer un organigramme avec sa structure hiérarchique**

**Réponse :**
```javascript
{
  id: 1,
  title: "Direction Générale",
  description: "Structure organisationnelle...",
  slug: "direction-generale",
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  user: { id: 1, name: "Admin User", username: "admin" },
  structure: [
    {
      name: "Marie Dubois",
      position: "Directrice Générale",
      email: "marie.dubois@smi-corp.fr",
      phone: "01 23 45 67 89",
      children: [
        {
          name: "Pierre Martin",
          position: "Directeur des Opérations",
          email: "pierre.martin@smi-corp.fr",
          phone: "01 23 45 67 90",
          children: [...]
        }
      ]
    }
  ]
}
```

**Permissions requises :** `view`

### PUT /api/organigrammes/:id
**Mettre à jour un organigramme**

**Corps de la requête :** Mêmes champs que POST (tous optionnels)
**Permissions requises :** `manage_organigrammes`

### DELETE /api/organigrammes/:id
**Supprimer un organigramme et tous ses employés**

**Réponse :**
```javascript
{
  success: true,
  message: "Organigramme supprimé avec succès."
}
```

**Permissions requises :** `manage_organigrammes`

### GET /api/organigrammes/:slug
**Récupérer un organigramme publié par son slug (pour BBCode)**

**Utilisation :** Endpoint public pour l'intégration BBCode
**Contraintes :** Seuls les organigrammes avec `status: 'published'` sont accessibles

### GET /api/organigrammes/:id/employees
**Lister les employés d'un organigramme**

**Réponse :**
```javascript
{
  employees: [
    {
      id: 1,
      name: "Marie Dubois",
      position: "Directrice Générale",
      email: "marie.dubois@smi-corp.fr",
      phone: "01 23 45 67 89",
      parentId: null,
      level: 0,
      orderIndex: 0,
      isActive: true
    }
  ]
}
```

**Permissions requises :** `view`

### POST /api/organigrammes/:id/employees
**Ajouter un employé à un organigramme**

**Corps de la requête :**
```javascript
{
  name: "Nouvel Employé",             // Requis
  position: "Poste",                  // Requis
  email: "email@example.com",         // Optionnel
  phone: "01 23 45 67 89",           // Optionnel
  parentId: 1                         // Optionnel (ID du supérieur)
}
```

**Validations automatiques :**
- Calcul automatique du niveau hiérarchique
- Vérification de la profondeur maximale (10 niveaux)
- Génération automatique de l'ordre d'affichage

**Permissions requises :** `manage_organigrammes`

## Intégration BBCode

### Syntaxe
```bbcode
[orgchart id="slug-de-lorganigramme"]
```

### Exemples
```bbcode
[orgchart id="direction-generale"]
[orgchart id="departement-it"]
[orgchart id="equipe-marketing"]
```

### Fonctionnement
1. Le BBCode est analysé côté serveur pour la sécurité
2. L'API `/api/organigrammes/:slug` est appelée
3. Seuls les organigrammes publiés sont accessibles
4. La structure hiérarchique est rendue en HTML interactif

### Intégration dans les pages
```javascript
// Dans le contenu d'une page
const content = `
# Notre organisation

Voici la structure de notre direction générale :

[orgchart id="direction-generale"]

Et notre département IT :

[orgchart id="departement-it"]
`;
```

## Interface d'administration

### Accès
- URL : `/admin/organigrammes` (à implémenter)
- Permission requise : `manage_organigrammes`

### Fonctionnalités prévues
1. **Liste des organigrammes**
   - Vue d'ensemble avec pagination
   - Filtres par statut et recherche
   - Actions rapides (éditer, supprimer, changer statut)

2. **Création/Édition**
   - Formulaire de création d'organigramme
   - Éditeur visuel de hiérarchie
   - Gestion des employés par drag & drop

3. **Gestion des employés**
   - Ajout/modification/suppression d'employés
   - Réorganisation hiérarchique
   - Import/export des données

## Sécurité et permissions

### Système de permissions
- **`view`** : Lecture des organigrammes
- **`manage_organigrammes`** : Gestion complète des organigrammes

### Attribution par rôle
```javascript
// Rôles par défaut
admin: ['admin', 'view', 'manage_organigrammes']     // Accès complet
editor: ['edit', 'view', 'manage_organigrammes']     // Gestion organigrammes
user: ['view']                                       // Lecture uniquement
```

### Mesures de sécurité
1. **Authentification** : JWT requis pour tous les endpoints
2. **Validation** : DOMPurify pour assainir les entrées
3. **Permissions** : Vérification granulaire par action
4. **Audit** : Journalisation de toutes les opérations
5. **Rate limiting** : Protection contre les abus
6. **Validation hiérarchique** : Prévention des boucles infinies

### Audit logging
Toutes les opérations sont enregistrées :
```javascript
{
  userId: 1,
  action: 'organigramme_create|organigramme_update|organigramme_delete|employee_create',
  details: "Description de l'action",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## Guide d'utilisation

### Étape 1 : Créer un organigramme
```bash
curl -X POST http://localhost:3000/api/organigrammes \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "title": "Département Marketing",
    "description": "Structure du département marketing",
    "status": "draft"
  }'
```

### Étape 2 : Ajouter des employés
```bash
# Ajouter le directeur (niveau 0)
curl -X POST http://localhost:3000/api/organigrammes/1/employees \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "name": "Jean Dupont",
    "position": "Directeur Marketing",
    "email": "jean.dupont@smi-corp.fr"
  }'

# Ajouter un responsable sous le directeur
curl -X POST http://localhost:3000/api/organigrammes/1/employees \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "name": "Marie Martin",
    "position": "Responsable Communication",
    "email": "marie.martin@smi-corp.fr",
    "parentId": 1
  }'
```

### Étape 3 : Publier l'organigramme
```bash
curl -X PUT http://localhost:3000/api/organigrammes/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"status": "published"}'
```

### Étape 4 : Intégrer dans une page
```bbcode
[orgchart id="departement-marketing"]
```

## Exemples pratiques

### Données d'exemple incluses

Le système inclut 3 organigrammes d'exemple :

#### 1. Direction Générale (`direction-generale`)
```
Marie Dubois (Directrice Générale)
├── Pierre Martin (Directeur des Opérations)
│   ├── Thomas Leroy (Responsable Production)
│   └── Julie Moreau (Responsable Qualité)
└── Sophie Laurent (Directrice des Ressources Humaines)
```

#### 2. Département IT (`departement-it`)
```
Alexandre Durand (DSI)
├── Sarah Petit (Lead Developer)
│   └── Lucas Bernard (Développeur Junior)
└── Émilie Rousseau (Responsable Infrastructure)
```

#### 3. Équipe Marketing (`equipe-marketing`) - Brouillon
```
Catherine Moreau (Directrice Marketing)
└── David Lefevre (Chargé de Communication)
```

### Cas d'usage courants

#### 1. Affichage dans une page "À propos"
```markdown
# À propos de SMI Corporation

## Notre organisation

SMI Corporation est structurée autour d'une direction générale forte :

[orgchart id="direction-generale"]

## Notre équipe technique

Notre département IT assure le développement et la maintenance :

[orgchart id="departement-it"]
```

#### 2. Page dédiée aux organigrammes
```javascript
// pages/organisation.vue
<template>
  <div>
    <h1>Structure organisationnelle</h1>
    
    <section>
      <h2>Direction Générale</h2>
      <BBCodeRenderer content="[orgchart id=&quot;direction-generale&quot;]" />
    </section>
    
    <section>
      <h2>Département IT</h2>
      <BBCodeRenderer content="[orgchart id=&quot;departement-it&quot;]" />
    </section>
  </div>
</template>
```

#### 3. Import en masse d'employés
```javascript
// Exemple de script d'import
const employees = [
  { name: "Alice Martin", position: "CEO", parentId: null },
  { name: "Bob Dupont", position: "CTO", parentId: 1 },
  { name: "Carol Smith", position: "Developer", parentId: 2 }
];

for (const emp of employees) {
  await fetch(`/api/organigrammes/${orgId}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emp)
  });
}
```

## Configuration et déploiement

### Variables d'environnement
```bash
USE_MOCK_DB=true          # Mode développement avec données simulées
JWT_SECRET=your-secret    # Clé secrète pour JWT
```

### Mode développement
```bash
# Utiliser les données simulées
npm run dev

# Les organigrammes d'exemple sont automatiquement disponibles
```

### Migration vers production
```bash
# Configurer la vraie base de données
USE_MOCK_DB=false

# Les modèles Sequelize créeront automatiquement les tables
```

### Performance
- Support de pagination sur tous les endpoints de liste
- Cache intelligent avec fallback mock/real database
- Génération optimisée des structures hiérarchiques
- Validation côté serveur pour éviter les requêtes inutiles

---

## Support et maintenance

### Logs d'audit
Toutes les opérations sont tracées dans la table `AuditLog` pour le suivi et le débogage.

### Surveillance
- Monitoring des performances API
- Alertes sur les erreurs de validation
- Suivi des tentatives d'accès non autorisé

### Évolutions prévues
1. Interface d'administration graphique
2. Export PDF des organigrammes
3. Thèmes visuels personnalisables
4. API GraphQL pour requêtes complexes
5. Synchronisation avec l'annuaire d'entreprise

---

*Documentation générée automatiquement - SMI Corporation v1.0*