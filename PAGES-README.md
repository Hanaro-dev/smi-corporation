# Guide du système de gestion de pages

Ce document explique comment utiliser le système de gestion de pages de SMI Corporation et comment effectuer la migration vers une base de données réelle.

## Fonctionnalités implémentées

Le système de gestion de pages comprend les fonctionnalités suivantes :

- **Modèle de données complet** : Stockage des pages avec titre, contenu, slug, statut, etc.
- **Structure hiérarchique** : Pages parent/enfant avec jusqu'à 3 niveaux de profondeur
- **API complète** : Endpoints pour toutes les opérations CRUD, avec validation
- **Interface d'administration** : Interface conviviale pour gérer les pages
- **Routage dynamique** : Résolution automatique des URLs basée sur les slugs
- **Rendu des pages** : Composant de rendu avec support BBCode et navigation

## Architecture du système

```
app/
├── components/
│   └── pages/
│       └── PageRenderer.vue      # Composant réutilisable pour le rendu des pages
├── middleware/
│   └── pages.global.js           # Middleware de résolution de routes
├── pages/
│   ├── 404.vue                   # Page d'erreur 404
│   ├── error.vue                 # Page d'erreur générique
│   ├── page.vue                  # Page dynamique pour le rendu des pages
│   └── admin/
│       └── pages.vue             # Interface d'administration des pages 
└── server/
    │   └── pages.js                  # API de gestion des pages
    ├── models.js                     # Modèle de données Page
    ├── utils/
    └── api/
        └── db-setup.js              # Utilitaire pour la migration BDD
```

## Utilisation du système

### Créer et gérer des pages

1. Accédez à l'interface d'administration à l'adresse `/admin/pages`
2. Utilisez le bouton "Créer une nouvelle page" pour ajouter une page
3. Remplissez les champs requis :
   - Titre : Le titre de la page
   - Slug : L'URL personnalisée (générée automatiquement depuis le titre)
   - Page parente : Optionnel, pour créer une hiérarchie
   - Statut : Brouillon ou Publié
   - Contenu : Le contenu de la page en utilisant l'éditeur

### Naviguer dans les pages

- Les pages publiées sont accessibles à l'URL `/{slug}`
- Les pages enfants affichent un lien vers leur page parente
- Les pages parentes affichent des liens vers leurs pages enfantes

## Migration vers une base de données réelle

Le système est actuellement configuré pour fonctionner avec une base de données simulée en mémoire. Pour migrer vers une base de données MySQL réelle, suivez ces étapes :

### 1. Configuration de la base de données

Créez un fichier `.env` à la racine du projet avec les informations de connexion :

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smi_corporation
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_DIALECT=mysql
```

### 2. Création de la base de données

Créez une base de données MySQL vide :

```sql
CREATE DATABASE smi_corporation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Synchronisation et importation des données

Utilisez le script utilitaire pour synchroniser la base de données et importer les données d'exemple :

```bash
# Installer les dépendances si nécessaire
npm install dotenv

# Synchroniser la base de données (crée les tables)
node server/utils/db-setup.js sync

# Importer les données d'exemple
node server/utils/db-setup.js import pages-sample-data.sql

# Ou en une seule commande
node server/utils/db-setup.js full-setup
```

### 4. Vérification

Vérifiez que la connexion est établie en redémarrant l'application :

```bash
npm run dev
```

L'application devrait maintenant utiliser la base de données MySQL réelle au lieu de la simulation en mémoire.

## Dépannage

### Problèmes de connexion à la base de données

Si vous rencontrez des problèmes de connexion :

1. Vérifiez que MySQL est en cours d'exécution
2. Vérifiez les informations de connexion dans le fichier `.env`
3. Assurez-vous que l'utilisateur a les permissions nécessaires

### Erreurs lors de la synchronisation

Si vous obtenez des erreurs lors de la synchronisation :

1. Essayez avec l'option `force` pour recréer les tables :
   ```bash
   node server/utils/db-setup.js sync force
   ```
2. Vérifiez les logs d'erreur pour plus de détails

## Améliorations futures

Voici quelques améliorations qui pourraient être ajoutées au système :

- **SEO** : Métadonnées personnalisables pour chaque page
- **Versionnage** : Historique des modifications et restauration
- **Templates** : Support de différents modèles de mise en page
- **Média enrichi** : Intégration de vidéos, galeries et autres médias
- **Cache** : Mise en cache des pages pour améliorer les performances