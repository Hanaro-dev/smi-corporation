import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isAuthenticated: false,
    user: null,
    token: null,
    role: null,
    permissions: [],
    tokenExpiry: null,
    loading: false,
    error: null
  }),
  
  getters: {
    // Récupérer le nom d'utilisateur
    username: (state) => state.user?.name || state.user?.username || 'Utilisateur',
    
    // Vérifier si l'utilisateur est admin
    isAdmin: (state) => state.role === 'admin',
    
    // Vérifier si l'utilisateur a un rôle spécifique
    hasRole: (state) => (roleName) => state.role === roleName,
    
    // Vérifier si l'utilisateur a une permission spécifique
    hasPermission: (state) => (permissionName) => {
      if (state.role === 'admin') return true;
      return state.permissions.includes(permissionName);
    },
    
    // Vérifier si l'utilisateur a au moins une des permissions spécifiées
    hasAnyPermission: (state) => (permissionNames) => {
      if (state.role === 'admin') return true;
      return permissionNames.some(permission => state.permissions.includes(permission));
    },
    
    // Vérifier si le token est expiré
    isTokenExpired: (state) => {
      if (!state.tokenExpiry) return true;
      return new Date() > new Date(state.tokenExpiry);
    }
  },
  
  actions: {
    // Connecter l'utilisateur avec gestion d'erreur
    login(userData) {
      try {
        this.error = null;
        this.loading = false;
        this.isAuthenticated = true;
        this.user = userData.user;
        this.token = userData.token;
        this.role = userData.user.Role?.name || null;
        this.permissions = userData.user.Role?.Permissions?.map(p => p.name) || [];
        
        // Calculer la date d'expiration du token
        if (userData.expiresIn) {
          const expiryDate = new Date();
          expiryDate.setSeconds(expiryDate.getSeconds() + userData.expiresIn);
          this.tokenExpiry = expiryDate.toISOString();
        }
        
        // Note: Token is stored securely in httpOnly cookie, no localStorage needed
        
        return true;
      } catch (error) {
        this.error = 'Erreur lors de la connexion';
        console.error('Login error:', error);
        return false;
      }
    },
    
    // Déconnecter l'utilisateur avec nettoyage complet
    logout() {
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      this.role = null;
      this.permissions = [];
      this.tokenExpiry = null;
      this.loading = false;
      this.error = null;
      
      // Note: Token is removed via API call to logout endpoint
    },
    
    // Mettre à jour les données utilisateur
    updateUser(userData) {
      this.user = { ...this.user, ...userData };
    },
    
    // Initialize auth state from server session
    async initializeFromSession() {
      try {
        const { data } = await $fetch('/api/_auth/session');
        
        if (data && data.user) {
          this.isAuthenticated = true;
          this.user = data.user;
          this.role = data.user.Role?.name || null;
          this.permissions = data.user.Role?.Permissions?.map(p => p.name) || [];
          this.error = null;
          return true;
        } else {
          this.logout();
          return false;
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        this.logout();
        return false;
      }
    },
    
    // Vérifier si l'utilisateur peut accéder à une ressource
    canAccess(requiredPermissions) {
      // Admin peut tout faire
      if (this.role === 'admin') return true;
      
      // Si c'est un tableau de permissions, vérifier si l'utilisateur a au moins une
      if (Array.isArray(requiredPermissions)) {
        return requiredPermissions.some(perm => this.permissions.includes(perm));
      }
      
      // Si c'est une permission unique
      return this.permissions.includes(requiredPermissions);
    }
  }
});
