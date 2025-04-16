export default defineNuxtRouteMiddleware((to, from) => {
  const user = useState('user');
  if (!user.value || !user.value.permissions.includes(to.meta.permission)) {
    return navigateTo('/'); // Redirige si l'utilisateur n'a pas la permission
  }
});