# 🛠️ Guide d'Implémentation - Documentation API

Ce guide explique comment intégrer et utiliser la documentation API dans votre projet SMI Corporation CMS.

## 📚 Structure de la Documentation

```
docs/api/
├── openapi.yaml              # Spécification OpenAPI 3.0.3 complète
├── README.md                 # Guide d'utilisation principal
├── swagger-ui.html           # Interface interactive Swagger UI
├── IMPLEMENTATION.md         # Ce guide d'implémentation
└── clients/                  # Clients générés automatiquement
    ├── javascript-client.js  # Client JavaScript/Node.js
    ├── python-client.py      # Client Python
    ├── types.ts              # Types TypeScript
    └── examples.md           # Exemples d'utilisation
```

## 🚀 Installation et Configuration

### 1. Dépendances Requises

Ajoutez les dépendances de documentation dans votre `package.json` :

```json
{
  "devDependencies": {
    "yaml": "^2.3.4",
    "http-server": "^14.1.1",
    "swagger-parser": "^10.0.3"
  },
  "scripts": {
    "docs:generate": "node scripts/generate-api-client.js",
    "docs:serve": "npx http-server docs/api -p 3001 -o swagger-ui.html",
    "docs:validate": "npx swagger-parser validate docs/api/openapi.yaml"
  }
}
```

### 2. Installation

```bash
# Installation des dépendances
npm install --save-dev yaml http-server swagger-parser

# Validation de la spécification
npm run docs:validate

# Génération des clients (optionnel)
npm run docs:generate

# Serveur de documentation local
npm run docs:serve
```

## 🔧 Intégration dans l'Application

### 1. Endpoint de Documentation

Le fichier `server/api/docs.get.js` expose la spécification OpenAPI :

```javascript
// Accessible à : GET /api/docs
// Format JSON par défaut
// Format YAML avec ?format=yaml
```

### 2. Interface Swagger UI

L'interface interactive est disponible dans `docs/api/swagger-ui.html` :

- **Interface complète** avec tous les endpoints
- **Test interactif** des API
- **Gestion d'environnement** (dev/prod)
- **Authentification intégrée**

### 3. Configuration Nuxt

Ajoutez la route de documentation dans votre configuration Nuxt :

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    publicAssets: [
      {
        baseURL: '/docs',
        dir: 'docs/api',
        maxAge: 60 * 60 * 24 * 7 // 7 jours
      }
    ]
  }
})
```

## 📖 Utilisation de la Documentation

### 1. Accès Local

```bash
# Démarrer le serveur de développement
npm run dev

# Accéder à la documentation
open http://localhost:3000/docs/swagger-ui.html
```

### 2. Validation Continue

```bash
# Valider après modifications
npm run docs:validate

# Génération automatique des clients
npm run docs:generate
```

### 3. Tests des Endpoints

L'interface Swagger UI permet de :

- **Tester tous les endpoints** directement
- **Gérer l'authentification** avec le bouton "Authorize"
- **Voir les réponses en temps réel**
- **Copier les exemples cURL**

## 🔐 Configuration de Sécurité

### 1. Authentification dans Swagger UI

```javascript
// Configuration automatique du cookie auth
SwaggerUIBundle({
  // ... autres options
  onComplete: () => {
    // Auto-configuration de l'auth si token présent
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    
    if (token) {
      console.log('🔑 Token détecté - authentification automatique');
    }
  }
});
```

### 2. Headers de Sécurité

La documentation est servie avec les headers appropriés :

```javascript
// server/api/docs.get.js
setHeaders(event, {
  'Cache-Control': 'public, max-age=3600',
  'X-Content-Type-Options': 'nosniff'
});
```

## 🎯 Personnalisation

### 1. Modification du Style

Editez `docs/api/swagger-ui.html` pour personnaliser :

```css
.swagger-ui .topbar {
  background-color: #2c3e50; /* Couleur de marque */
}

.api-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 2. Ajout d'Endpoints

Modifiez `docs/api/openapi.yaml` :

```yaml
paths:
  /api/mon-nouvel-endpoint:
    get:
      tags:
        - MonModule
      summary: Description courte
      description: Description détaillée
      responses:
        '200':
          description: Réponse réussie
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MonSchema'
```

### 3. Génération Automatique

Le script `scripts/generate-api-client.js` peut être étendu :

```javascript
// Ajouter d'autres langages
function generateRustClient(spec) {
  // Implémentation client Rust
}

function generateGoClient(spec) {
  // Implémentation client Go
}
```

## 🚀 Déploiement

### 1. Production

```bash
# Build de la documentation
npm run build

# Les fichiers statiques sont dans .output/public/docs/
```

### 2. CI/CD

Ajoutez dans votre pipeline :

```yaml
# .github/workflows/docs.yml
name: Documentation
on: [push, pull_request]

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run docs:validate
      - run: npm run docs:generate
```

### 3. Versioning

```yaml
# docs/api/openapi.yaml
info:
  version: "1.0.0" # Incrémentez à chaque changement breaking
  title: SMI Corporation CMS API
```

## 📊 Monitoring et Analytics

### 1. Métriques d'Usage

```javascript
// Tracking des accès à la documentation
SwaggerUIBundle({
  onComplete: () => {
    // Analytics
    gtag('event', 'docs_loaded', {
      event_category: 'API Documentation',
      event_label: 'Swagger UI'
    });
  }
});
```

### 2. Feedback Utilisateur

Ajoutez un système de feedback :

```html
<!-- Dans swagger-ui.html -->
<div class="feedback-section">
  <h4>💬 Feedback sur la Documentation</h4>
  <a href="https://github.com/smi-corporation/cms/issues" target="_blank">
    Signaler un problème
  </a>
</div>
```

## 🔄 Maintenance

### 1. Mise à Jour Régulière

- **Synchroniser** avec les changements d'API
- **Valider** après chaque modification
- **Tester** les exemples fournis
- **Mettre à jour** les clients générés

### 2. Checklist de Release

- [ ] Spécification OpenAPI validée
- [ ] Tous les endpoints documentés
- [ ] Exemples fonctionnels testés
- [ ] Clients générés mis à jour
- [ ] Interface Swagger UI testée
- [ ] Documentation README à jour

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur de validation OpenAPI**
   ```bash
   npm run docs:validate
   # Vérifiez la syntaxe YAML
   ```

2. **Swagger UI ne charge pas**
   ```bash
   # Vérifiez les CORS
   # Vérifiez le serveur API
   ```

3. **Authentification ne fonctionne pas**
   ```bash
   # Vérifiez les cookies
   # Vérifiez la configuration CSRF
   ```

### Support

- **Documentation** : `docs/api/README.md`
- **Issues** : Créez une issue sur le dépôt
- **Email** : dev@smi-corporation.com

---

## ✅ Validation Finale

Pour vérifier que tout fonctionne :

1. `npm run docs:validate` ✅
2. `npm run docs:serve` ✅
3. Ouvrir `http://localhost:3001/swagger-ui.html` ✅
4. Tester l'authentification ✅
5. Tester un endpoint ✅

La documentation API de votre CMS SMI Corporation est maintenant prête ! 🎉