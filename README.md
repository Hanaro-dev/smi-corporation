# SMI Corporation CMS

Un système de gestion de contenu moderne et complet construit avec Nuxt.js, offrant une authentification robuste, une gestion des rôles et des permissions, un système de pages dynamiques et un éditeur BBCode avancé.

## 📚 Documentation

Pour une documentation complète, consultez le dossier [`docs/`](./docs/README.md) qui contient :
- Architecture et fonctionnement
- Guides d'implémentation
- Analyses techniques
- Plans de développement

## ✨ Fonctionnalités Principales

### 🔐 Authentification & Sécurité
- **Système d'authentification JWT** avec sessions sécurisées
- **Gestion des rôles et permissions** (RBAC) granulaire
- **Protection CSRF** complète avec tokens automatiques
- **Validation et sanitisation** de toutes les entrées utilisateur
- **Hashage bcrypt** des mots de passe avec salt

### 📝 Gestion de Contenu Avancée
- **Éditeur BBCode personnalisé** avec aperçu temps réel
- **Tags BBCode étendus** : organigrammes, galeries, colonnes, callouts
- **Éditeur TipTap classique** pour le contenu simple
- **Système de pages hiérarchiques** avec arborescence
- **Gestion des médias** avec upload et édition d'images

### 🎨 Interface Administration
- **Dashboard moderne** avec statistiques en temps réel
- **Interface responsive** avec support du thème sombre
- **Gestion des utilisateurs** avec formulaires modaux
- **Système de notifications** toast personnalisé
- **Navigation intuitive** avec sidebar collapsible

### 🛠️ Système BBCode

#### Tags Disponibles
- `[orgchart id="1"]` - Organigrammes interactifs
- `[columns=3]contenu[/columns]` - Layouts en colonnes
- `[callout type="warning"]texte[/callout]` - Encadrés d'information
- `[gallery ids="1,2,3"]` - Galeries d'images responsives
- `[userinfo field="name"]` - Données utilisateur dynamiques
- `[breadcrumb]` - Fil d'ariane automatique

#### Fonctionnalités BBCode
- **Validation en temps réel** avec affichage des erreurs
- **Permissions par type de page** (admin, public, restricted)
- **Aide contextuelle** intégrée avec exemples
- **Rendu sécurisé** avec DOMPurify
- **Mode hybride** : détection automatique du format de contenu

## 🚀 Démarrage Rapide

### Configuration Initiale

1. **Cloner le projet**
```bash
git clone [repository-url]
cd smi-corporation
```

2. **Installer les dépendances**

Make sure to install dependencies:

```bash
npm install
# ou
pnpm install
# ou
yarn install
```

3. **Configuration de l'environnement**
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables (optionnel pour le développement)
# USE_MOCK_DB=true (base de données fictive)
# DATABASE_URL=... (pour une vraie base de données)
```

### Développement

**Démarrer le serveur de développement** sur `http://localhost:3000` :

```bash
npm run dev
```

**Accès à l'administration** : 
- URL : `http://localhost:3000/admin`
- Connexion avec les comptes de test (mode mock)

**Commandes utiles** :
```bash
npm run lint          # Vérification du code
npm run lint:fix      # Correction automatique
npm run commit        # Commit avec Commitizen
```

### Production

**Construire l'application** :
```bash
npm run build
```

**Prévisualiser la version de production** :
```bash
npm run preview
```

**Configuration pour la production** :
- Configurer `USE_MOCK_DB=false` dans `.env`
- Définir `DATABASE_URL` pour votre base de données
- Configurer les variables JWT et CSRF
- Activer la protection CSRF en production

## 🛡️ Sécurité

Le projet intègre des mesures de sécurité robustes :
- ✅ **Protection CSRF** avec tokens automatiques ([docs/CSRF_IMPLEMENTATION.md](./docs/CSRF_IMPLEMENTATION.md))
- ✅ **Authentification JWT** sécurisée avec sessions
- ✅ **RBAC** - Contrôle d'accès basé sur les rôles
- ✅ **Sanitisation XSS** avec DOMPurify pour le contenu BBCode
- ✅ **Validation stricte** des entrées (Yup + Zod)
- ✅ **Hashage bcrypt** des mots de passe avec salt
- ✅ **API sécurisée** avec middleware de validation
- ✅ **Upload sécurisé** avec validation des types de fichiers

## 🏗️ Architecture Technique

### Stack Frontend
- **Framework** : Nuxt.js 3.17.4 (Vue.js 3.5.16)
- **UI** : @nuxt/ui 3.1.3 + Tailwind CSS
- **État** : Pinia 3.0.2 + composables Vue
- **Éditeurs** : TipTap 2.14.0 + BBCode personnalisé
- **Validation** : Vee-Validate 4.15.1 + Yup + Zod

### Stack Backend
- **Runtime** : Nuxt Server API (Nitro)
- **ORM** : Sequelize 6.37.7
- **Base de données** : MySQL2/SQLite3 + système mock
- **Authentification** : JWT + nuxt-auth-utils 0.5.20
- **Sécurité** : bcryptjs, CSRF, DOMPurify, Sharp

### Outils de Développement
- **TypeScript** : Support complet avec typage
- **ESLint** : Configuration Nuxt + règles personnalisées
- **Commitizen** : Commits conventionnels avec cz-customizable
- **Husky** : Hooks pre-commit pour la qualité du code

## 📁 Structure du Projet

```
smi-corporation/
├── app/                          # Application Nuxt (frontend)
│   ├── components/               # Composants Vue
│   │   ├── BBCodeEditor.vue      # Éditeur BBCode avancé
│   │   ├── BBCodeRenderer.vue    # Rendu BBCode sécurisé
│   │   ├── images/               # Gestion des médias
│   │   └── ui/                   # Composants UI (Toast, etc.)
│   ├── composables/              # Logique réutilisable
│   │   ├── useBBCode.js          # Système BBCode personnalisé
│   │   ├── useApi.js             # API avec gestion CSRF
│   │   └── useToast.js           # Notifications toast
│   ├── layouts/                  # Layouts (default, admin)
│   ├── pages/                    # Pages de l'application
│   │   ├── admin/                # Interface d'administration
│   │   └── auth/                 # Pages d'authentification
│   ├── middleware/               # Middleware de routes
│   └── stores/                   # Stores Pinia
├── server/                       # Backend API
│   ├── api/                      # Endpoints API
│   │   ├── auth/                 # Authentification
│   │   ├── pages/                # Gestion des pages
│   │   ├── users/                # Gestion des utilisateurs
│   │   └── images/               # Gestion des médias
│   ├── models.js                 # Modèles Sequelize + Mock
│   ├── database.js               # Configuration BDD
│   └── utils/                    # Utilitaires serveur
├── docs/                         # Documentation complète
├── public/                       # Fichiers statiques
├── CLAUDE.md                     # Instructions pour Claude AI
├── nuxt.config.ts                # Configuration Nuxt
└── package.json                  # Dépendances et scripts
```

## 🔧 Configuration Avancée

### Mode Base de Données

**Mode Mock (développement)** :
```env
USE_MOCK_DB=true
```
- Données de test prêtes à l'emploi
- Comptes utilisateur pré-configurés
- Pas besoin de base de données externe

**Mode Production** :
```env
USE_MOCK_DB=false
DATABASE_URL=mysql://user:password@localhost:3306/smi_corp
```

### Système BBCode

**Configuration des permissions** :
- `admin` : Tous les tags BBCode
- `default` : Tags de base (orgchart, columns, callout, gallery)
- `public` : Tags sécurisés (columns, callout, gallery)
- `restricted` : Tags sensibles (userinfo, breadcrumb)

**Personnalisation** :
- Modifier `app/composables/useBBCode.js` pour ajouter des tags
- Configurer les permissions dans `getAvailableBBCodes()`
- Ajouter des composants de rendu dans `BBCodeRenderer.vue`

## 📖 Documentation

Pour une documentation technique complète :
- **[Documentation principale](./docs/README.md)** - Architecture et guides
- **[Implémentation CSRF](./docs/CSRF_IMPLEMENTATION.md)** - Sécurité
- **[Instructions Claude](./CLAUDE.md)** - Configuration du projet

## 🤝 Contribution

1. **Standards de code** : ESLint + Prettier
2. **Commits** : Utiliser `npm run commit` (Commitizen)
3. **Tests** : Valider avec `npm run lint`
4. **Documentation** : Maintenir les commentaires à jour

## 📝 Changelog

### Version 2.0.0 (Actuelle)
- ✅ Système BBCode complet avec éditeur avancé
- ✅ Interface d'administration modernisée
- ✅ Gestion des médias améliorée
- ✅ Système de notifications toast
- ✅ Support du thème sombre
- ✅ Documentation complète du code

---

**SMI Corporation CMS** - Système de gestion de contenu professionnel avec BBCode avancé
