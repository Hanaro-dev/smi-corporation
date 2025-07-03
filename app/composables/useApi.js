/**
 * Composable pour les appels API avec gestion automatique du CSRF
 */

export const useApi = () => {
  // Fonction pour récupérer le token CSRF depuis les cookies ou meta tag
  const getCsrfToken = () => {
    if (import.meta.server) return null;
    
    // Méthode 1: Essayer de récupérer depuis un meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      const token = metaTag.getAttribute('content');
      return token;
    }
    
    // Méthode 2: Essayer de récupérer depuis les cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        const token = decodeURIComponent(value);
        return token;
      }
    }
    return null;
  };

  // Wrapper pour $fetch avec CSRF automatique
  const apiCall = async (url, options = {}) => {
    const csrfToken = getCsrfToken();
    
    // Configuration par défaut
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    // Ajouter le token CSRF pour les méthodes qui en ont besoin
    const methodsNeedingCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const method = options.method?.toUpperCase() || 'GET';
    
    if (methodsNeedingCsrf.includes(method)) {
      if (!csrfToken) {
        console.warn('CSRF token not found, attempting to initialize...');
        try {
          await $fetch('/api/csrf-token', { method: 'GET', credentials: 'include' });
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait a bit
          const newToken = getCsrfToken();
          if (newToken) {
            defaultOptions.headers['X-XSRF-TOKEN'] = newToken;
            console.log('CSRF token initialized successfully');
          } else {
            console.error('Failed to get CSRF token after initialization');
          }
        } catch (error) {
          console.error('Failed to initialize CSRF token:', error);
        }
      } else {
        defaultOptions.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    // Merger les options
    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      return await $fetch(url, finalOptions);
    } catch (error) {
      // Gestion spéciale des erreurs CSRF
      if (error.status === 419 || error.statusCode === 419) {
        console.warn('CSRF token expired, reloading page...');
        if (import.meta.client) {
          window.location.reload();
        }
      }
      throw error;
    }
  };

  // Méthodes de convenance
  const get = (url, options = {}) => apiCall(url, { ...options, method: 'GET' });
  const post = (url, body, options = {}) => apiCall(url, { ...options, method: 'POST', body });
  const put = (url, body, options = {}) => apiCall(url, { ...options, method: 'PUT', body });
  const patch = (url, body, options = {}) => apiCall(url, { ...options, method: 'PATCH', body });
  const del = (url, options = {}) => apiCall(url, { ...options, method: 'DELETE' });

  return {
    apiCall,
    get,
    post,
    put,
    patch,
    delete: del,
    getCsrfToken
  };
};