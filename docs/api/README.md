# 📖 Documentation API - SMI Corporation CMS

Bienvenue dans la documentation complète de l'API du système de gestion de contenu SMI Corporation.

## 🚀 Démarrage Rapide

### Authentification

L'API utilise une authentification JWT avec des cookies httpOnly sécurisés.

```bash
# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smi-corporation.com",
    "password": "MotDePasseSecurise123!"
  }' \
  -c cookies.txt

# Utilisation avec le cookie
curl -X GET http://localhost:3000/api/users \
  -b cookies.txt
```

### Endpoints Principaux

| Ressource | Endpoint | Description |
|-----------|----------|-------------|
| **Auth** | `/api/auth/*` | Authentification et session |
| **Users** | `/api/users` | Gestion des utilisateurs |
| **Pages** | `/api/pages` | Gestion du contenu |
| **Images** | `/api/images` | Gestion des médias |
| **Roles** | `/api/roles` | Gestion des rôles |
| **Permissions** | `/api/permissions` | Gestion des permissions |
| **Audit** | `/api/audit/logs` | Journalisation |

## 📚 Documentation Interactive

### Option 1: Swagger UI (Recommandé)

Installez et lancez Swagger UI pour une documentation interactive :

```bash
# Installation des dépendances de documentation
npm install --save-dev swagger-ui-express @apidevtools/swagger-parser

# Lancement du serveur de documentation
npm run docs:serve
```

Accédez à : `http://localhost:3001/api-docs`

### Option 2: Redoc

Alternative élégante avec Redoc :

```bash
# Installation de Redoc
npm install --save-dev redoc-cli

# Génération de la documentation statique
npx redoc-cli build docs/api/openapi.yaml --output docs/api/redoc.html

# Ouverture dans le navigateur
open docs/api/redoc.html
```

### Option 3: VS Code

Utilisez l'extension "OpenAPI (Swagger) Editor" pour éditer et prévisualiser :

1. Installez l'extension OpenAPI (Swagger) Editor
2. Ouvrez `docs/api/openapi.yaml`
3. Utilisez `Ctrl+Shift+P` → "OpenAPI: Preview"

## 🔧 Exemples d'Utilisation

### JavaScript/Node.js

```javascript
// Classe client API
class SMIApi {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.cookies = '';
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (response.ok) {
      this.cookies = response.headers.get('set-cookie');
      return await response.json();
    }
    throw new Error('Login failed');
  }

  async getPages(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseURL}/pages?${params}`, {
      credentials: 'include'
    });
    return await response.json();
  }

  async createPage(pageData) {
    const response = await fetch(`${this.baseURL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageData),
      credentials: 'include'
    });
    return await response.json();
  }
}

// Utilisation
const api = new SMIApi();
await api.login('admin@smi-corporation.com', 'password');
const pages = await api.getPages({ status: 'published' });
```

### Python

```python
import requests

class SMIApi:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, email, password):
        response = self.session.post(f'{self.base_url}/auth/login', json={
            'email': email,
            'password': password
        })
        response.raise_for_status()
        return response.json()
    
    def get_pages(self, **params):
        response = self.session.get(f'{self.base_url}/pages', params=params)
        response.raise_for_status()
        return response.json()
    
    def create_page(self, page_data):
        response = self.session.post(f'{self.base_url}/pages', json=page_data)
        response.raise_for_status()
        return response.json()

# Utilisation
api = SMIApi()
api.login('admin@smi-corporation.com', 'password')
pages = api.get_pages(status='published')
```

### cURL

```bash
#!/bin/bash

# Configuration
API_BASE="http://localhost:3000/api"
COOKIE_JAR="cookies.txt"

# Fonction de connexion
login() {
    curl -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@smi-corporation.com","password":"password"}' \
        -c "$COOKIE_JAR" \
        -s
}

# Fonction pour récupérer les pages
get_pages() {
    curl -X GET "$API_BASE/pages?status=published" \
        -b "$COOKIE_JAR" \
        -s | jq '.'
}

# Fonction pour créer une page
create_page() {
    curl -X POST "$API_BASE/pages" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Nouvelle page",
            "content": "<p>Contenu de la page</p>",
            "status": "draft"
        }' \
        -b "$COOKIE_JAR" \
        -s | jq '.'
}

# Exécution
login
get_pages
create_page
```

## 🔒 Sécurité

### Authentification

- **JWT Tokens** : Stockés dans des cookies httpOnly sécurisés
- **CSRF Protection** : Protection CSRF activée pour toutes les routes de modification
- **Rate Limiting** : Limitation du taux de requêtes par IP
- **HTTPS Only** : Obligatoire en production

### Autorisations

Système de permissions granulaire :

```
admin -> Accès complet
├── manage_users     # Gestion des utilisateurs
├── manage_roles     # Gestion des rôles
├── manage_pages     # Gestion des pages
└── view             # Lecture seule

editor -> Édition de contenu
├── edit             # Modification des pages
└── view             # Lecture seule

user -> Lecture seule
└── view             # Lecture seule
```

### Headers de Sécurité

L'API ajoute automatiquement les headers de sécurité :

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## 📊 Codes d'État HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| `200` | OK | Requête réussie |
| `201` | Created | Ressource créée |
| `400` | Bad Request | Données invalides |
| `401` | Unauthorized | Non authentifié |
| `403` | Forbidden | Permissions insuffisantes |
| `404` | Not Found | Ressource non trouvée |
| `409` | Conflict | Conflit (ex: email déjà utilisé) |
| `429` | Too Many Requests | Trop de requêtes |
| `500` | Internal Server Error | Erreur serveur |

## 🔄 Gestion des Erreurs

Format de réponse d'erreur standardisé :

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Données invalides",
  "details": {
    "field": "email",
    "error": "Format d'email invalide"
  },
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

### Gestion d'Erreur côté Client

```javascript
async function handleApiCall(apiFunction) {
  try {
    const result = await apiFunction();
    return result;
  } catch (error) {
    if (error.status === 401) {
      // Rediriger vers la page de connexion
      window.location.href = '/auth/login';
    } else if (error.status === 403) {
      // Afficher message de permissions insuffisantes
      showError('Vous n\'avez pas les permissions nécessaires');
    } else if (error.status >= 500) {
      // Erreur serveur
      showError('Erreur serveur, veuillez réessayer plus tard');
    } else {
      // Autres erreurs
      showError(error.message || 'Une erreur est survenue');
    }
  }
}
```

## 🎯 Bonnes Pratiques

### Pagination

Toujours utiliser la pagination pour les listes :

```javascript
// ✅ Bon
const pages = await api.getPages({ page: 1, limit: 20 });

// ❌ Éviter - peut récupérer trop de données
const allPages = await api.getPages();
```

### Gestion du Cache

Utilisez les headers de cache appropriés :

```javascript
// Pour les données fréquemment mises à jour
fetch(url, {
  headers: {
    'Cache-Control': 'no-cache'
  }
});

// Pour les données statiques
fetch(url, {
  headers: {
    'Cache-Control': 'max-age=3600'
  }
});
```

### Optimisation des Requêtes

```javascript
// ✅ Récupérer seulement les champs nécessaires
const pages = await api.getPages({ 
  fields: 'id,title,slug,status',
  status: 'published' 
});

// ✅ Utiliser le filtrage côté serveur
const userPages = await api.getPages({ userId: 123 });

// ❌ Éviter le filtrage côté client
const allPages = await api.getPages();
const userPages = allPages.filter(page => page.userId === 123);
```

## 🛠️ Outils de Développement

### Postman Collection

Importez la collection Postman pour tester l'API :

```bash
# Génération de la collection Postman
npx openapi-to-postman -s docs/api/openapi.yaml -o docs/api/postman-collection.json
```

### Tests Automatisés

```javascript
// Exemple de test avec Jest
describe('Pages API', () => {
  test('should create a new page', async () => {
    const pageData = {
      title: 'Test Page',
      content: '<p>Test content</p>',
      status: 'draft'
    };
    
    const response = await api.createPage(pageData);
    
    expect(response.success).toBe(true);
    expect(response.data.title).toBe(pageData.title);
  });
});
```

### Validation des Schémas

```javascript
// Validation côté client avec Ajv
import Ajv from 'ajv';
import schema from './openapi.yaml';

const ajv = new Ajv();
const validate = ajv.compile(schema.components.schemas.CreatePageRequest);

function validatePageData(data) {
  const valid = validate(data);
  if (!valid) {
    throw new Error(`Données invalides: ${ajv.errorsText(validate.errors)}`);
  }
  return true;
}
```

## 📞 Support

- **Documentation** : Ce fichier et la spécification OpenAPI
- **Issues** : Créez une issue sur le dépôt Git pour les bugs
- **Discussions** : Utilisez les discussions du dépôt pour les questions
- **Email** : dev@smi-corporation.com pour les questions urgentes

## 📝 Changelog

### Version 1.0.0 (2025-01-02)
- Documentation API complète avec OpenAPI 3.0.3
- Endpoints pour tous les modules (Auth, Users, Pages, Images, Roles, Permissions, Audit)
- Exemples d'utilisation en JavaScript, Python et cURL
- Guide de sécurité et bonnes pratiques