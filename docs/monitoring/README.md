# 📊 Monitoring & Observabilité - SMI Corporation CMS

Système de monitoring complet avec logging structuré, métriques de performance et health checks automatisés.

## 🚀 Vue d'Ensemble

Le système de monitoring fournit :

- **📝 Logging structuré** avec niveaux multiples et contexte riche
- **📊 Métriques de performance** temps réel avec historique
- **🏥 Health checks automatisés** pour tous les composants critiques
- **📈 Tableau de bord interactif** avec graphiques en temps réel
- **🔔 Alerting intelligent** basé sur des seuils configurables

## 📁 Architecture

```
server/
├── services/
│   ├── logger-service.js      # Logging structuré avancé
│   ├── metrics-service.js     # Collecte de métriques
│   └── health-service.js      # Health checks système
├── middleware/
│   └── monitoring.js          # Middleware de surveillance
└── api/monitoring/
    ├── health.get.js          # Endpoint health check
    ├── metrics.get.js         # Endpoint métriques
    └── status.get.js          # Endpoint status simple

docs/monitoring/
├── dashboard.html             # Tableau de bord interactif
└── README.md                  # Cette documentation
```

## 🛠️ Installation et Configuration

### 1. Activation du Monitoring

Le monitoring est automatiquement activé. Configurez via les variables d'environnement :

```env
# Niveau de logging
LOG_LEVEL=info              # error, warn, info, http, debug

# Logging externe
ENABLE_REMOTE_LOGGING=false # true pour envoyer vers service externe

# Seuils d'alerte
ALERT_MEMORY_THRESHOLD=80   # % utilisation mémoire
ALERT_API_THRESHOLD=1000    # ms temps de réponse
ALERT_DB_THRESHOLD=500      # ms requête DB
```

### 2. Intégration dans l'Application

Le monitoring s'intègre automatiquement :

```javascript
// Le middleware monitoring est déjà configuré
// Les services sont automatiquement initialisés au démarrage
```

## 📝 Logging Structuré

### Utilisation du Logger

```javascript
import { logger } from './server/services/logger-service.js';

// Logs de base
logger.info('Message informatif');
logger.warn('Message d\'avertissement');
logger.error('Message d\'erreur');

// Logs avec contexte
logger.info('Utilisateur connecté', {
  userId: 123,
  email: 'user@example.com',
  ip: '192.168.1.1'
});

// Logs spécialisés
logger.logAuth('login', 123, { successful: true });
logger.logSecurity('suspicious_activity', { ip: '1.2.3.4' });
logger.logBusiness('page_created', { pageId: 456, userId: 123 });
```

### Logger Contextuel

```javascript
// Créer un logger avec contexte
const userLogger = logger.child({ userId: 123, session: 'abc123' });

// Tous les logs incluront automatiquement le contexte
userLogger.info('Action réalisée'); // Inclut userId et session
```

### Format des Logs

```json
{
  "timestamp": "2025-07-05T14:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "service": "smi-cms",
  "version": "1.0.0",
  "environment": "production",
  "pid": 12345,
  "hostname": "server-01",
  "userId": 123,
  "requestId": "req_1672656600_abc123",
  "duration": 250
}
```

## 📊 Métriques de Performance

### Métriques Automatiques

Le système collecte automatiquement :

#### API Metrics
- **Requêtes totales** par endpoint
- **Temps de réponse** (moyenne, P95, P99)
- **Codes de statut** (2xx, 4xx, 5xx)
- **Taille des réponses**

#### Base de Données
- **Requêtes SQL** par table/opération
- **Temps d'exécution** des requêtes
- **Nombre de lignes** affectées

#### Système
- **Utilisation mémoire** (heap, RSS)
- **Temps de fonctionnement**
- **Utilisation CPU**

#### Cache
- **Hit/Miss ratio**
- **Temps d'accès**
- **Taille du cache**

### Métriques Personnalisées

```javascript
import { metrics } from './server/services/metrics-service.js';

// Compteurs
metrics.incrementCounter('user_registrations');
metrics.incrementCounter('email_sent', 5);

// Histogrammes (durées, tailles)
metrics.recordHistogram('file_upload_size', 1024000);
metrics.recordHistogram('external_api_time', 350);

// Jauges (valeurs instantanées)
metrics.setGauge('active_users', 142);
metrics.setGauge('queue_size', 25);

// Métriques métier
metrics.recordBusinessMetric('page_view', 1, { pageId: 123 });
metrics.recordAuthMetric('login', true, 200);
```

### Timers

```javascript
// Mesurer la durée d'une opération
const timer = metrics.startTimer('complex_operation');

// ... opération longue ...

const duration = metrics.endTimer('complex_operation', 'operation_duration');
console.log(`Opération terminée en ${duration}ms`);
```

## 🏥 Health Checks

### Health Checks Intégrés

Le système inclut des vérifications automatiques :

- **🗄️ Database** - Connectivité et temps de réponse
- **💾 Memory** - Utilisation mémoire avec seuils
- **💽 Cache** - Fonctionnalité du service de cache
- **📁 Disk** - Espace disque disponible
- **🌐 API** - Performance des endpoints
- **📦 Dependencies** - Modules requis disponibles

### Health Checks Personnalisés

```javascript
import { healthService } from './server/services/health-service.js';

// Enregistrer un nouveau check
healthService.registerCheck('external_service', async () => {
  try {
    const response = await fetch('https://api.external.com/health');
    
    if (response.ok) {
      return { 
        status: 'healthy', 
        message: 'External service operational',
        responseTime: Date.now() - startTime
      };
    } else {
      return { 
        status: 'unhealthy', 
        message: `External service returned ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: 'External service unreachable',
      error: error.message 
    };
  }
}, {
  timeout: 5000,
  critical: true,
  description: 'External API dependency'
});
```

### Statuts de Santé

- **🟢 healthy** - Tous les systèmes fonctionnent normalement
- **🟡 degraded** - Performance réduite mais service opérationnel
- **🔴 unhealthy** - Dysfonctionnement critique détecté

## 🔗 Endpoints de Monitoring

### `/api/monitoring/health`

Health check complet avec détails optionnels.

```bash
# Status simple
curl http://localhost:3000/api/monitoring/health

# Détails complets
curl http://localhost:3000/api/monitoring/health?detailed=true
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "lastCheck": "2025-07-05T14:30:00.000Z",
    "consecutiveFailures": 0,
    "checks": {
      "database": {
        "status": "healthy",
        "message": "Database connection successful",
        "duration": 45,
        "lastCheck": "2025-07-05T14:30:00.000Z"
      }
    }
  }
}
```

### `/api/monitoring/metrics`

Métriques de performance détaillées.

```bash
# Format JSON
curl http://localhost:3000/api/monitoring/metrics

# Format Prometheus
curl http://localhost:3000/api/monitoring/metrics?format=prometheus
```

### `/api/monitoring/status`

Status simple pour load balancers.

```bash
curl http://localhost:3000/api/monitoring/status
```

**Réponse :**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-05T14:30:00.000Z"
}
```

## 📈 Tableau de Bord

### Accès au Dashboard

Le tableau de bord interactif est disponible à :
```
http://localhost:3000/docs/monitoring/dashboard.html
```

### Fonctionnalités

- **📊 Métriques en temps réel** - CPU, mémoire, API
- **📈 Graphiques temporels** - Tendances et historique
- **🏥 Status des health checks** - Vue d'ensemble instantanée
- **🔄 Actualisation automatique** - Rafraîchissement configurable
- **📱 Interface responsive** - Compatible mobile/desktop

### Captures d'Écran

Le dashboard affiche :
- Vue d'ensemble du status système
- Métriques de performance API
- Utilisation des ressources système
- Graphiques de tendances temporelles
- Statut détaillé des health checks

## 🔔 Alerting et Notifications

### Seuils par Défaut

```javascript
const thresholds = {
  api_response_time: 1000,    // 1 seconde
  db_query_time: 500,         // 500ms
  memory_usage: 80,           // 80%
  cpu_usage: 70               // 70%
};
```

### Alertes Automatiques

Le système génère automatiquement des alertes pour :

- **🐌 Requêtes lentes** - API > 1s, DB > 500ms
- **💾 Mémoire élevée** - Utilisation > 80%
- **❌ Échecs consécutifs** - 3 health check failures
- **🔒 Événements sécurité** - Tentatives d'authentification suspectes

### Logs d'Alerte

```json
{
  "level": "warn",
  "message": "Slow API response",
  "endpoint": "GET /api/pages",
  "duration": 1250,
  "threshold": 1000,
  "metric": "api_response_time"
}
```

## 🔧 Intégration avec Services Externes

### Prometheus

Export des métriques au format Prometheus :

```bash
curl http://localhost:3000/api/monitoring/metrics?format=prometheus
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

Configuration pour envoi des logs :

```javascript
// À configurer dans logger-service.js
sendToRemote(entry) {
  // Envoi vers Elasticsearch
  fetch('http://elasticsearch:9200/smi-cms-logs/_doc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
}
```

### Grafana

Dashboard Grafana utilisant les métriques Prometheus.

### DataDog / New Relic

Intégration via agents ou API pour monitoring avancé.

## 🛡️ Sécurité du Monitoring

### Protection des Endpoints

```javascript
// Ajouter authentification pour les endpoints sensibles
if (event.node.req.url.includes('/monitoring/metrics')) {
  // Vérifier token admin ou IP whitelist
  await verifyAdminAccess(event);
}
```

### Données Sensibles

Le système évite automatiquement de logger :
- Mots de passe
- Tokens JWT
- Données personnelles
- Clés d'API

### Audit du Monitoring

Toutes les actions de monitoring sont tracées :

```javascript
logger.logSecurity('monitoring_access', {
  endpoint: '/api/monitoring/metrics',
  ip: clientIP,
  userAgent: userAgent
});
```

## 📊 Métriques de Performance

### Benchmarks Recommandés

- **API Response Time P95** < 500ms
- **Database Query Time P95** < 200ms
- **Memory Usage** < 70%
- **Cache Hit Rate** > 80%
- **Health Check Success Rate** > 99%

### Optimisation

Basé sur les métriques, optimisez :
- **Requêtes lentes** - Ajout d'index, optimisation SQL
- **Mémoire élevée** - Réduction cache, leak detection
- **API lente** - Mise en cache, optimisation code
- **Cache inefficace** - Stratégie de cache, TTL tuning

## 🚀 Mise en Production

### Configuration Production

```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_REMOTE_LOGGING=true
METRICS_RETENTION_DAYS=30
HEALTH_CHECK_INTERVAL=30000
```

### Monitoring Infrastructure

1. **Load Balancer Health Checks**
   ```
   GET /api/monitoring/status
   ```

2. **Application Performance Monitoring**
   ```
   GET /api/monitoring/metrics?format=prometheus
   ```

3. **Log Aggregation**
   ```
   Logs → Filebeat → Logstash → Elasticsearch → Kibana
   ```

4. **Alerting**
   ```
   Prometheus → AlertManager → Slack/Email
   ```

## 🔍 Troubleshooting

### Problèmes Courants

#### High Memory Usage
```bash
# Vérifier les métriques mémoire
curl localhost:3000/api/monitoring/metrics | jq '.data.system.memory'

# Analyser les logs
grep "High memory usage" logs/app.log
```

#### Slow API Responses
```bash
# Identifier les endpoints lents
curl localhost:3000/api/monitoring/metrics | jq '.data.application.histograms'

# Analyser les requêtes
grep "Slow request" logs/app.log
```

#### Health Check Failures
```bash
# Détails des checks
curl localhost:3000/api/monitoring/health?detailed=true

# Status simple
curl localhost:3000/api/monitoring/status
```

### Debug Mode

```env
LOG_LEVEL=debug
```

Active les logs détaillés pour diagnostic approfondi.

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Seuils d'alerte ajustés
- [ ] Dashboard accessible
- [ ] Health checks fonctionnels
- [ ] Métriques collectées
- [ ] Logs structurés activés
- [ ] Intégration externe configurée
- [ ] Documentation équipe mise à jour

Le système de monitoring est maintenant opérationnel ! 🎉