import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isAuthenticated: false,
    user: null,
    token: null,
    role: null,
    permissions: [],
    tokenExpiry: null
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
    // Connecter l'utilisateur
    login(userData) {
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
      
      // Persister les données dans le localStorage
      this.persistAuth();
    },
    
    // Déconnecter l'utilisateur
    logout() {
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      this.role = null;
      this.permissions = [];
      this.tokenExpiry = null;
      
      // Supprimer les données du localStorage (côté client uniquement)
      if (import.meta.client && window.localStorage) {
        localStorage.removeItem('auth');
      }
    },
    
    // Mettre à jour les données utilisateur
    updateUser(userData) {
      this.user = { ...this.user, ...userData };
      this.persistAuth();
    },
    
    // Persister les données d'authentification dans le localStorage
    persistAuth() {
      const authData = {
        isAuthenticated: this.isAuthenticated,
        user: this.user,
        token: this.token,
        role: this.role,
        permissions: this.permissions,
        tokenExpiry: this.tokenExpiry
      };
      
      // Sauvegarder dans localStorage (côté client uniquement)
      if (import.meta.client && window.localStorage) {
        localStorage.setItem('auth', JSON.stringify(authData));
      }
    },
    
    // Charger les données d'authentification depuis le localStorage
    loadAuth() {
      // Vérifier si on est côté client (où localStorage est disponible)
      if (import.meta.client && window.localStorage) {
        const authData = localStorage.getItem('auth');
        if (!authData) return;
        
        const parsedData = JSON.parse(authData);
        
        // Vérifier si le token est expiré
        if (parsedData.tokenExpiry) {
          const expiryDate = new Date(parsedData.tokenExpiry);
          if (expiryDate <= new Date()) {
            // Token expiré, supprimer les données
            localStorage.removeItem('auth');
            return;
          }
        }
        
        // Charger les données
        this.isAuthenticated = parsedData.isAuthenticated;
        this.user = parsedData.user;
        this.token = parsedData.token;
        this.role = parsedData.role;
        this.permissions = parsedData.permissions;
        this.tokenExpiry = parsedData.tokenExpiry;
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
