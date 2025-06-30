/**
 * CSRF-aware API utility functions
 * Provides consistent API request handling with CSRF protection
 * Uses nuxt-csurf's built-in $csrfFetch for automatic token handling
 */

/**
 * Make a CSRF-protected POST request
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request payload
 * @param {Object} options - Additional fetch options
 * @returns {Promise} API response
 */
export async function apiPost(url, data = {}, options = {}) {
  const { $csrfFetch } = useNuxtApp();
  
  return $csrfFetch(url, {
    method: 'POST',
    body: data,
    ...options
  });
}

/**
 * Make a CSRF-protected PUT request
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request payload
 * @param {Object} options - Additional fetch options
 * @returns {Promise} API response
 */
export async function apiPut(url, data = {}, options = {}) {
  const { $csrfFetch } = useNuxtApp();
  
  return $csrfFetch(url, {
    method: 'PUT',
    body: data,
    ...options
  });
}

/**
 * Make a CSRF-protected PATCH request
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request payload
 * @param {Object} options - Additional fetch options
 * @returns {Promise} API response
 */
export async function apiPatch(url, data = {}, options = {}) {
  const { $csrfFetch } = useNuxtApp();
  
  return $csrfFetch(url, {
    method: 'PATCH',
    body: data,
    ...options
  });
}

/**
 * Make a CSRF-protected DELETE request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise} API response
 */
export async function apiDelete(url, options = {}) {
  const { $csrfFetch } = useNuxtApp();
  
  return $csrfFetch(url, {
    method: 'DELETE',
    ...options
  });
}

/**
 * Make a GET request (no CSRF token needed)
 * @param {string} url - API endpoint URL
 * @param {Object} options - Additional fetch options
 * @returns {Promise} API response
 */
export async function apiGet(url, options = {}) {
  return $fetch(url, {
    method: 'GET',
    ...options
  });
}

/**
 * Handle API errors consistently
 * @param {Error} error - API error
 * @param {Function} showError - Error display function
 */
export function handleApiError(error, showError = console.error) {
  if (error?.data?.statusCode === 419) {
    // CSRF token mismatch - refresh token and retry
    showError('Session expirée. Veuillez recharger la page.');
    if (import.meta.client) {
      window.location.reload();
    }
    return;
  }
  
  if (error?.data?.statusCode === 429) {
    showError('Trop de requêtes. Veuillez patienter avant de réessayer.');
    return;
  }
  
  if (error?.data?.statusCode === 403) {
    showError('Permissions insuffisantes pour cette action.');
    return;
  }
  
  if (error?.data?.statusCode === 401) {
    showError('Authentification requise.');
    return;
  }
  
  // Generic error handling
  const message = error?.data?.message || error?.message || 'Une erreur est survenue';
  showError(message);
}

/**
 * Login API helper with CSRF handling
 * @param {Object} credentials - User credentials
 * @returns {Promise} Login response
 */
export async function loginApi(credentials) {
  try {
    return await apiPost('/api/auth/login', credentials);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Logout API helper with CSRF handling
 * @returns {Promise} Logout response
 */
export async function logoutApi() {
  try {
    return await apiPost('/api/auth/logout');
  } catch (error) {
    // Don't throw logout errors, just log them
    console.warn('Logout error:', error);
    return { success: true }; // Assume logout succeeded
  }
}

/**
 * Upload image with CSRF protection
 * @param {FormData} formData - Image form data
 * @returns {Promise} Upload response
 */
export async function uploadImageApi(formData) {
  const { $csrfFetch } = useNuxtApp();
  
  return $csrfFetch('/api/images', {
    method: 'POST',
    body: formData
  });
}

/**
 * Create or update page with CSRF protection
 * @param {Object} pageData - Page data
 * @param {number|null} pageId - Page ID for updates
 * @returns {Promise} API response
 */
export async function savePageApi(pageData, pageId = null) {
  if (pageId) {
    return apiPut(`/api/pages/${pageId}`, pageData);
  } else {
    return apiPost('/api/pages', pageData);
  }
}

/**
 * Delete page with CSRF protection
 * @param {number} pageId - Page ID
 * @returns {Promise} API response
 */
export async function deletePageApi(pageId) {
  return apiDelete(`/api/pages/${pageId}`);
}