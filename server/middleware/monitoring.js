/**
 * Monitoring Middleware - Request/Response tracking and metrics collection
 */
import { logger } from '../services/logger-service.js';
import { metrics } from '../services/metrics-service.js';

export default defineEventHandler(async (event) => {
  // Only monitor API routes
  if (!event.node.req.url?.startsWith('/api')) {
    return;
  }

  const startTime = Date.now();
  const { req, res } = event.node;
  
  // Generate request ID and log request
  const requestId = logger.logRequest(event, startTime);
  
  // Start performance timer
  const timerName = `request_${requestId}`;
  metrics.startTimer(timerName);

  // Store original end method
  const originalEnd = res.end;
  const originalWrite = res.write;
  let responseSize = 0;
  let responseData = null;

  // Override write to capture response size
  res.write = function(chunk, encoding) {
    if (chunk) {
      responseSize += chunk.length;
    }
    return originalEnd.call(this, chunk, encoding);
  };

  // Override end to capture metrics
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Add final chunk size
    if (chunk) {
      responseSize += chunk.length;
    }

    // Capture response data for logging (only for small responses)
    if (chunk && responseSize < 1024) {
      try {
        responseData = JSON.parse(chunk);
      } catch (e) {
        // Not JSON, ignore
      }
    }

    // Record metrics
    const statusCode = res.statusCode;
    metrics.recordApiMetric(
      req.method,
      req.url,
      statusCode,
      duration,
      responseSize
    );

    // End timer
    metrics.endTimer(timerName, 'request_duration');

    // Log response
    logger.logResponse(event, statusCode, responseData);

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.url,
        duration,
        statusCode,
        responseSize,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
      });
    }

    // Log errors
    if (statusCode >= 400) {
      const logLevel = statusCode >= 500 ? 'error' : 'warn';
      logger[logLevel]('Request error', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode,
        duration,
        responseSize,
        response: responseData?.message || 'No error message'
      });

      // Record error metrics
      metrics.incrementCounter('api_errors_total');
      metrics.incrementCounter(`api_errors_${Math.floor(statusCode / 100)}xx`);
    }

    // Performance metrics by endpoint
    const endpoint = sanitizeEndpoint(req.url);
    metrics.recordHistogram(`endpoint_${req.method.toLowerCase()}_${endpoint}_duration`, duration);

    // Call original end
    return originalEnd.call(this, chunk, encoding);
  };

  // Handle uncaught errors in the request
  try {
    // Continue with the request
    return;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Request processing error', {
      requestId,
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      duration
    });

    // Record error metrics
    metrics.incrementCounter('api_errors_total');
    metrics.incrementCounter('api_errors_5xx');
    metrics.recordHistogram('error_request_duration', duration);

    throw error;
  }
});

/**
 * Sanitize URL for metric names
 */
function sanitizeEndpoint(url) {
  return url
    .split('?')[0]                        // Remove query parameters
    .replace(/\/\d+/g, '/:id')           // Replace numeric IDs with :id
    .replace(/[^a-zA-Z0-9_:\/]/g, '_')   // Replace special chars
    .replace(/\/+/g, '/')                // Remove duplicate slashes
    .replace(/^\/|\/$/g, '')             // Remove leading/trailing slashes
    .replace(/\//g, '_')                 // Replace slashes with underscores
    .replace(/_+/g, '_')                 // Remove duplicate underscores
    .replace(/^_|_$/g, '');              // Remove leading/trailing underscores
}