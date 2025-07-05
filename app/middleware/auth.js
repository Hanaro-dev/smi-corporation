export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isAuthenticated, hasPermission, initAuth } = useAuth()
  
  // Si pas authentifié, essayer d'initialiser depuis la session
  if (!isAuthenticated.value) {
    console.log('User not authenticated, trying to init from session...')
    const success = await initAuth()
    
    if (!success) {
      console.log('No valid session, redirecting to login')
      return navigateTo('/auth/login?redirect=' + encodeURIComponent(to.path))
    }
  }
  
  // Vérifier les permissions si requises
  const requiredPermission = to.meta.permission
  
  if (requiredPermission) {
    const access = hasPermission(requiredPermission)
    
    console.log('Auth middleware check:', {
      route: to.path,
      requiredPermission,
      user: user.value?.name,
      userRole: user.value?.Role?.name,
      hasAccess: access
    })
    
    if (!access) {
      console.log('Access denied, insufficient permissions')
      throw createError({
        statusCode: 403,
        statusMessage: 'Accès refusé - Permissions insuffisantes'
      })
    }
  }
});