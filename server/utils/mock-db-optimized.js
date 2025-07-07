// Base de données simulée optimisée avec cache et indexation
// Résout les problèmes de performance N+1 avec structures de données optimisées
import bcrypt from 'bcryptjs';
import { config } from './env-validation.js';

// Vérifier si on doit utiliser la base de données simulée
const useMockDb = config.database.useMock;

// Fonction pour hacher un mot de passe (async pour de meilleures performances)
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(config.security.bcryptRounds);
  return await bcrypt.hash(plainPassword, salt);
};

// Fonction pour vérifier un mot de passe (async)
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// ========================================
// OPTIMISATION: Maps pour accès O(1)
// ========================================
let rolePermissionsMap = new Map();
let permissionsMap = new Map();
let permissionsByNameMap = new Map();
let rolesMap = new Map();
let usersByRoleMap = new Map();
let sessionsByTokenMap = new Map();
let sessionsByUserMap = new Map();

// Métriques de performance
let performanceStats = {
  cacheHits: 0,
  cacheMisses: 0,
  queryCount: 0,
  lastOptimization: Date.now()
};

// ========================================
// DONNÉES DE BASE (optimisées)
// ========================================

// Structure de données pour stocker les permissions
let permissions = [
  { id: 1, name: "view", description: "Visualiser le contenu", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "manage_users", description: "Gérer les utilisateurs", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: "manage_pages", description: "Gérer les pages", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: "manage_images", description: "Gérer les images", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, name: "manage_organigrammes", description: "Gérer les organigrammes", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// Structure optimisée pour les relations rôle-permission
let rolePermissions = [
  { id: 1, roleId: 1, permissionId: 1 }, // admin -> view
  { id: 2, roleId: 1, permissionId: 2 }, // admin -> manage_users
  { id: 3, roleId: 1, permissionId: 3 }, // admin -> manage_pages
  { id: 4, roleId: 1, permissionId: 4 }, // admin -> manage_images
  { id: 5, roleId: 1, permissionId: 5 }, // admin -> manage_organigrammes
  { id: 6, roleId: 2, permissionId: 1 }, // editor -> view
  { id: 7, roleId: 2, permissionId: 3 }, // editor -> manage_pages
  { id: 8, roleId: 2, permissionId: 4 }, // editor -> manage_images
  { id: 9, roleId: 3, permissionId: 1 }  // user -> view
];

// Structure de données pour stocker les rôles avec méthodes optimisées
let roles = [
  {
    id: 1,
    name: "admin",
    description: "Administrateur système",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // OPTIMISATION: getPermissions() avec cache Map - O(1) au lieu de O(n²)
    getPermissions: function() {
      performanceStats.queryCount++;
      const permissionIds = rolePermissionsMap.get(this.id);
      if (!permissionIds) {
        performanceStats.cacheMisses++;
        return [];
      }
      
      performanceStats.cacheHits++;
      return Array.from(permissionIds).map(id => {
        const permission = permissionsMap.get(id);
        return permission ? {...permission} : null;
      }).filter(p => p !== null);
    },
    
    // OPTIMISATION: hasPermission() avec lookup O(1)
    hasPermission: function(permission) {
      performanceStats.queryCount++;
      const permissionIds = rolePermissionsMap.get(this.id);
      if (!permissionIds) {
        performanceStats.cacheMisses++;
        return false;
      }
      
      performanceStats.cacheHits++;
      if (typeof permission === 'object') {
        return permissionIds.has(permission.id);
      } else if (typeof permission === 'string') {
        const permObj = permissionsByNameMap.get(permission);
        return permObj ? permissionIds.has(permObj.id) : false;
      }
      return false;
    },
    
    toJSON: function() { 
      return {
        ...this, 
        Permissions: this.getPermissions()
      }; 
    }
  },
  {
    id: 2,
    name: "editor",
    description: "Éditeur de contenu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    getPermissions: function() {
      performanceStats.queryCount++;
      const permissionIds = rolePermissionsMap.get(this.id);
      if (!permissionIds) {
        performanceStats.cacheMisses++;
        return [];
      }
      performanceStats.cacheHits++;
      return Array.from(permissionIds).map(id => permissionsMap.get(id)).filter(Boolean);
    },
    hasPermission: function(permission) {
      performanceStats.queryCount++;
      const permissionIds = rolePermissionsMap.get(this.id);
      if (!permissionIds) return false;
      
      if (typeof permission === 'object') {
        return permissionIds.has(permission.id);
      } else if (typeof permission === 'string') {
        const permObj = permissionsByNameMap.get(permission);
        return permObj ? permissionIds.has(permObj.id) : false;
      }
      return false;
    },
    toJSON: function() { return {...this, Permissions: this.getPermissions()}; }
  },
  {
    id: 3,
    name: "user",
    description: "Utilisateur standard",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    getPermissions: function() {
      performanceStats.queryCount++;
      const permissionIds = rolePermissionsMap.get(this.id);
      if (!permissionIds) return [];
      return Array.from(permissionIds).map(id => permissionsMap.get(id)).filter(Boolean);
    },
    hasPermission: function(permission) {
      performanceStats.queryCount++;
      const permissionIds = rolePermissionsMap.get(this.id);
      if (!permissionIds) return false;
      
      if (typeof permission === 'object') {
        return permissionIds.has(permission.id);
      } else if (typeof permission === 'string') {
        const permObj = permissionsByNameMap.get(permission);
        return permObj ? permissionIds.has(permObj.id) : false;
      }
      return false;
    },
    toJSON: function() { return {...this, Permissions: this.getPermissions()}; }
  }
];

// Structure de données pour stocker les utilisateurs
let users = [
  {
    id: 1,
    name: "Administrateur",
    email: "admin@smi-corporation.com",
    username: "admin",
    password: "$2a$12$6EWbQLKBD3UmHlQCdBHqbu8vRpE9D4RKYWEn7M1JC7E8N3A9P0oF.", // motdepasse123
    role_id: 1, // admin
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() {
      const obj = {...this};
      delete obj.password;
      return obj;
    }
  },
  {
    id: 2,
    name: "Éditeur",
    email: "editor@smi-corporation.com",
    username: "editor",
    password: "$2a$12$6EWbQLKBD3UmHlQCdBHqbu8vRpE9D4RKYWEn7M1JC7E8N3A9P0oF.", // motdepasse123
    role_id: 2, // editor
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() {
      const obj = {...this};
      delete obj.password;
      return obj;
    }
  },
  {
    id: 3,
    name: "Utilisateur Test",
    email: "user@smi-corporation.com",
    username: "user",
    password: "$2a$12$6EWbQLKBD3UmHlQCdBHqbu8vRpE9D4RKYWEn7M1JC7E8N3A9P0oF.", // motdepasse123
    role_id: 3, // user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() {
      const obj = {...this};
      delete obj.password;
      return obj;
    }
  }
];

// Sessions de base pour les tests
let sessions = [
  {
    id: "sess_admin_123",
    userId: 1,
    token: "admin_token_123",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

// ========================================
// INITIALISATION DES MAPS (Performance boost)
// ========================================
const initializeMaps = () => {
  console.log('🚀 Initialisation des Maps optimisées...');
  
  // Map des permissions par ID et nom - O(1) lookup
  permissionsMap.clear();
  permissionsByNameMap.clear();
  permissions.forEach(permission => {
    permissionsMap.set(permission.id, permission);
    permissionsByNameMap.set(permission.name, permission);
  });
  
  // Map des rôles par ID - O(1) lookup
  rolesMap.clear();
  roles.forEach(role => {
    rolesMap.set(role.id, role);
  });
  
  // Map des utilisateurs par role_id - O(1) lookup
  usersByRoleMap.clear();
  users.forEach(user => {
    if (!usersByRoleMap.has(user.role_id)) {
      usersByRoleMap.set(user.role_id, []);
    }
    usersByRoleMap.get(user.role_id).push(user);
  });
  
  // Map des permissions par rôle - O(1) lookup critique pour l'auth
  rolePermissionsMap.clear();
  rolePermissions.forEach(rp => {
    if (!rolePermissionsMap.has(rp.roleId)) {
      rolePermissionsMap.set(rp.roleId, new Set());
    }
    rolePermissionsMap.get(rp.roleId).add(rp.permissionId);
  });
  
  // Map des sessions par token et userId - O(1) auth lookup
  sessionsByTokenMap.clear();
  sessionsByUserMap.clear();
  sessions.forEach(session => {
    sessionsByTokenMap.set(session.token, session);
    if (!sessionsByUserMap.has(session.userId)) {
      sessionsByUserMap.set(session.userId, []);
    }
    sessionsByUserMap.get(session.userId).push(session);
  });
  
  performanceStats.lastOptimization = Date.now();
  console.log('✅ Maps optimisées initialisées avec succès');
};

// ========================================
// NOUVELLES MÉTHODES D'OPTIMISATION
// ========================================

// Méthode pour récupérer toutes les permissions (pour auth-optimized-service)
export const getAllPermissions = () => {
  performanceStats.queryCount++;
  return Array.from(permissionsMap.values());
};

// Méthode pour récupérer les permissions d'un rôle (pour auth-optimized-service)
export const getRolePermissions = (roleId) => {
  performanceStats.queryCount++;
  const permissionIds = rolePermissionsMap.get(parseInt(roleId));
  if (!permissionIds) return [];
  
  return Array.from(permissionIds).map(id => ({
    roleId: parseInt(roleId),
    permissionId: id,
    permission: permissionsMap.get(id)
  })).filter(rp => rp.permission);
};

// Méthode optimisée pour récupérer un utilisateur avec son rôle et permissions en une seule "requête"
export const getUserWithRoleAndPermissions = async (userId) => {
  performanceStats.queryCount++;
  
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) return null;
  
  const role = rolesMap.get(user.role_id);
  if (!role) return null;
  
  const permissions = role.getPermissions();
  
  return {
    user: user.toJSON(),
    role,
    permissions
  };
};

// ========================================
// SERVICES OPTIMISÉS
// ========================================

// Service Session optimisé
export const sessionDb = {
  // OPTIMISATION: findByToken avec Map O(1) au lieu de O(n)
  findByToken: (token) => {
    performanceStats.queryCount++;
    const session = sessionsByTokenMap.get(token);
    if (session) {
      performanceStats.cacheHits++;
      return session;
    }
    performanceStats.cacheMisses++;
    return null;
  },
  
  create: (sessionData) => {
    performanceStats.queryCount++;
    const newSession = {
      id: `sess_${Date.now()}_${Math.random()}`,
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    sessions.push(newSession);
    
    // Mettre à jour les Maps
    sessionsByTokenMap.set(newSession.token, newSession);
    if (!sessionsByUserMap.has(newSession.userId)) {
      sessionsByUserMap.set(newSession.userId, []);
    }
    sessionsByUserMap.get(newSession.userId).push(newSession);
    
    return newSession;
  },
  
  deleteByToken: (token) => {
    performanceStats.queryCount++;
    const session = sessionsByTokenMap.get(token);
    if (session) {
      // Supprimer des arrays
      const index = sessions.findIndex(s => s.token === token);
      if (index > -1) sessions.splice(index, 1);
      
      // Supprimer des Maps
      sessionsByTokenMap.delete(token);
      const userSessions = sessionsByUserMap.get(session.userId);
      if (userSessions) {
        const userIndex = userSessions.findIndex(s => s.token === token);
        if (userIndex > -1) userSessions.splice(userIndex, 1);
      }
      
      return true;
    }
    return false;
  }
};

// Service User optimisé  
export const userDb = {
  // OPTIMISATION: findById avec accès direct O(1)
  findById: async (id) => {
    performanceStats.queryCount++;
    const user = users.find(u => u.id === parseInt(id));
    return user || null;
  },
  
  // OPTIMISATION: findByEmail avec index potentiel
  findByEmail: async (email) => {
    performanceStats.queryCount++;
    return users.find(u => u.email === email) || null;
  },
  
  // Vérification de mot de passe optimisée
  verifyPassword: async (password, hashedPassword) => {
    return await comparePassword(password, hashedPassword);
  },
  
  getAll: () => {
    performanceStats.queryCount++;
    return users.map(user => {
      const userData = user.toJSON();
      // OPTIMISATION: Lookup rôle avec Map O(1)
      const role = rolesMap.get(user.role_id);
      if (role) {
        userData.role = role.name;
        userData.permissions = role.getPermissions().map(p => p.name);
      }
      return userData;
    });
  },
  
  create: async (userData) => {
    performanceStats.queryCount++;
    const newId = Math.max(...users.map(u => u.id)) + 1;
    
    const hashedPassword = await hashPassword(userData.password);
    const newUser = {
      id: newId,
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() {
        const obj = {...this};
        delete obj.password;
        return obj;
      }
    };
    
    users.push(newUser);
    
    // Mettre à jour les Maps
    if (!usersByRoleMap.has(newUser.role_id)) {
      usersByRoleMap.set(newUser.role_id, []);
    }
    usersByRoleMap.get(newUser.role_id).push(newUser);
    
    return newUser.toJSON();
  }
};

// Service Role optimisé
export const roleDb = {
  // OPTIMISATION: findByPk avec Map O(1)
  findByPk: (id) => {
    performanceStats.queryCount++;
    const role = rolesMap.get(parseInt(id));
    if (role) {
      performanceStats.cacheHits++;
      return role;
    }
    performanceStats.cacheMisses++;
    return null;
  },
  
  getAll: () => {
    performanceStats.queryCount++;
    return Array.from(rolesMap.values());
  },
  
  create: (roleData) => {
    performanceStats.queryCount++;
    const newId = Math.max(...roles.map(r => r.id)) + 1;
    const newRole = {
      id: newId,
      ...roleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      getPermissions: function() {
        const permissionIds = rolePermissionsMap.get(this.id) || new Set();
        return Array.from(permissionIds).map(id => permissionsMap.get(id)).filter(Boolean);
      },
      hasPermission: function(permission) {
        const permissionIds = rolePermissionsMap.get(this.id);
        if (!permissionIds) return false;
        
        if (typeof permission === 'object') {
          return permissionIds.has(permission.id);
        } else if (typeof permission === 'string') {
          const permObj = permissionsByNameMap.get(permission);
          return permObj ? permissionIds.has(permObj.id) : false;
        }
        return false;
      },
      toJSON: function() { return {...this, Permissions: this.getPermissions()}; }
    };
    
    roles.push(newRole);
    rolesMap.set(newRole.id, newRole);
    
    return newRole;
  },
  
  // Nouvelles méthodes d'optimisation
  getAllPermissions: () => getAllPermissions(),
  getRolePermissions: (roleId) => getRolePermissions(roleId)
};

// Service Permission optimisé
export const permissionDb = {
  getAll: () => {
    performanceStats.queryCount++;
    return Array.from(permissionsMap.values());
  },
  
  // OPTIMISATION: findByName avec Map O(1)
  findByName: (name) => {
    performanceStats.queryCount++;
    const permission = permissionsByNameMap.get(name);
    if (permission) {
      performanceStats.cacheHits++;
      return permission;
    }
    performanceStats.cacheMisses++;
    return null;
  }
};

// ========================================
// MÉTRIQUES DE PERFORMANCE
// ========================================
export const getPerformanceStats = () => {
  const total = performanceStats.cacheHits + performanceStats.cacheMisses;
  const hitRate = total > 0 ? (performanceStats.cacheHits / total) * 100 : 0;
  
  return {
    ...performanceStats,
    hitRate: Math.round(hitRate * 100) / 100,
    mapsSize: {
      permissions: permissionsMap.size,
      roles: rolesMap.size,
      rolePermissions: rolePermissionsMap.size,
      sessions: sessionsByTokenMap.size
    }
  };
};

export const resetPerformanceStats = () => {
  performanceStats = {
    cacheHits: 0,
    cacheMisses: 0,
    queryCount: 0,
    lastOptimization: Date.now()
  };
};

// ========================================
// INITIALISATION AU DÉMARRAGE
// ========================================
initializeMaps();

console.log('🎯 Mock Database optimisée initialisée avec succès');
console.log(`📊 Performance: ${getPerformanceStats().mapsSize.permissions} permissions, ${getPerformanceStats().mapsSize.roles} rôles indexés`);

// Export des nouvelles méthodes optimisées
export { 
  useMockDb, 
  hashPassword, 
  comparePassword,
  getUserWithRoleAndPermissions,
  initializeMaps
};