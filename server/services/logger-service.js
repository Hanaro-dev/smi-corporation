/**
 * Advanced Logging Service - Structured logging with multiple outputs
 */
import { config } from '../utils/env-validation.js';

export class LoggerService {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.environment = process.env.NODE_ENV || 'development';
    this.service = options.service || 'smi-cms';
    this.version = process.env.npm_package_version || '1.0.0';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.enableRemote = options.enableRemote || false;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    };

    this.colors = {
      error: '\x1b[31m',   // Rouge
      warn: '\x1b[33m',    // Jaune
      info: '\x1b[36m',    // Cyan
      http: '\x1b[35m',    // Magenta
      debug: '\x1b[37m',   // Blanc
      reset: '\x1b[0m'
    };
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      environment: this.environment,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost',
      ...meta
    };
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Format message for console output
   */
  formatConsoleMessage(entry) {
    const color = this.colors[entry.level] || this.colors.reset;
    const reset = this.colors.reset;
    const timestamp = entry.timestamp.substring(11, 19); // HH:MM:SS
    
    let formatted = `${color}[${timestamp}] ${entry.level.toUpperCase()}${reset} ${entry.message}`;
    
    if (entry.requestId) {
      formatted += ` (req: ${entry.requestId.substring(0, 8)})`;
    }
    
    if (entry.userId) {
      formatted += ` (user: ${entry.userId})`;
    }
    
    if (entry.duration) {
      formatted += ` (${entry.duration}ms)`;
    }
    
    return formatted;
  }

  /**
   * Output log entry
   */
  output(entry) {
    if (this.enableConsole) {
      if (entry.level === 'error') {
        console.error(this.formatConsoleMessage(entry));
        if (entry.stack) {
          console.error(entry.stack);
        }
        if (entry.details && this.level === 'debug') {
          console.error('Details:', JSON.stringify(entry.details, null, 2));
        }
      } else {
        console.log(this.formatConsoleMessage(entry));
        if (entry.details && this.level === 'debug') {
          console.log('Details:', JSON.stringify(entry.details, null, 2));
        }
      }
    }

    // File logging (à implémenter si nécessaire)
    if (this.enableFile) {
      this.writeToFile(entry);
    }

    // Remote logging (à implémenter pour services externes)
    if (this.enableRemote) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Main logging method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, meta);
    this.output(entry);
    
    return entry;
  }

  // Convenience methods
  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  http(message, meta = {}) {
    return this.log('http', message, meta);
  }

  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  /**
   * Log API request
   */
  logRequest(event, startTime = Date.now()) {
    const { req } = event.node;
    const requestId = this.generateRequestId();
    
    const meta = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      contentLength: req.headers['content-length'],
      referer: req.headers.referer
    };

    this.http(`${req.method} ${req.url}`, meta);
    
    // Store request ID for response logging
    event.context.requestId = requestId;
    event.context.startTime = startTime;
    
    return requestId;
  }

  /**
   * Log API response
   */
  logResponse(event, statusCode, responseData = null) {
    const { requestId, startTime } = event.context;
    const duration = Date.now() - (startTime || Date.now());
    
    const meta = {
      requestId,
      statusCode,
      duration,
      responseSize: responseData ? JSON.stringify(responseData).length : 0
    };

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `Response ${statusCode}`, meta);
  }

  /**
   * Log database query
   */
  logQuery(query, duration, meta = {}) {
    this.debug('Database query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      duration,
      ...meta
    });
  }

  /**
   * Log authentication events
   */
  logAuth(action, userId, meta = {}) {
    this.info(`Auth: ${action}`, {
      userId,
      action,
      ...meta
    });
  }

  /**
   * Log security events
   */
  logSecurity(event, meta = {}) {
    this.warn(`Security: ${event}`, {
      event,
      severity: 'medium',
      ...meta
    });
  }

  /**
   * Log business events
   */
  logBusiness(event, meta = {}) {
    this.info(`Business: ${event}`, {
      event,
      category: 'business',
      ...meta
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, value, meta = {}) {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit: meta.unit || 'ms',
      ...meta
    });
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    return new ContextualLogger(this, context);
  }

  /**
   * File logging implementation
   */
  writeToFile(entry) {
    // TODO: Implémenter l'écriture en fichier
    // Possibilité d'utiliser fs.appendFile ou un stream
  }

  /**
   * Remote logging implementation
   */
  sendToRemote(entry) {
    // TODO: Implémenter l'envoi vers service externe
    // Exemples: Elasticsearch, Loki, DataDog, New Relic
  }
}

/**
 * Contextual Logger - Adds context to all log entries
 */
class ContextualLogger {
  constructor(parentLogger, context) {
    this.parent = parentLogger;
    this.context = context;
  }

  log(level, message, meta = {}) {
    return this.parent.log(level, message, { ...this.context, ...meta });
  }

  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  http(message, meta = {}) {
    return this.log('http', message, meta);
  }

  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }
}

// Global logger instance
export const logger = new LoggerService({
  level: process.env.LOG_LEVEL || 'info',
  service: 'smi-cms',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableRemote: process.env.ENABLE_REMOTE_LOGGING === 'true'
});

export default logger;