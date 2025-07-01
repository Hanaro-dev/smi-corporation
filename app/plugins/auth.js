import { useAuthStore } from '../stores/auth';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const router = useRouter();
  
  // Initialize auth state from server session only
  if (import.meta.client) {
    try {
      const { data } = await useFetch('/api/_auth/session');
      
      if (data.value && data.value.user) {
        // Set auth state from server session
        authStore.isAuthenticated = true;
        authStore.user = data.value.user;
        authStore.role = data.value.user.Role?.name || null;
        authStore.permissions = data.value.user.Role?.Permissions?.map(p => p.name) || [];
        authStore.error = null;
        
        console.log('Session utilisateur validée :', data.value.user.name);
      } else {
        // No valid server session
        authStore.logout();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la session :', error);
      authStore.logout();
    }
  }
  
  // Middleware global pour la gestion des routes protégées
  router.beforeEach((to, from, next) => {
    // Routes qui nécessitent une authentification
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    
    // Routes qui nécessitent un rôle spécifique
    const requiredRole = to.meta.role;
    
    // Routes qui nécessitent des permissions spécifiques
    const requiredPermissions = to.meta.permissions;
    
    // Vérifier si l'utilisateur est authentifié
    if (requiresAuth && !authStore.isAuthenticated) {
      // Rediriger vers la page de connexion avec l'URL de redirection
      return next({ 
        path: '/auth/login', 
        query: { redirect: to.fullPath } 
      });
    }
    
    // Vérifier le rôle si nécessaire
    if (requiredRole && !authStore.hasRole(requiredRole)) {
      // Rediriger vers une page d'accès refusé ou la page d'accueil
      return next({ path: '/403' });
    }
    
    // Vérifier les permissions si nécessaires
    if (requiredPermissions) {
      // Si c'est un tableau, vérifier si l'utilisateur a au moins une permission
      if (Array.isArray(requiredPermissions)) {
        if (!authStore.hasAnyPermission(requiredPermissions)) {
          return next({ path: '/403' });
        }
      } else {
        // Si c'est une permission unique
        if (!authStore.hasPermission(requiredPermissions)) {
          return next({ path: '/403' });
        }
      }
    }
    
    // Si toutes les vérifications passent, autoriser la navigation
    next();
  });
  
  // Fournir les helpers d'authentification à l'application
  return {
    provide: {
      auth: {
        // Vérifier si l'utilisateur est authentifié
        isAuthenticated: () => authStore.isAuthenticated,
        
        // Vérifier si l'utilisateur a un rôle spécifique
        hasRole: (role) => authStore.hasRole(role),
        
        // Vérifier si l'utilisateur a une permission spécifique
        hasPermission: (permission) => authStore.hasPermission(permission),
        
        // Vérifier si l'utilisateur a au moins une des permissions spécifiées
        hasAnyPermission: (permissions) => authStore.hasAnyPermission(permissions),
        
        // Obtenir l'utilisateur actuel
        getUser: () => authStore.user,
        
        // Obtenir le rôle de l'utilisateur
        getRole: () => authStore.role,
        
        // Déconnecter l'utilisateur
        logout: async () => {
          try {
            // Appel API pour déconnecter côté serveur
            await $fetch('/api/auth/logout', { method: 'POST' });
          } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
          } finally {
            // Déconnecter côté client quoi qu'il arrive
            authStore.logout();
            // Rediriger vers la page d'accueil
            router.push('/');
          }
        }
      }
    }
  };
});