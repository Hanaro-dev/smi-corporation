/**
 * Plugin pour initialiser le token CSRF côté client
 * Désactivé en développement
 */

export default defineNuxtPlugin(async () => {
  // Seulement en production
  if (process.env.NODE_ENV !== 'production') {
    console.info('🔧 CSRF token initialization disabled in development');
    return;
  }

  // Ne s'exécute que côté client
  if (import.meta.server) return;

  try {
    // Faire un appel GET pour obtenir le token CSRF
    const response = await $fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('CSRF token initialized:', response);
  } catch (error) {
    console.warn('Failed to initialize CSRF token:', error);
  }
});