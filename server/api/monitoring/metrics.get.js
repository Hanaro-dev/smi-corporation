/**
 * Metrics Endpoint - Performance metrics and statistics
 */
import { metrics } from '../../services/metrics-service.js';
import { logger } from '../../services/logger-service.js';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const format = query.format || 'json';
  
  try {
    logger.logRequest(event);

    if (format === 'prometheus') {
      // Export in Prometheus format
      const prometheusMetrics = metrics.exportPrometheusMetrics();
      
      setHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
      setResponseStatus(event, 200);
      
      return prometheusMetrics;
    } else {
      // Export in JSON format
      const allMetrics = metrics.getAllMetrics();
      const systemMetrics = metrics.getSystemMetrics();
      
      setResponseStatus(event, 200);
      
      return {
        success: true,
        data: {
          application: allMetrics,
          system: systemMetrics,
          timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    logger.error('Metrics endpoint error', {
      error: error.message,
      stack: error.stack
    });
    
    setResponseStatus(event, 500);
    
    return {
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});