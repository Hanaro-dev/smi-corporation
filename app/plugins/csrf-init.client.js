/**
 * Plugin pour initialiser le token CSRF côté client
 */

export default defineNuxtPlugin(async () => {
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