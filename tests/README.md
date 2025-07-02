# Tests - SMI Corporation CMS

Ce dossier contient l'infrastructure de tests complète pour le CMS SMI Corporation, incluant les tests unitaires, d'intégration et end-to-end (E2E).

## Structure des Tests

```
tests/
├── unit/                     # Tests unitaires
│   ├── services/             # Tests des services
│   │   ├── logger-service.test.ts
│   │   ├── metrics-service.test.ts
│   │   ├── health-service.test.ts
│   │   ├── cache-service.test.ts
│   │   └── database-service.test.ts
│   └── utils/                # Tests des utilitaires
├── integration/              # Tests d'intégration
│   └── api/                  # Tests API
│       ├── auth.integration.test.ts
│       └── pages.integration.test.ts
├── e2e/                      # Tests end-to-end
│   ├── auth-flow.e2e.test.ts
│   └── admin-workflow.e2e.test.ts
├── setup/                    # Configuration des tests
│   ├── global-setup.ts
│   ├── test-setup.ts
│   ├── playwright-global-setup.ts
│   └── playwright-global-teardown.ts
└── reports/                  # Rapports de tests
    ├── coverage/
    └── playwright-output/
```

## Types de Tests

### 1. Tests Unitaires (`tests/unit/`)

Testent les composants individuels en isolation.

- **Services** : LoggerService, MetricsService, HealthService, CacheService, DatabaseService
- **Utilitaires** : Fonctions d'aide, validateurs, etc.
- **Composants** : Composants Vue individuels

### 2. Tests d'Intégration (`tests/integration/`)

Testent l'interaction entre plusieurs composants.

- **API** : Tests des endpoints avec authentification
- **Base de données** : Opérations CRUD complètes
- **Services** : Intégration entre services

### 3. Tests End-to-End (`tests/e2e/`)

Testent l'application complète du point de vue utilisateur.

- **Flux d'authentification** : Login, logout, inscription
- **Workflow administrateur** : Gestion des utilisateurs, pages, médias
- **Navigation** : Parcours utilisateur complets

## Configuration

### Vitest (Tests Unitaires et Intégration)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup/test-setup.ts'],
    globalSetup: ['./tests/setup/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'tests/', '*.config.*']
    }
  }
})
```

### Playwright (Tests E2E)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
})
```

## Commandes de Test

### Tests Unitaires et Intégration

```bash
# Exécuter tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Interface utilisateur des tests
npm run test:ui

# Couverture de code
npm run test:coverage

# Tests d'intégration uniquement
npm run test:integration

# Exécution unique (CI)
npm run test:run
```

### Tests E2E

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Interface utilisateur Playwright
npm run test:e2e:ui

# Tests spécifiques
npx playwright test auth-flow
npx playwright test --grep "login"

# Déboggage
npx playwright test --debug
```

## Utilitaires de Test

### Utilitaires Globaux (`tests/setup/test-setup.ts`)

```typescript
global.testUtils = {
  createMockUser: () => ({ /* mock user */ }),
  createMockPage: () => ({ /* mock page */ }),
  createMockRequest: () => ({ /* mock request */ }),
  createMockResponse: () => ({ /* mock response */ }),
  waitFor: (condition, timeout) => Promise<void>,
  sleep: (ms) => Promise<void>
}
```

### Mocks et Fixtures

- **Base de données** : Mock automatique en mode test
- **Services externes** : Mocks pour APIs tierces
- **Authentification** : Tokens et sessions de test

## Couverture de Code

### Objectifs de Couverture

- **Global** : 80% (branches, fonctions, lignes, statements)
- **Services critiques** : 90%
- **API d'authentification** : 85%
- **Utilitaires** : 75%

### Seuils par Module

```typescript
thresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  'server/services/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  'server/api/auth/': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

## Bonnes Pratiques

### 1. Structuration des Tests

- **Arrange** : Préparer les données et mocks
- **Act** : Exécuter l'action à tester
- **Assert** : Vérifier les résultats

### 2. Nommage

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Test implementation
    })
  })
})
```

### 3. Isolation

- Chaque test doit être indépendant
- Reset des mocks entre les tests
- Nettoyage des données temporaires

### 4. Performance

- Tests rapides (< 1s pour unitaires)
- Parallélisation quand possible
- Mocks pour les opérations lentes

## Débogage

### Tests Unitaires

```bash
# Déboggage avec VS Code
npm run test:watch

# Logs détaillés
DEBUG=* npm run test

# Test spécifique
npm run test -- logger-service.test.ts
```

### Tests E2E

```bash
# Mode débogage interactif
npx playwright test --debug

# Avec navigateur visible
npx playwright test --headed

# Enregistrement de vidéo
npx playwright test --video=on
```

## Intégration CI/CD

### GitHub Actions

```yaml
- name: Run Unit Tests
  run: npm run test:run

- name: Run Integration Tests
  run: npm run test:integration

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Variables d'Environnement

```bash
NODE_ENV=test
USE_MOCK_DB=true
LOG_LEVEL=error
TEST_TIMEOUT=10000
JWT_SECRET=test-jwt-secret
CSRF_SECRET=test-csrf-secret
```

## Rapports

### Localisation

- **Couverture** : `coverage/index.html`
- **Vitest** : `tests/reports/vitest-report.html`
- **Playwright** : `tests/reports/playwright-report/index.html`

### Formats Exportés

- **JSON** : Intégration avec outils externes
- **XML** : Compatibilité CI/CD
- **HTML** : Visualisation interactive

## Maintenance

### Mise à Jour des Dépendances

```bash
# Vérifier les versions
npm outdated

# Mettre à jour Vitest
npm update vitest @vitest/ui @vitest/coverage-v8

# Mettre à jour Playwright
npm update playwright
npx playwright install
```

### Ajout de Nouveaux Tests

1. Créer le fichier test dans le bon dossier
2. Suivre les conventions de nommage
3. Ajouter les mocks nécessaires
4. Vérifier la couverture
5. Mettre à jour la documentation

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Guide des Tests Vue.js](https://vue-test-utils.vuejs.org/)

---

*Documentation générée automatiquement - Dernière mise à jour : 2025-01-02*