/**
 * Metrics Service - Performance monitoring and metrics collection
 */
import { logger } from './logger-service.js';

export class MetricsService {
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
    this.gauges = new Map();
    this.timers = new Map();
    
    // Performance thresholds
    this.thresholds = {
      api_response_time: 1000,    // 1 second
      db_query_time: 500,         // 500ms
      memory_usage: 80,           // 80%
      cpu_usage: 70               // 70%
    };

    this.startSystemMonitoring();
  }

  /**
   * Record API endpoint metrics
   */
  recordApiMetric(method, endpoint, statusCode, duration, size = 0) {
    const key = `api_${method.toLowerCase()}_${this.sanitizeEndpoint(endpoint)}`;
    
    // Increment counter
    this.incrementCounter(`${key}_total`);
    this.incrementCounter(`api_requests_total`);
    
    // Record status code
    this.incrementCounter(`${key}_status_${statusCode}`);
    
    // Record response time
    this.recordHistogram(`${key}_duration`, duration);
    this.recordHistogram('api_response_time', duration);
    
    // Record response size
    if (size > 0) {
      this.recordHistogram(`${key}_size`, size);
      this.recordHistogram('api_response_size', size);
    }

    // Check thresholds and alert
    if (duration > this.thresholds.api_response_time) {
      logger.warn('Slow API response', {
        endpoint: `${method} ${endpoint}`,
        duration,
        threshold: this.thresholds.api_response_time,
        metric: 'api_response_time'
      });
    }

    // Log performance metrics periodically
    this.maybeLogMetrics();
  }

  /**
   * Record database query metrics
   */
  recordDatabaseMetric(operation, table, duration, rowCount = 0) {
    const key = `db_${operation.toLowerCase()}_${table}`;
    
    this.incrementCounter(`${key}_total`);
    this.incrementCounter('db_queries_total');
    this.recordHistogram(`${key}_duration`, duration);
    this.recordHistogram('db_query_time', duration);
    
    if (rowCount > 0) {
      this.recordHistogram(`${key}_rows`, rowCount);
    }

    // Alert for slow queries
    if (duration > this.thresholds.db_query_time) {
      logger.warn('Slow database query', {
        operation,
        table,
        duration,
        threshold: this.thresholds.db_query_time,
        rowCount,
        metric: 'db_query_time'
      });
    }
  }

  /**
   * Record authentication metrics
   */
  recordAuthMetric(action, success, duration = 0) {
    this.incrementCounter(`auth_${action}_total`);
    this.incrementCounter(`auth_${action}_${success ? 'success' : 'failure'}`);
    
    if (duration > 0) {
      this.recordHistogram(`auth_${action}_duration`, duration);
    }

    if (!success) {
      logger.logSecurity(`Authentication failure: ${action}`, {
        action,
        metric: 'auth_failure'
      });
    }
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(event, value = 1, metadata = {}) {
    this.incrementCounter(`business_${event}_total`, value);
    
    if (metadata.userId) {
      this.incrementCounter(`business_${event}_by_user`);
    }

    logger.logBusiness(event, {
      value,
      ...metadata,
      metric: 'business_event'
    });
  }

  /**
   * Record cache metrics
   */
  recordCacheMetric(operation, hit, duration = 0) {
    this.incrementCounter(`cache_${operation}_total`);
    this.incrementCounter(`cache_${operation}_${hit ? 'hit' : 'miss'}`);
    
    if (duration > 0) {
      this.recordHistogram(`cache_${operation}_duration`, duration);
    }

    // Calculate hit rate
    const hitCount = this.getCounter(`cache_${operation}_hit`) || 0;
    const totalCount = this.getCounter(`cache_${operation}_total`) || 1;
    const hitRate = (hitCount / totalCount) * 100;
    
    this.setGauge(`cache_${operation}_hit_rate`, hitRate);
  }

  /**
   * Increment counter
   */
  incrementCounter(name, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Get counter value
   */
  getCounter(name) {
    return this.counters.get(name) || 0;
  }

  /**
   * Record histogram value
   */
  recordHistogram(name, value) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, {
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity
      });
    }

    const histogram = this.histograms.get(name);
    histogram.values.push(value);
    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);

    // Keep only last 1000 values for memory efficiency
    if (histogram.values.length > 1000) {
      histogram.values = histogram.values.slice(-1000);
    }
  }

  /**
   * Set gauge value
   */
  setGauge(name, value) {
    this.gauges.set(name, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Start timer
   */
  startTimer(name) {
    const startTime = Date.now();
    this.timers.set(name, startTime);
    return startTime;
  }

  /**
   * End timer and record duration
   */
  endTimer(name, recordAs = null) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn('Timer not found', { name });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    if (recordAs) {
      this.recordHistogram(recordAs, duration);
    }

    return duration;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name) {
    const histogram = this.histograms.get(name);
    if (!histogram || histogram.count === 0) {
      return null;
    }

    const values = histogram.values.sort((a, b) => a - b);
    const count = values.length;
    
    return {
      count: histogram.count,
      sum: histogram.sum,
      min: histogram.min,
      max: histogram.max,
      avg: histogram.sum / histogram.count,
      p50: values[Math.floor(count * 0.5)],
      p90: values[Math.floor(count * 0.9)],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)]
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const metrics = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {}
    };

    // Add histogram statistics
    for (const [name, _] of this.histograms) {
      metrics.histograms[name] = this.getHistogramStats(name);
    }

    return metrics;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version,
      timestamp: Date.now()
    };
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    setInterval(() => {
      const systemMetrics = this.getSystemMetrics();
      
      // Record memory usage
      const memoryUsage = (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100;
      this.setGauge('system_memory_usage_percent', memoryUsage);
      this.setGauge('system_memory_heap_used', systemMetrics.memory.heapUsed);
      this.setGauge('system_memory_heap_total', systemMetrics.memory.heapTotal);
      
      // Record uptime
      this.setGauge('system_uptime_seconds', systemMetrics.uptime);

      // Alert on high memory usage
      if (memoryUsage > this.thresholds.memory_usage) {
        logger.warn('High memory usage', {
          memoryUsage: memoryUsage.toFixed(2),
          threshold: this.thresholds.memory_usage,
          heapUsed: systemMetrics.memory.heapUsed,
          heapTotal: systemMetrics.memory.heapTotal,
          metric: 'memory_usage'
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Log metrics periodically
   */
  maybeLogMetrics() {
    // Log metrics every 100 requests
    const totalRequests = this.getCounter('api_requests_total');
    if (totalRequests > 0 && totalRequests % 100 === 0) {
      this.logMetricsSummary();
    }
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary() {
    const apiResponseTime = this.getHistogramStats('api_response_time');
    const dbQueryTime = this.getHistogramStats('db_query_time');
    const systemMetrics = this.getSystemMetrics();

    logger.info('Metrics Summary', {
      requests: {
        total: this.getCounter('api_requests_total'),
        response_time_avg: apiResponseTime?.avg?.toFixed(2),
        response_time_p95: apiResponseTime?.p95?.toFixed(2)
      },
      database: {
        queries_total: this.getCounter('db_queries_total'),
        query_time_avg: dbQueryTime?.avg?.toFixed(2),
        query_time_p95: dbQueryTime?.p95?.toFixed(2)
      },
      system: {
        memory_usage: ((systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100).toFixed(2) + '%',
        uptime: Math.floor(systemMetrics.uptime / 3600) + 'h'
      },
      metric: 'summary'
    });
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics() {
    let output = '';

    // Counters
    for (const [name, value] of this.counters) {
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${value}\n`;
    }

    // Gauges
    for (const [name, data] of this.gauges) {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${data.value}\n`;
    }

    // Histograms
    for (const [name, _] of this.histograms) {
      const stats = this.getHistogramStats(name);
      if (stats) {
        output += `# TYPE ${name} histogram\n`;
        output += `${name}_count ${stats.count}\n`;
        output += `${name}_sum ${stats.sum}\n`;
        output += `${name}_bucket{le="50"} ${stats.p50}\n`;
        output += `${name}_bucket{le="90"} ${stats.p90}\n`;
        output += `${name}_bucket{le="95"} ${stats.p95}\n`;
        output += `${name}_bucket{le="99"} ${stats.p99}\n`;
        output += `${name}_bucket{le="+Inf"} ${stats.count}\n`;
      }
    }

    return output;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.timers.clear();
  }

  /**
   * Sanitize endpoint for metric names
   */
  sanitizeEndpoint(endpoint) {
    return endpoint
      .replace(/\/\d+/g, '/:id')           // Replace IDs with :id
      .replace(/[^a-zA-Z0-9_:]/g, '_')     // Replace special chars
      .replace(/_+/g, '_')                 // Remove duplicate underscores
      .replace(/^_|_$/g, '');              // Remove leading/trailing underscores
  }
}

// Global metrics service
export const metrics = new MetricsService();
export default metrics;