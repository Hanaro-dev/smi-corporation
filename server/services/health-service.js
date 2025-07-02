/**
 * Health Check Service - System health monitoring and diagnostics
 */
import { logger } from './logger-service.js';
import { metrics } from './metrics-service.js';
import { databaseService } from './database-service.js';
import { cacheService } from './cache-service.js';

export class HealthService {
  constructor() {
    this.checks = new Map();
    this.status = 'unknown';
    this.lastCheck = null;
    this.checkInterval = 30000; // 30 seconds
    this.unhealthyThreshold = 3; // 3 consecutive failures
    this.consecutiveFailures = 0;
    
    this.registerDefaultChecks();
    this.startPeriodicChecks();
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      check: checkFunction,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      description: options.description || `Health check for ${name}`,
      lastResult: null,
      consecutiveFailures: 0
    });
    
    logger.info(`Health check registered: ${name}`);
  }

  /**
   * Register default system checks
   */
  registerDefaultChecks() {
    // Database connectivity check
    this.registerCheck('database', async () => {
      try {
        await databaseService.authenticate();
        return { status: 'healthy', message: 'Database connection successful' };
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: 'Database connection failed', 
          error: error.message 
        };
      }
    }, { critical: true, description: 'Database connectivity' });

    // Memory usage check
    this.registerCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (usagePercent > 90) {
        return { 
          status: 'unhealthy', 
          message: `High memory usage: ${usagePercent.toFixed(2)}%`,
          usage: usagePercent,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal
        };
      } else if (usagePercent > 75) {
        return { 
          status: 'degraded', 
          message: `Elevated memory usage: ${usagePercent.toFixed(2)}%`,
          usage: usagePercent
        };
      }
      
      return { 
        status: 'healthy', 
        message: `Memory usage normal: ${usagePercent.toFixed(2)}%`,
        usage: usagePercent
      };
    }, { description: 'Memory usage monitoring' });

    // Cache service check
    this.registerCheck('cache', async () => {
      try {
        const testKey = 'health_check_test';
        const testValue = 'test_value';
        
        cacheService.set(testKey, testValue, 1000);
        const retrieved = cacheService.get(testKey);
        cacheService.delete(testKey);
        
        if (retrieved === testValue) {
          const stats = cacheService.getStats();
          return { 
            status: 'healthy', 
            message: 'Cache service operational',
            stats: {
              size: stats.size,
              hitRate: stats.hitRate
            }
          };
        } else {
          return { 
            status: 'unhealthy', 
            message: 'Cache service test failed' 
          };
        }
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: 'Cache service error', 
          error: error.message 
        };
      }
    }, { description: 'Cache service functionality' });

    // Disk space check (simulated)
    this.registerCheck('disk', async () => {
      try {
        // In a real implementation, you would check actual disk usage
        // For now, we'll simulate based on available memory
        const memUsage = process.memoryUsage();
        const simulatedDiskUsage = Math.min(85, (memUsage.heapUsed / memUsage.heapTotal) * 120);
        
        if (simulatedDiskUsage > 90) {
          return { 
            status: 'unhealthy', 
            message: `Disk usage critical: ${simulatedDiskUsage.toFixed(2)}%`,
            usage: simulatedDiskUsage
          };
        } else if (simulatedDiskUsage > 80) {
          return { 
            status: 'degraded', 
            message: `Disk usage elevated: ${simulatedDiskUsage.toFixed(2)}%`,
            usage: simulatedDiskUsage
          };
        }
        
        return { 
          status: 'healthy', 
          message: `Disk usage normal: ${simulatedDiskUsage.toFixed(2)}%`,
          usage: simulatedDiskUsage
        };
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: 'Disk check failed', 
          error: error.message 
        };
      }
    }, { description: 'Disk space monitoring' });

    // API responsiveness check
    this.registerCheck('api', async () => {
      const responseTime = metrics.getHistogramStats('api_response_time');
      
      if (!responseTime) {
        return { 
          status: 'healthy', 
          message: 'No API metrics available yet' 
        };
      }
      
      if (responseTime.p95 > 2000) {
        return { 
          status: 'unhealthy', 
          message: `API response time degraded: P95 ${responseTime.p95}ms`,
          responseTime: responseTime.p95
        };
      } else if (responseTime.p95 > 1000) {
        return { 
          status: 'degraded', 
          message: `API response time elevated: P95 ${responseTime.p95}ms`,
          responseTime: responseTime.p95
        };
      }
      
      return { 
        status: 'healthy', 
        message: `API performance good: P95 ${responseTime.p95}ms`,
        responseTime: responseTime.p95
      };
    }, { description: 'API response time monitoring' });

    // Dependencies check
    this.registerCheck('dependencies', async () => {
      const dependencies = [];
      
      try {
        // Check if required modules are loaded
        const requiredModules = ['bcryptjs', 'jsonwebtoken', 'sequelize'];
        for (const moduleName of requiredModules) {
          try {
            require.resolve(moduleName);
            dependencies.push({ name: moduleName, status: 'available' });
          } catch (error) {
            dependencies.push({ name: moduleName, status: 'missing' });
          }
        }
        
        const missingDeps = dependencies.filter(dep => dep.status === 'missing');
        
        if (missingDeps.length > 0) {
          return { 
            status: 'unhealthy', 
            message: `Missing dependencies: ${missingDeps.map(d => d.name).join(', ')}`,
            dependencies
          };
        }
        
        return { 
          status: 'healthy', 
          message: 'All dependencies available',
          dependencies
        };
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: 'Dependency check failed', 
          error: error.message 
        };
      }
    }, { description: 'Required dependencies check' });
  }

  /**
   * Run a single health check
   */
  async runCheck(name) {
    const checkConfig = this.checks.get(name);
    if (!checkConfig) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    
    try {
      // Run check with timeout
      const result = await Promise.race([
        checkConfig.check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), checkConfig.timeout)
        )
      ]);

      const duration = Date.now() - startTime;
      
      // Update check result
      checkConfig.lastResult = {
        ...result,
        duration,
        timestamp: new Date().toISOString()
      };

      // Reset consecutive failures on success
      if (result.status === 'healthy') {
        checkConfig.consecutiveFailures = 0;
      } else {
        checkConfig.consecutiveFailures++;
      }

      // Record metrics
      metrics.recordHistogram(`health_check_${name}_duration`, duration);
      metrics.incrementCounter(`health_check_${name}_total`);
      metrics.incrementCounter(`health_check_${name}_${result.status}`);

      return checkConfig.lastResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      checkConfig.consecutiveFailures++;
      checkConfig.lastResult = {
        status: 'unhealthy',
        message: error.message,
        duration,
        timestamp: new Date().toISOString()
      };

      // Record error metrics
      metrics.recordHistogram(`health_check_${name}_duration`, duration);
      metrics.incrementCounter(`health_check_${name}_total`);
      metrics.incrementCounter(`health_check_${name}_error`);

      logger.error(`Health check failed: ${name}`, {
        error: error.message,
        duration,
        consecutiveFailures: checkConfig.consecutiveFailures
      });

      return checkConfig.lastResult;
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    const results = {};
    const promises = [];
    
    for (const [name, _] of this.checks) {
      promises.push(
        this.runCheck(name).then(result => {
          results[name] = result;
        }).catch(error => {
          results[name] = {
            status: 'unhealthy',
            message: error.message,
            timestamp: new Date().toISOString()
          };
        })
      );
    }

    await Promise.allSettled(promises);
    
    // Determine overall health status
    this.updateOverallStatus(results);
    this.lastCheck = new Date().toISOString();
    
    return results;
  }

  /**
   * Update overall system status
   */
  updateOverallStatus(results) {
    const statuses = Object.values(results).map(r => r.status);
    const criticalChecks = Array.from(this.checks.values()).filter(c => c.critical);
    
    // Check critical systems first
    const criticalFailures = criticalChecks.filter(c => 
      c.lastResult && c.lastResult.status === 'unhealthy'
    );
    
    if (criticalFailures.length > 0) {
      this.status = 'unhealthy';
      this.consecutiveFailures++;
    } else if (statuses.includes('unhealthy')) {
      this.status = 'degraded';
      this.consecutiveFailures++;
    } else if (statuses.includes('degraded')) {
      this.status = 'degraded';
      this.consecutiveFailures = 0;
    } else {
      this.status = 'healthy';
      this.consecutiveFailures = 0;
    }

    // Log status changes
    if (this.consecutiveFailures === this.unhealthyThreshold) {
      logger.error('System health degraded', {
        status: this.status,
        consecutiveFailures: this.consecutiveFailures,
        criticalFailures: criticalFailures.map(c => c.name)
      });
    } else if (this.consecutiveFailures === 0 && this.status === 'healthy') {
      logger.info('System health restored', {
        status: this.status
      });
    }

    // Update metrics
    metrics.setGauge('system_health_status', this.statusToNumber(this.status));
    metrics.setGauge('system_consecutive_failures', this.consecutiveFailures);
  }

  /**
   * Convert status to numeric value for metrics
   */
  statusToNumber(status) {
    switch (status) {
      case 'healthy': return 1;
      case 'degraded': return 0.5;
      case 'unhealthy': return 0;
      default: return -1;
    }
  }

  /**
   * Get health status summary
   */
  getHealthStatus() {
    const checkResults = {};
    
    for (const [name, config] of this.checks) {
      checkResults[name] = {
        status: config.lastResult?.status || 'unknown',
        message: config.lastResult?.message || 'Not checked yet',
        lastCheck: config.lastResult?.timestamp,
        duration: config.lastResult?.duration,
        description: config.description,
        critical: config.critical,
        consecutiveFailures: config.consecutiveFailures
      };
    }

    return {
      status: this.status,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures,
      checks: checkResults,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get simple health status for load balancers
   */
  getSimpleStatus() {
    return {
      status: this.status,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        logger.error('Periodic health check failed', {
          error: error.message
        });
      }
    }, this.checkInterval);

    logger.info('Periodic health checks started', {
      interval: this.checkInterval,
      registeredChecks: Array.from(this.checks.keys())
    });
  }

  /**
   * Remove a health check
   */
  unregisterCheck(name) {
    if (this.checks.delete(name)) {
      logger.info(`Health check unregistered: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Get detailed metrics
   */
  getDetailedMetrics() {
    const systemMetrics = metrics.getSystemMetrics();
    const allMetrics = metrics.getAllMetrics();
    const healthStatus = this.getHealthStatus();

    return {
      health: healthStatus,
      system: systemMetrics,
      metrics: allMetrics,
      timestamp: new Date().toISOString()
    };
  }
}

// Global health service
export const healthService = new HealthService();
export default healthService;