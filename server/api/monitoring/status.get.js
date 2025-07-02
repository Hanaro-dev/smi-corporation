/**
 * Simple Status Endpoint - For load balancer health checks
 */
import { healthService } from '../../services/health-service.js';

export default defineEventHandler(async (event) => {
  try {
    const status = healthService.getSimpleStatus();
    
    // Set HTTP status based on health
    const httpStatus = status.status === 'healthy' ? 200 : 
                      status.status === 'degraded' ? 200 : 503;
    
    setResponseStatus(event, httpStatus);
    
    // Simple response for load balancers
    return {
      status: status.status,
      timestamp: status.timestamp
    };
  } catch (error) {
    setResponseStatus(event, 500);
    
    return {
      status: 'unhealthy',
      error: 'Status check failed',
      timestamp: new Date().toISOString()
    };
  }
});