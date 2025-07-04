/**
 * Utilitaires pour la gestion des adresses IP
 */

/**
 * Récupère un en-tête HTTP de façon native
 * @param {Object} event - Événement Nuxt
 * @param {string} name - Nom de l'en-tête
 * @returns {string|undefined} Valeur de l'en-tête
 */
function getHeader(event, name) {
  return event.node.req.headers[name.toLowerCase()];
}

/**
 * Extrait l'adresse IP du client depuis l'événement Nuxt
 * @param {Object} event - Événement Nuxt
 * @returns {string} Adresse IP du client
 */
export function getClientIP(event) {
  return getHeader(event, 'x-forwarded-for') || 
         getHeader(event, 'x-real-ip') || 
         event.node.req.socket.remoteAddress || 
         'unknown';
}