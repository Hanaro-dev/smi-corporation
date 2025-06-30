# 📚 Documentation SMI Corporation CMS

Bienvenue dans la documentation du système de gestion de contenu SMI Corporation.

## 📖 Table des Matières

### 🏗️ Architecture & Fonctionnement
- [**Architecture et Fonctionnement**](./architecture-et-fonctionnement.md) - Vue d'ensemble de l'architecture système
- [**CSRF Implementation**](./CSRF_IMPLEMENTATION.md) - Implémentation de la protection CSRF

### 📄 Gestion des Pages
- [**Pages README**](./PAGES-README.md) - Documentation du système de pages
- [**Plan Gestion Pages**](./plan-gestion-pages.md) - Planification de la gestion des pages

### 👥 Gestion des Utilisateurs
- [**Analyse Gestion Utilisateurs**](./analyse-gestion-utilisateurs.md) - Analyse du système de gestion utilisateurs
- [**Plan Gestion Organigramme**](./plan-gestion-organigramme.md) - Planification de l'organigramme

### 🖼️ Gestion des Médias
- [**Analyse Gestion Médias**](./analyse-gestion-medias.md) - Analyse du système de gestion des médias

## 🚀 Démarrage Rapide

Pour commencer avec le projet :

1. **Installation** : `npm install`
2. **Développement** : `npm run dev`
3. **Build** : `npm run build`
4. **Lint** : `npm run lint`

## 🛡️ Sécurité

Le projet implémente plusieurs mesures de sécurité :
- Protection CSRF
- Authentification JWT
- Validation des entrées
- Gestion des permissions RBAC
- Rate limiting

## 📁 Structure du Projet

```
docs/
├── README.md                           # Ce fichier
├── CSRF_IMPLEMENTATION.md              # Protection CSRF
├── architecture-et-fonctionnement.md   # Architecture
├── PAGES-README.md                     # Système de pages
├── analyse-gestion-utilisateurs.md     # Gestion utilisateurs
├── analyse-gestion-medias.md           # Gestion médias
├── plan-gestion-pages.md               # Planification pages
└── plan-gestion-organigramme.md        # Planification organigramme
```

## 🔧 Technologies Utilisées

- **Frontend** : Nuxt.js 3, Vue.js 3, Tailwind CSS
- **Backend** : Nuxt Server API (Nitro), Sequelize ORM
- **Base de données** : MySQL/SQLite avec support mock
- **Sécurité** : nuxt-csurf, JWT, bcrypt
- **Outils** : ESLint, Commitizen, TypeScript

## 📞 Support

Pour toute question ou problème, consultez :
1. Cette documentation
2. Les fichiers d'analyse spécifiques
3. Le fichier `CLAUDE.md` pour les instructions projet

---
*Dernière mise à jour : $(date '+%Y-%m-%d')*