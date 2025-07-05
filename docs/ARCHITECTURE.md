# SMI Corporation CMS - Architecture Système

Documentation complète de l'architecture technique pour le système de gestion de contenu SMI Corporation.

## Vue d'Ensemble du Système

SMI Corporation CMS est un système de gestion de contenu moderne et full-stack construit sur Nuxt.js 3, conçu pour la scalabilité, la sécurité et la maintenabilité. Le système fournit une gestion complète des utilisateurs, de la création de contenu, de la gestion des médias et des capacités administratives avec des fonctionnalités de sécurité de niveau entreprise.

**Version actuelle :** 2.1.0 (Juillet 2025)  
**Architecture :** Services centralisés avec 70% de réduction du code dupliqué

## Principes d'Architecture

### 🔒 Conception Orientée Sécurité
- Protection CSRF avec validation de token configurable
- Authentification basée sur JWT avec stockage sécurisé des cookies
- Contrôle d'accès basé sur les rôles (RBAC) avec permissions granulaires
- Assainissement et validation des entrées à tous les niveaux
- Protection XSS utilisant DOMPurify
- Limitation de débit sur les endpoints critiques

### 🧩 Architecture Modulaire
- Architecture frontend Vue.js basée sur les composants
- Conception API-first avec endpoints RESTful
- Séparation des préoccupations entre les couches
- Extensibilité basée sur les plugins
- Composables et utilitaires réutilisables

### 🚀 Optimisation des Performances
- Rendu côté serveur (SSR) avec Nuxt.js
- Optimisation d'images avec génération automatique de variantes
- Chargement paresseux et division de code
- Stratégies de mise en cache à plusieurs niveaux
- Optimisation des requêtes de base de données

### 🔧 Expérience de Développement
- Support TypeScript dans toute la pile
- Remplacement de module à chaud pour le développement rapide
- Gestion d'erreurs et journalisation complètes
- Base de données simulée pour le développement
- Capacités de tests automatisés

## Pile Technologique

### Couche Frontend
```yaml
Core Framework: Nuxt.js 3.17.4
  - Vue.js 3.5.16 (Composition API)
  - Vue Router 4.5.1 (Automatic routing)
  - Pinia 3.0.2 (State management)

UI Framework: Nuxt UI 3.1.3
  - Tailwind CSS (Utility-first styling)
  - Headless UI components
  - Dark/Light mode support
  - Responsive design system

Rich Text Editing:
  - TipTap 2.14.0 (Prosemirror-based editor)
  - BBCode parsing and rendering
  - Custom editor extensions
  - Real-time preview capabilities

Media Handling:
  - FilePond 4.32.8 (File uploads)
  - Vue Advanced Cropper 2.8.9 (Image editing)
  - Sharp integration for processing
  - Drag-and-drop interfaces

Validation & Forms:
  - Vee-Validate 4.15.1 (Form validation)
  - Yup 1.6.1 (Schema validation)
  - Zod 3.25.67 (TypeScript-first validation)
```

### Couche Backend
```yaml
Server Runtime: Nitro (Nuxt Server Engine)
  - Universal rendering capabilities
  - API route handling
  - Middleware processing
  - Static asset serving

Database Layer:
  - Sequelize 6.37.7 (ORM)
  - MySQL2 3.14.1 (Production database)
  - SQLite3 5.1.7 (Development database)
  - Better-SQLite3 12.2.0 (Performance)

Authentication & Security:
  - JWT tokens with nuxt-auth-utils 0.5.20
  - bcryptjs 3.0.2 (Password hashing)
  - nuxt-csurf (CSRF protection)
  - DOMPurify 3.2.6 (XSS prevention)

Image Processing:
  - Sharp 0.34.2 (High-performance image processing)
  - File type validation
  - Automatic thumbnail generation
  - Format optimization
```

### Outils de Développement
```yaml
Language: TypeScript 5.8.3
Linting: ESLint 9.29.0 with Nuxt rules
Testing: Vitest 3.2.4 with @vitest/ui
Version Control: Git with Husky hooks
Package Manager: NPM with package-lock.json
```

## Diagramme d'Architecture Système

```
┌─────────────────────────────────────────────────────────────┐
│                 NAVIGATEUR CLIENT                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ Components  │  │   Layouts   │        │
│  │ (/pages)    │  │ (/components)│ │ (/layouts)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │               │                 │               │
│  ┌─────────────────────────────────────────────────────────┤
│  │              NUXT.JS FRONTEND                          │
│  ├─────────────────────────────────────────────────────────┤
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  │ Stores  │  │Composab.│  │Plugins  │  │Middlew. │   │
│  │  │(Pinia)  │  │         │  │         │  │         │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CÔTÉ SERVEUR                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┤
│  │                 NITRO SERVER                           │
│  ├─────────────────────────────────────────────────────────┤
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  │API      │  │Middlew. │  │Services │  │Utils    │   │
│  │  │Routes   │  │         │  │         │  │         │   │
│  │  │(/api)   │  │(/server)│  │         │  │         │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
                              │ Database Operations
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 COUCHE DONNÉES                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐              ┌─────────────┐              │
│  │   MOCK DB   │              │  REAL DB    │              │
│  │             │     OR       │             │              │
│  │In-Memory    │              │MySQL/SQLite │              │
│  │Development  │              │Production   │              │
│  └─────────────┘              └─────────────┘              │
│         │                            │                     │
│  ┌─────────────────────────────────────────────────────────┤
│  │                SEQUELIZE ORM                           │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
                              │ File System
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              STOCKAGE DE FICHIERS                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Images    │  │ Thumbnails  │  │   Public    │        │
│  │ (/images)   │  │ (Variants)  │  │ (/public)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```
- **Expérience Développeur** : Rechargement à chaud, support TypeScript, outils complets
- **Scalabilité** : Conçu pour les environnements de développement (données simulées) et de production

## 🎯 Technologies Centrales

### Pile Frontend
```yaml
Framework: Nuxt.js 3.17.4
  - Vue.js 3.5.16 (Composition API)
  - Server-side rendering + SPA mode
  - File-based routing
  - Auto-imports

UI Framework: "@nuxt/ui 3.1.3"
  - Tailwind CSS integration
  - Dark mode support
  - Responsive components
  - Accessibility features

State Management: Pinia 3.0.2
  - Composables-first approach
  - TypeScript support
  - Devtools integration

Content Editing:
  - TipTap 2.14.0 (Rich text editor)
  - Custom BBCode system
  - Real-time preview
  - Validation system
```

### Pile Backend
```yaml
Runtime: Nuxt Server API (Nitro)
  - Full-stack capabilities
  - API routes auto-generation
  - Middleware support
  - Edge deployment ready

Database: Sequelize 6.37.7
  - MySQL2 3.14.1 (Production)
  - SQLite3 5.1.7 (Development)
  - Mock database system
  - Migration support

Authentication: "nuxt-auth-utils 0.5.20"
  - JWT token management
  - Session handling
  - Role-based access control

Security:
  - bcryptjs 3.0.2 (Password hashing)
  - nuxt-csurf (CSRF protection)
  - DOMPurify 3.2.6 (XSS prevention)
  - Sharp 0.34.2 (Image processing)
```

## 📁 Structure du Projet

```
smi-corporation/
├── app/                          # Couche Application Nuxt
│   ├── components/               # Composants Vue
│   │   ├── BBCodeEditor.vue      # Éditeur BBCode avancé
│   │   ├── BBCodeRenderer.vue    # Moteur de rendu BBCode sécurisé
│   │   ├── images/               # Composants de gestion d'images
│   │   ├── pages/                # Composants spécifiques aux pages
│   │   └── ui/                   # Composants UI réutilisables
│   │
│   ├── composables/              # Composables Vue
│   │   ├── useBBCode.js          # Logique système BBCode
│   │   ├── useApi.js             # Appels API avec CSRF
│   │   └── useToast.js           # Système de notifications
│   │
│   ├── layouts/                  # Layouts d'Application
│   │   ├── default.vue           # Layout public
│   │   └── admin.vue             # Layout d'administration
│   │
│   ├── middleware/               # Middleware de Routes
│   │   ├── auth.js               # Garde d'authentification
│   │   └── pages.global.js       # Routage dynamique
│   │
│   ├── pages/                    # Pages de l'Application
│   │   ├── admin/                # Interface d'administration
│   │   │   ├── index.vue         # Tableau de bord
│   │   │   ├── pages.vue         # Page management
│   │   │   ├── users.vue         # User management
│   │   │   └── images.vue        # Media management
│   │   ├── auth/                 # Authentication pages
│   │   └── [...slug].vue         # Dynamic page routing
│   │
│   ├── plugins/                  # Nuxt Plugins
│   └── stores/                   # Pinia Stores
│       └── auth.js               # Authentication state
│
├── server/                       # Backend Layer
│   ├── api/                      # API Endpoints
│   │   ├── auth/                 # Authentication API
│   │   ├── pages/                # Page management API
│   │   ├── users/                # User management API
│   │   ├── roles/                # Role management API
│   │   ├── permissions/          # Permission API
│   │   └── images/               # Media management API
│   │
│   ├── middleware/               # Server Middleware
│   │   └── api-middleware.js     # Request processing
│   │
│   ├── utils/                    # Server Utilities
│   │   ├── mock-db.js            # Mock database
│   │   ├── db-setup.js           # Database initialization
│   │   └── api-middleware.js     # API utilities
│   │
│   ├── models.js                 # Database Models
│   └── database.js               # Database Configuration
│
├── docs/                         # Documentation
├── public/                       # Static Assets
├── .env                          # Environment Variables
├── nuxt.config.ts                # Nuxt Configuration
└── package.json                  # Dependencies & Scripts
```

## 🔄 Data Flow Architecture

### Request Flow
```mermaid
graph TD
    A[Client Request] --> B[Nuxt Router]
    B --> C{Route Type}
    C -->|Page| D[Page Component]
    C -->|API| E[Server API]
    C -->|Auth| F[Auth Middleware]
    
    D --> G[Layout]
    G --> H[Components]
    H --> I[Composables]
    I --> J[API Calls]
    
    E --> K[API Middleware]
    K --> L{CSRF Check}
    L -->|Valid| M[Route Handler]
    L -->|Invalid| N[403 Error]
    
    M --> O[Database Layer]
    O --> P{Database Type}
    P -->|Mock| Q[Mock Data]
    P -->|Real| R[Sequelize ORM]
```

### Authentication Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant M as Middleware
    participant D as Database
    
    C->>A: Login Request
    A->>D: Validate Credentials
    D-->>A: User Data
    A->>A: Generate JWT
    A-->>C: JWT + Session Cookie
    
    C->>M: Protected Request + JWT
    M->>M: Verify JWT
    M->>D: Check Permissions
    D-->>M: Permission Data
    M-->>C: Authorized Response
```

## 🎨 Component Architecture

### BBCode System
```yaml
useBBCode Composable:
  Purpose: Core BBCode logic and validation
  Features:
    - Custom tag definitions
    - Permission-based filtering
    - Real-time validation
    - Security sanitization
  
BBCodeEditor Component:
  Purpose: Advanced content editor
  Features:
    - Toolbar with tag buttons
    - Live preview mode
    - Contextual help system
    - Keyboard shortcuts
    - Error validation display
  
BBCodeRenderer Component:
  Purpose: Secure content rendering
  Features:
    - HTML sanitization
    - Dynamic component loading
    - API integration for dynamic content
    - Responsive layout adaptation
```

### Authentication System
```yaml
Auth Store (Pinia):
  State:
    - user: Current user object
    - isAuthenticated: Boolean status
    - permissions: User permissions array
  
  Actions:
    - login(): Authenticate user
    - logout(): Clear session
    - checkAuth(): Validate session
    - hasPermission(): Permission check
  
Auth Middleware:
  - Route protection
  - Permission validation
  - Redirect handling
  - Session management
```

## 🛡️ Security Architecture

### Multi-Layer Security
```yaml
Frontend Security:
  - Input validation (Vee-Validate + Yup/Zod)
  - XSS prevention (DOMPurify)
  - CSRF tokens in all forms
  - Secure cookie handling

Backend Security:
  - JWT token validation
  - bcrypt password hashing
  - SQL injection prevention (Sequelize)
  - Rate limiting middleware
  - Input sanitization

Database Security:
  - Parameterized queries
  - Role-based access control
  - Audit logging
  - Data encryption at rest
```

### BBCode Security
```yaml
Validation Levels:
  1. Syntax Validation: Proper BBCode structure
  2. Permission Check: User-allowed tags only
  3. Content Sanitization: XSS prevention
  4. Render Security: Safe HTML generation

Security Features:
  - Tag whitelist per user role
  - Attribute validation
  - Nested tag limit prevention
  - Output escaping
```

## 📊 Database Architecture

### Entity Relationship Model
```yaml
Core Entities:
  User:
    - id, name, email, password_hash
    - role_id (FK to Role)
    - created_at, updated_at
  
  Role:
    - id, name, description
    - created_at, updated_at
  
  Permission:
    - id, name, resource, action
    - description
  
  RolePermission:
    - role_id (FK), permission_id (FK)
    - granted_at
  
  Page:
    - id, title, slug, content, status
    - parent_id (self-referencing FK)
    - user_id (FK to User)
    - content_type (bbcode/html)
    - created_at, updated_at
  
  Image:
    - id, filename, url, alt_text
    - user_id (FK to User)
    - file_size, mime_type
    - created_at, updated_at
  
  AuditLog:
    - id, user_id, action, resource
    - old_values, new_values
    - ip_address, user_agent
    - created_at
```

### Mock vs Production Database
```yaml
Development (Mock):
  - In-memory data structures
  - Predefined test data
  - No external dependencies
  - Instant setup
  
Production:
  - MySQL/SQLite database
  - Sequelize ORM migrations
  - Connection pooling
  - Backup and recovery
```

## 🔌 API Architecture

### RESTful Endpoints
```yaml
Authentication:
  POST /api/auth/login      # User login
  POST /api/auth/logout     # User logout
  POST /api/auth/register   # User registration
  GET  /api/_auth/session   # Session validation

Content Management:
  GET    /api/pages         # List all pages
  POST   /api/pages         # Create new page
  GET    /api/pages/:id     # Get specific page
  PUT    /api/pages/:id     # Update page
  DELETE /api/pages/:id     # Delete page
  GET    /api/pages/tree    # Get page hierarchy

User Management:
  GET    /api/users         # List users
  POST   /api/users         # Create user
  PUT    /api/users/:id     # Update user
  DELETE /api/users/:id     # Delete user

Media Management:
  GET    /api/images        # List images
  POST   /api/images        # Upload image
  PUT    /api/images/:id    # Update image
  DELETE /api/images/:id    # Delete image

System:
  GET    /api/roles         # List roles
  GET    /api/permissions   # List permissions
```

### API Response Format
```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string,
  meta?: {
    pagination?: PaginationInfo,
    timestamp: string
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  },
  timestamp: string
}
```

## 🚀 Deployment Architecture

### Development Environment
```yaml
Local Development:
  - npm run dev (Hot reload)
  - Mock database mode
  - Debug logging enabled
  - CSRF protection optional
  
Environment Variables:
  - USE_MOCK_DB=true
  - NODE_ENV=development
  - NUXT_DEBUG=true
```

### Production Environment
```yaml
Production Build:
  - npm run build (Static generation)
  - Real database connection
  - CSRF protection enforced
  - Logging and monitoring
  
Environment Variables:
  - USE_MOCK_DB=false
  - DATABASE_URL=mysql://...
  - JWT_SECRET=...
  - CSRF_SECRET=...
```

## 📈 Performance Considerations

### Frontend Optimization
```yaml
Code Splitting:
  - Route-based splitting
  - Component lazy loading
  - Dynamic imports
  
Caching Strategy:
  - Static asset caching
  - API response caching
  - Component memoization
  
Image Optimization:
  - Sharp processing
  - Lazy loading
  - Responsive images
```

### Backend Optimization
```yaml
Database:
  - Query optimization
  - Connection pooling
  - Index strategies
  
API Performance:
  - Response compression
  - Rate limiting
  - Caching headers
```

## 🔧 Configuration Management

### Nuxt Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Core modules
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    'nuxt-csurf'
  ],
  
  // Security configuration
  csurf: {
    https: false, // Development
    cookieKey: '__Host-csrf',
    methodsToProtect: ['POST', 'PUT', 'PATCH', 'DELETE']
  },
  
  // Runtime configuration
  runtimeConfig: {
    // Server-side only
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    
    // Public configuration
    public: {
      useMockDb: process.env.USE_MOCK_DB === 'true'
    }
  }
})
```

## 🎯 Extension Points

### Adding New BBCode Tags
```javascript
// In useBBCode.js
customBBCodes: {
  newTag: {
    tag: 'newtag',
    description: 'Description of new tag',
    syntax: '[newtag param="value"]content[/newtag]',
    component: 'NewTagComponent'
  }
}

// In BBCodeRenderer.vue
newTag: {
  type: 'tag',
  open: (attr) => `<div class="new-tag" data-param="${attr.param}">`,
  close: '</div>'
}
```

### Adding New API Endpoints
```javascript
// server/api/newresource/index.get.js
export default defineEventHandler(async (event) => {
  // Implement endpoint logic
  return { data: result }
})
```

## 📅 Historique et Évolution

### Juillet 2025 - Refactorisation Qualité
- **Services centralisés** : `/server/services/` avec auth-middleware, validation-service, audit-service
- **Constantes API** : `/server/constants/api-constants.js` pour la cohérence
- **Réduction code dupliqué** : 70% de diminution dans les APIs
- **TypeScript strict** : Amélioration des composants frontend
- **Architecture modulaire** : Séparation claire des responsabilités

### Juin 2025 - Développement Initial  
- Mise en place architecture Nuxt.js 3
- Système d'authentification JWT
- Interface d'administration
- Gestion des organigrammes et médias

Cette architecture fournit une base solide pour un CMS évolutif, sécurisé et maintenable avec des capacités avancées d'édition de contenu.

---

**Documentation mise à jour :** Juillet 2025  
**Version système :** 2.1.0