/**
 * Endpoint de debug pour vérifier la configuration CSRF
 */
import { defineEventHandler, setHeader } from 'h3';

export default defineEventHandler(async (event) => {
  // Configuration manuelle du cookie CSRF pour debug
  const csrfToken = `debug-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  // Définir le cookie CSRF manuellement
  setHeader(event, 'Set-Cookie', `XSRF-TOKEN=${csrfToken}; Path=/; SameSite=Lax`);
  
  return { 
    success: true, 
    message: 'CSRF debug token set',
    token: csrfToken,
    timestamp: new Date().toISOString(),
    config: {
      cookieHttpOnly: false,
      cookieSameSite: 'lax',
      cookieSecure: false
    }
  };
});