export default defineNuxtRouteMiddleware((to) => {
  const user = useState('user');
  
  // Debug info
  console.log('Auth middleware check:', {
    route: to.path,
    requiredPermission: to.meta.permission,
    user: user.value,
    userPermissions: user.value?.permissions,
    hasPermission: user.value?.permissions?.includes(to.meta.permission)
  });
  
  if (!user.value || !user.value.permissions?.includes(to.meta.permission)) {
    console.log('Access denied, redirecting to home');
    return navigateTo('/'); // Redirige si l'utilisateur n'a pas la permission
  }
});