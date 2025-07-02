/**
 * Health Check Endpoint - System health status
 */
import { healthService } from '../../services/health-service.js';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const detailed = query.detailed === 'true';
  
  try {
    // Run health checks if they haven't been run recently
    const lastCheck = healthService.lastCheck;
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    if (!lastCheck || new Date(lastCheck).getTime() < fiveMinutesAgo) {
      await healthService.runAllChecks();
    }

    // Get appropriate level of detail
    const healthData = detailed 
      ? healthService.getDetailedMetrics()
      : healthService.getHealthStatus();

    // Set appropriate HTTP status code
    const httpStatus = healthService.status === 'healthy' ? 200 : 
                      healthService.status === 'degraded' ? 200 : 503;

    setResponseStatus(event, httpStatus);
    
    return {
      success: true,
      data: healthData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    setResponseStatus(event, 500);
    
    return {
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});