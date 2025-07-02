/**
 * Security Middleware - Enhanced security headers and validation
 */

export default defineEventHandler(async (event) => {
  // Only apply to API routes
  if (!event.node.req.url?.startsWith('/api')) {
    return;
  }

  // Security headers
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });

  // Content Security Policy for API responses
  if (process.env.NODE_ENV === 'production') {
    setHeader(event, 'Content-Security-Policy', 
      "default-src 'self'; script-src 'none'; object-src 'none';"
    );
  }

  // Rate limiting headers
  const clientIP = getClientIP(event.node.req);
  const rateLimitKey = `rate_limit:${clientIP}`;
  
  // Add security audit logging for sensitive operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.node.req.method)) {
    console.log(`[SECURITY AUDIT] ${event.node.req.method} ${event.node.req.url} from ${clientIP} at ${new Date().toISOString()}`);
  }
});

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}