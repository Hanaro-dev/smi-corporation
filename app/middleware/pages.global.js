export default defineNuxtRouteMiddleware(async (to) => {
  // Liste des préfixes de routes à exclure du traitement
  const excludedPrefixes = [
    '/admin',
    '/api',
    '/auth',
    '/__',
    '/page', // Exclure la route page elle-même pour éviter les redirections en boucle
    '/_nuxt'
  ];
  
  // Éviter de traiter les routes administratives, API ou routes internes de Nuxt
  if (excludedPrefixes.some(prefix => to.path.startsWith(prefix)) || to.path === '/') {
    return;
  }

  // Récupérer le slug depuis le chemin (enlever le premier slash)
  const slug = to.path.substring(1);
  
  // Si le slug est vide après traitement, continuer
  if (!slug || slug.trim() === '') {
    return;
  }

  try {
    // Tenter de récupérer la page par son slug
    const page = await $fetch(`/api/pages/by-slug/${slug}`);
    
    // Si la page existe et qu'elle est publiée
    if (page && page.status === 'published') {
      // Journalisation pour le débogage
      console.log(`Page found for slug "${slug}", redirecting to dynamic page renderer`);
      
      // Redirige vers la page dynamique avec les données de la page
      return navigateTo({
        path: '/page',
        query: {
          slug: page.slug,
          id: page.id
        }
      }, { redirectCode: 301 }); // 301 pour indiquer une redirection permanente pour le SEO
    } else if (page && page.status !== 'published') {
      // Si la page existe mais n'est pas publiée
      console.log(`Page found for slug "${slug}" but not published, access denied`);
      
      // Rediriger vers une page 404 ou afficher un message adapté
      return navigateTo('/404');
    }
  } catch (error) {
    // Analyse détaillée de l'erreur
    if (error.response && error.response.status === 404) {
      console.log(`Page not found for slug: ${slug}`);
    } else {
      // Journalisation des autres types d'erreurs pour le débogage
      console.error(`Error while fetching page with slug "${slug}":`, error);
    }
    
    // Pour les erreurs 404, on peut laisser Nuxt gérer naturellement
    // Pour les autres erreurs, on pourrait rediriger vers une page d'erreur
    if (error.response && error.response.status !== 404) {
      return navigateTo('/error');
    }
  }
});