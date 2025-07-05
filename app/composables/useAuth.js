export const useAuth = () => {
  const user = useState('user', () => null)
  const isAuthenticated = useState('isAuthenticated', () => false)
  const permissions = useState('permissions', () => [])
  const role = useState('role', () => null)

  // Initialiser depuis la session serveur
  const initAuth = async () => {
    try {
      const { data } = await $fetch('/api/_auth/session')
      
      if (data && data.user) {
        user.value = data.user
        isAuthenticated.value = true
        role.value = data.user.Role?.name || null
        permissions.value = data.user.Role?.Permissions?.map(p => p.name) || []
        
        console.log('Auth initialized:', {
          user: data.user.name,
          role: role.value,
          permissions: permissions.value
        })
        
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Erreur initialisation auth:', error)
      logout()
      return false
    }
  }

  // Connexion
  const login = async (credentials) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (response && response.user) {
        user.value = response.user
        isAuthenticated.value = true
        role.value = response.user.Role?.name || null
        permissions.value = response.user.Role?.Permissions?.map(p => p.name) || []
        
        console.log('Login successful:', {
          user: response.user.name,
          role: role.value,
          permissions: permissions.value
        })
        
        return { success: true }
      }
      
      return { success: false, error: 'Données de connexion invalides' }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      return { 
        success: false, 
        error: error.data?.message || 'Erreur de connexion' 
      }
    }
  }

  // Déconnexion
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      user.value = null
      isAuthenticated.value = false
      permissions.value = []
      role.value = null
      
      await navigateTo('/auth/login')
    }
  }

  // Vérifications de permissions
  const hasPermission = (permission) => {
    if (role.value === 'admin') return true
    return permissions.value.includes(permission)
  }

  const hasRole = (roleName) => {
    return role.value === roleName
  }

  const canAccess = (requiredPermissions) => {
    if (role.value === 'admin') return true
    
    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.some(perm => permissions.value.includes(perm))
    }
    
    return permissions.value.includes(requiredPermissions)
  }

  return {
    // État
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    permissions: readonly(permissions),
    role: readonly(role),
    
    // Actions
    initAuth,
    login,
    logout,
    
    // Vérifications
    hasPermission,
    hasRole,
    canAccess
  }
}