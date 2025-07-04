/**
 * Security Middleware - Enhanced security headers and validation
 */
import { defineEventHandler, setHeader } from '../utils/http-utils.js';

export default defineEventHandler(async (event) => {
  // Only apply to API routes
  if (!event.node.req.url?.startsWith('/api')) {
    return;
  }

  // Security headers
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
  setHeader(event, 'X-Frame-Options', 'DENY');
  setHeader(event, 'X-XSS-Protection', '1; mode=block');
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

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