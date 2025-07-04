/**
 * Utilitaires HTTP pour remplacer h3
 * Implémentations natives Node.js/Nuxt
 */

/**
 * Définit un gestionnaire d'événement (remplace defineEventHandler)
 * @param {Function} handler - Fonction de gestion
 * @returns {Function} Handler function
 */
export function defineEventHandler(handler) {
  return handler;
}

/**
 * Crée une erreur HTTP (remplace createError)
 * @param {Object} options - Options d'erreur
 * @returns {Error} HTTP Error
 */
export function createError(options) {
  const error = new Error(options.message || 'HTTP Error');
  error.statusCode = options.statusCode || 500;
  error.statusMessage = options.statusMessage;
  error.data = options.data;
  return error;
}

/**
 * Lit le corps de la requête (remplace readBody)
 * @param {Object} event - Événement Nuxt
 * @returns {Promise<any>} Body data
 */
export async function readBody(event) {
  if (!event.node.req.body) {
    return new Promise((resolve, reject) => {
      let body = '';
      event.node.req.on('data', chunk => {
        body += chunk.toString();
      });
      event.node.req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve(parsed);
        } catch (error) {
          resolve({});
        }
      });
      event.node.req.on('error', reject);
    });
  }
  return event.node.req.body;
}

/**
 * Récupère les paramètres de requête (remplace getQuery)
 * @param {Object} event - Événement Nuxt
 * @returns {Object} Query parameters
 */
export function getQuery(event) {
  if (!event.node.req.url) return {};
  
  const url = new URL(event.node.req.url, `http://${event.node.req.headers.host}`);
  const params = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Récupère un cookie (remplace getCookie)
 * @param {Object} event - Événement Nuxt
 * @param {string} name - Nom du cookie
 * @returns {string|undefined} Valeur du cookie
 */
export function getCookie(event, name) {
  const cookies = event.node.req.headers.cookie;
  if (!cookies) return undefined;
  
  const cookieArray = cookies.split(';');
  for (const cookie of cookieArray) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  
  return undefined;
}

/**
 * Récupère un en-tête HTTP (remplace getHeader)
 * @param {Object} event - Événement Nuxt
 * @param {string} name - Nom de l'en-tête
 * @returns {string|undefined} Valeur de l'en-tête
 */
export function getHeader(event, name) {
  return event.node.req.headers[name.toLowerCase()];
}

/**
 * Définit un en-tête HTTP (remplace setHeader)
 * @param {Object} event - Événement Nuxt
 * @param {string} name - Nom de l'en-tête
 * @param {string} value - Valeur de l'en-tête
 */
export function setHeader(event, name, value) {
  if (event.node.res && !event.node.res.headersSent) {
    event.node.res.setHeader(name, value);
  }
}