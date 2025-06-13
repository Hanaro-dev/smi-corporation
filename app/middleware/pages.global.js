export default defineNuxtRouteMiddleware(async (to) => {
  // Éviter de traiter les routes administratives ou les routes internes de Nuxt
  if (
    to.path.startsWith('/admin') || 
    to.path.startsWith('/api') || 
    to.path.startsWith('/auth') ||
    to.path.startsWith('/__') ||
    to.path === '/'
  ) {
    return;
  }

  // Récupérer le slug depuis le chemin (enlever le premier slash)
  const slug = to.path.substring(1);

  try {
    // Tenter de récupérer la page par son slug
    const page = await $fetch(`/api/pages/by-slug/${slug}`);
    
    // Si la page existe et qu'elle est publiée
    if (page && page.status === 'published') {
      // Redirige vers la page dynamique avec les données de la page
      return navigateTo({
        path: '/page',
        query: { 
          slug: page.slug,
          id: page.id
        }
      });
    }
  } catch (error) {
    // Si la page n'existe pas (404) ou autre erreur, continuer avec la route normale
    console.log(`Page not found for slug: ${slug}`);
  }
});