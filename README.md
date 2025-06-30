# SMI Corporation CMS

Un système de gestion de contenu moderne construit avec Nuxt.js, offrant une authentification robuste, une gestion des rôles et des permissions, et un système de pages dynamiques.

## 📚 Documentation

Pour une documentation complète, consultez le dossier [`docs/`](./docs/README.md) qui contient :
- Architecture et fonctionnement
- Guides d'implémentation
- Analyses techniques
- Plans de développement

## 🚀 Démarrage Rapide

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## 🛡️ Sécurité

Le projet inclut des mesures de sécurité avancées :
- ✅ **Protection CSRF** activée (voir [`docs/CSRF_IMPLEMENTATION.md`](./docs/CSRF_IMPLEMENTATION.md))
- ✅ **Authentification JWT** avec sessions sécurisées
- ✅ **Gestion des rôles et permissions** (RBAC)
- ✅ **Validation des entrées** et sanitisation
- ✅ **Rate limiting** anti-DDoS
- ✅ **Hashage bcrypt** des mots de passe

## 🏗️ Architecture

- **Frontend** : Nuxt.js 3 + Vue.js 3 + Tailwind CSS
- **Backend** : Nuxt Server API (Nitro) + Sequelize ORM  
- **Base de données** : MySQL/SQLite avec mode mock pour le développement
- **Sécurité** : nuxt-csurf, JWT, bcrypt, DOMPurify
- **Outils** : ESLint, TypeScript, Commitizen

## 📁 Structure du Projet

```
├── app/                 # Application Nuxt (frontend)
├── server/             # API backend et services
├── docs/               # Documentation complète
├── public/             # Fichiers statiques
└── package.json        # Dépendances et scripts
```

Pour plus de détails, consultez la [documentation complète](./docs/README.md).

---

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
