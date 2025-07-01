/**
 * Plugin pour injecter le token CSRF dans un meta tag
 */

export default defineNuxtPlugin(async () => {
  // Ne s'exécute que côté client
  if (import.meta.server) return;

  // Attendre un peu pour s'assurer que la page est chargée
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Faire un appel GET pour déclencher la génération du token CSRF
    await $fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });

    // Attendre un peu pour que le cookie soit défini
    await new Promise(resolve => setTimeout(resolve, 50));

    // Lire le token depuis le cookie et l'injecter dans un meta tag
    const cookies = document.cookie.split(';');
    let csrfToken = null;
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        csrfToken = decodeURIComponent(value);
        break;
      }
    }

    if (csrfToken) {
      // Supprimer l'ancien meta tag s'il existe
      const existingMeta = document.querySelector('meta[name="csrf-token"]');
      if (existingMeta) {
        existingMeta.remove();
      }

      // Créer le nouveau meta tag
      const metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      metaTag.content = csrfToken;
      document.head.appendChild(metaTag);
      
      console.log('✅ CSRF token injected into meta tag:', csrfToken);
    } else {
      console.warn('❌ No CSRF token found to inject');
    }
  } catch (error) {
    console.warn('Failed to setup CSRF token:', error);
  }
});