export default defineNuxtRouteMiddleware((to, from) => {
  const user = useState('user'); // Exemple : récupérez l'utilisateur connecté
  if (!user.value || user.value.role !== 'admin') {
    return navigateTo('/');
  }
});