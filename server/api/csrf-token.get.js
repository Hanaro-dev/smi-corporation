/**
 * Endpoint pour obtenir/initialiser le token CSRF
 */

export default defineEventHandler(async (event) => {
  // Retourner simplement un message de succès
  // Le middleware nuxt-csurf va automatiquement créer le cookie
  return { 
    success: true, 
    message: 'CSRF token initialized',
    timestamp: new Date().toISOString()
  };
});