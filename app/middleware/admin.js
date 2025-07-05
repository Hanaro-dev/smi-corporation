export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isAuthenticated, hasPermission, initAuth } = useAuth()
  
  // Si pas authentifié, essayer d'initialiser depuis la session
  if (!isAuthenticated.value) {
    console.log('Admin middleware: User not authenticated, trying to init from session...')
    const success = await initAuth()
    
    if (!success) {
      console.log('Admin middleware: No valid session, redirecting to login')
      return navigateTo('/auth/login?redirect=' + encodeURIComponent(to.path))
    }
  }
  
  // Vérifier que l'utilisateur a au moins une permission d'administration
  const adminPermissions = ['admin', 'manage_users', 'manage_roles', 'manage_permissions', 'manage_content', 'manage_media', 'manage_organigrammes']
  const hasAdminAccess = adminPermissions.some(perm => hasPermission(perm))
  
  if (!hasAdminAccess) {
    console.log('Admin middleware: Access denied, no admin permissions')
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé - Vous devez avoir des permissions d\'administration'
    })
  }
  
  console.log('Admin middleware: Access granted for', user.value?.name)
})