// Base de données simulée en mémoire pour le développement
// Ce fichier sert uniquement pendant le développement en l'absence de base de données réelle
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

// Structure de données pour stocker les rôles
let roles = [
  {
    id: 1,
    name: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this, Permissions: this.getPermissions()}; }
  },
  {
    id: 2,
    name: "editor",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this, Permissions: this.getPermissions()}; }
  },
  {
    id: 3,
    name: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this, Permissions: this.getPermissions()}; }
  }
];

// Structure de données pour stocker les permissions
let permissions = [
  {
    id: 1,
    name: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 2,
    name: "edit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 3,
    name: "view",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 4,
    name: "manage_users",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 5,
    name: "manage_roles",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 6,
    name: "manage_permissions",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 7,
    name: "manage_user_roles",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 8,
    name: "view_audit_logs",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 9,
    name: "manage_content",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 10,
    name: "manage_media",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 11,
    name: "manage_organigrammes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  }
];

// Table de jointure pour les rôles et permissions
let rolePermissions = [
  // Admin - toutes les permissions
  { roleId: 1, permissionId: 1 },  // admin a la permission admin
  { roleId: 1, permissionId: 2 },  // admin a la permission edit
  { roleId: 1, permissionId: 3 },  // admin a la permission view
  { roleId: 1, permissionId: 4 },  // admin a la permission manage_users
  { roleId: 1, permissionId: 5 },  // admin a la permission manage_roles
  { roleId: 1, permissionId: 6 },  // admin a la permission manage_permissions
  { roleId: 1, permissionId: 7 },  // admin a la permission manage_user_roles
  { roleId: 1, permissionId: 8 },  // admin a la permission view_audit_logs
  { roleId: 1, permissionId: 9 },  // admin a la permission manage_content
  { roleId: 1, permissionId: 10 }, // admin a la permission manage_media
  { roleId: 1, permissionId: 11 }, // admin a la permission manage_organigrammes
  
  // Editor - permissions d'édition et gestion de contenu
  { roleId: 2, permissionId: 2 },  // editor a la permission edit
  { roleId: 2, permissionId: 3 },  // editor a la permission view
  { roleId: 2, permissionId: 9 },  // editor a la permission manage_content
  { roleId: 2, permissionId: 10 }, // editor a la permission manage_media
  { roleId: 2, permissionId: 11 }, // editor a la permission manage_organigrammes
  
  // User - permission de lecture seulement
  { roleId: 3, permissionId: 3 },  // user a la permission view
];

// Ajouter des méthodes aux rôles
roles.forEach(role => {
  role.getPermissions = function() {
    const rolePerms = rolePermissions.filter(rp => rp.roleId === this.id);
    return rolePerms.map(rp => {
      const permission = permissions.find(p => p.id === rp.permissionId);
      return permission ? {...permission} : null;
    }).filter(p => p !== null);
  };
  
  role.hasPermission = function(permission) {
    if (typeof permission === 'object') {
      return rolePermissions.some(rp => rp.roleId === this.id && rp.permissionId === permission.id);
    } else if (typeof permission === 'string') {
      const permObj = permissions.find(p => p.name === permission);
      return permObj ? this.hasPermission(permObj) : false;
    }
    return false;
  };
  
  role.addPermission = function(permission) {
    if (!this.hasPermission(permission)) {
      rolePermissions.push({ roleId: this.id, permissionId: permission.id });
      return true;
    }
    return false;
  };
  
  role.removePermission = function(permission) {
    const index = rolePermissions.findIndex(
      rp => rp.roleId === this.id && rp.permissionId === permission.id
    );
    if (index !== -1) {
      rolePermissions.splice(index, 1);
      return true;
    }
    return false;
  };
  
  role.getUsers = function() {
    return users.filter(user => user.role_id === this.id);
  };
});

// Structure de données pour stocker les utilisateurs (sera initialisée de manière asynchrone)
let users = [];

// Fonction d'initialisation asynchrone pour les utilisateurs
const initializeUsers = async () => {
  if (users.length > 0) return; // Déjà initialisé
  
  const adminHashedPassword = await hashPassword('admin123');
  const editorHashedPassword = await hashPassword('editeur123');
  const userHashedPassword = await hashPassword('user123');
  
  users = [
    {
      id: 1,
      email: "admin@exemple.fr",
      name: "Administrateur",
      username: "admin",
      password: adminHashedPassword,
      role_id: 1, // Admin role
      status: "active",
      lastLogin: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Il y a 1 heure
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() {
        const { password, ...userWithoutPassword } = this;
        const role = roles.find(r => r.id === this.role_id);
        return { ...userWithoutPassword, Role: role };
      }
    },
    {
      id: 2,
      email: "editeur@exemple.fr",
      name: "Éditeur",
      username: "editeur",
      password: editorHashedPassword,
      role_id: 2, // Editor role
      status: "active",
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Il y a 1 jour
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() {
        const { password, ...userWithoutPassword } = this;
        const role = roles.find(r => r.id === this.role_id);
        return { ...userWithoutPassword, Role: role };
      }
    },
    {
      id: 3,
      email: "utilisateur@exemple.fr",
      name: "Utilisateur",
      username: "user",
      password: userHashedPassword,
      role_id: 3, // User role
      status: "active",
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() {
        const { password, ...userWithoutPassword } = this;
        const role = roles.find(r => r.id === this.role_id);
        return { ...userWithoutPassword, Role: role };
      }
    }
  ];
  
  console.log("Mock users initialized with hashed passwords");
};

// Structure pour stocker les pages
let pages = [
  {
    id: 1,
    title: "Accueil",
    content: "Bienvenue sur le site de SMI Corporation",
    slug: "accueil",
    status: "published",
    parentId: null,
    level: 0,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 2,
    title: "À propos",
    content: "À propos de SMI Corporation",
    slug: "a-propos",
    status: "published",
    parentId: null,
    level: 0,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 3,
    title: "Services",
    content: "Nos services",
    slug: "services",
    status: "published",
    parentId: null,
    level: 0,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  }
];

// Structure pour stocker les sessions avec expiration
let sessions = {};

// Structure pour journaliser les actions
let auditLogs = [];

// Note: Pas d'importation directe des modèles pour éviter les références circulaires
console.log("Mock DB initialisé en mode", useMockDb ? "simulation" : "compatibilité");

// Fonctions pour manipuler les utilisateurs
export const userDb = {
  findByEmail: async (email) => {
    await initializeUsers();
    return users.find(user => user.email === email);
  },
  
  findById: async (id) => {
    await initializeUsers();
    return users.find(user => user.id === parseInt(id));
  },
  
  create: (userData) => {
    // Hacher le mot de passe avant de le stocker
    const hashedPassword = hashPassword(userData.password);
    
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    const newUser = {
      id: newId,
      ...userData,
      password: hashedPassword, // Remplacer par le mot de passe haché
      role_id: userData.role_id || 3, // Rôle par défaut: user
      status: userData.status || "active", // Statut par défaut: active
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() {
        const { password, ...userWithoutPassword } = this;
        const role = roles.find(r => r.id === this.role_id);
        return { ...userWithoutPassword, Role: role };
      }
    };
    users.push(newUser);
    return newUser;
  },
  
  update: (id, userData) => {
    const index = users.findIndex(user => user.id === parseInt(id));
    if (index !== -1) {
      // Si le mot de passe est fourni, le hacher
      if (userData.password) {
        userData.password = hashPassword(userData.password);
      }
      
      users[index] = {
        ...users[index],
        ...userData,
        updatedAt: new Date().toISOString()
      };
      return users[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = users.findIndex(user => user.id === parseInt(id));
    if (index !== -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  },
  
  getAll: (options = {}) => {
    let result = [...users];
    
    // Filtrer selon les options
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(user => user[key] === value);
      });
    }
    
    // Pagination
    if (options.limit && options.offset) {
      const start = options.offset;
      const end = start + options.limit;
      result = result.slice(start, end);
    }
    
    return result.map(user => {
      // Ne jamais renvoyer les mots de passe
      const { password, ...userWithoutPassword } = user;
      // Ajouter le rôle de l'utilisateur
      const role = roles.find(r => r.id === user.role_id);
      return { ...userWithoutPassword, Role: role };
    });
  },
  
  findAndCountAll: (options = {}) => {
    const rows = userDb.getAll(options);
    return {
      count: rows.length,
      rows
    };
  },
  
  // Fonction de vérification de mot de passe
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await comparePassword(plainPassword, hashedPassword);
  }
};

// Fonctions pour gérer les rôles
export const roleDb = {
  findAll: (options = {}) => {
    let result = [...roles];
    
    // Inclure les permissions si demandé
    if (options.include) {
      const includePermissions = options.include.some(inc => 
        inc.model && inc.model.name === 'Permission'
      );
      
      if (includePermissions) {
        // Les permissions sont déjà incluses via la méthode toJSON
      }
    }
    
    return result;
  },
  
  findByPk: (id, options = {}) => {
    const role = roles.find(r => r.id === parseInt(id));
    if (!role) return null;
    
    return role;
  },
  
  findOne: (options = {}) => {
    if (options.where) {
      if (options.where.name) {
        return roles.find(role => role.name === options.where.name);
      }
      if (options.where.id) {
        return roles.find(role => role.id === options.where.id);
      }
    }
    return null;
  },
  
  create: (data) => {
    const newId = roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1;
    
    const newRole = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() { return {...this, Permissions: this.getPermissions()}; },
      getPermissions: function() {
        const rolePerms = rolePermissions.filter(rp => rp.roleId === this.id);
        return rolePerms.map(rp => {
          const permission = permissions.find(p => p.id === rp.permissionId);
          return permission ? {...permission} : null;
        }).filter(p => p !== null);
      },
      hasPermission: function(permission) {
        if (typeof permission === 'object') {
          return rolePermissions.some(rp => rp.roleId === this.id && rp.permissionId === permission.id);
        } else if (typeof permission === 'string') {
          const permObj = permissions.find(p => p.name === permission);
          return permObj ? this.hasPermission(permObj) : false;
        }
        return false;
      },
      addPermission: function(permission) {
        if (!this.hasPermission(permission)) {
          rolePermissions.push({ roleId: this.id, permissionId: permission.id });
          return true;
        }
        return false;
      },
      removePermission: function(permission) {
        const index = rolePermissions.findIndex(
          rp => rp.roleId === this.id && rp.permissionId === permission.id
        );
        if (index !== -1) {
          rolePermissions.splice(index, 1);
          return true;
        }
        return false;
      },
      getUsers: function() {
        return users.filter(user => user.role_id === this.id);
      }
    };
    
    roles.push(newRole);
    return newRole;
  },
  
  update: (id, data) => {
    const index = roles.findIndex(role => role.id === parseInt(id));
    if (index !== -1) {
      roles[index] = {
        ...roles[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return roles[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = roles.findIndex(role => role.id === parseInt(id));
    if (index !== -1) {
      // Vérifier si le rôle est utilisé par des utilisateurs
      const usersWithRole = users.filter(user => user.role_id === parseInt(id));
      if (usersWithRole.length > 0) {
        return false; // Ne pas supprimer si utilisé
      }
      
      // Supprimer les relations avec les permissions
      const rolePermsToRemove = rolePermissions.filter(rp => rp.roleId === parseInt(id));
      rolePermsToRemove.forEach(rp => {
        const index = rolePermissions.indexOf(rp);
        if (index !== -1) {
          rolePermissions.splice(index, 1);
        }
      });
      
      // Supprimer le rôle
      roles.splice(index, 1);
      return true;
    }
    return false;
  }
};

// Fonctions pour gérer les permissions
export const permissionDb = {
  findAll: () => {
    return [...permissions];
  },
  
  findByPk: (id) => {
    return permissions.find(p => p.id === parseInt(id));
  },
  
  findOne: (options = {}) => {
    if (options.where) {
      if (options.where.name) {
        return permissions.find(permission => permission.name === options.where.name);
      }
      if (options.where.id) {
        return permissions.find(permission => permission.id === options.where.id);
      }
    }
    return null;
  },
  
  create: (data) => {
    const newId = permissions.length > 0 ? Math.max(...permissions.map(p => p.id)) + 1 : 1;
    
    const newPermission = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() { return {...this}; }
    };
    
    permissions.push(newPermission);
    return newPermission;
  },
  
  update: (id, data) => {
    const index = permissions.findIndex(permission => permission.id === parseInt(id));
    if (index !== -1) {
      permissions[index] = {
        ...permissions[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return permissions[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = permissions.findIndex(permission => permission.id === parseInt(id));
    if (index !== -1) {
      // Vérifier si la permission est utilisée par des rôles
      const rolesWithPermission = rolePermissions.filter(rp => rp.permissionId === parseInt(id));
      if (rolesWithPermission.length > 0) {
        return false; // Ne pas supprimer si utilisée
      }
      
      // Supprimer la permission
      permissions.splice(index, 1);
      return true;
    }
    return false;
  }
};

// Fonctions pour gérer les sessions avec expiration
export const sessionDb = {
  create: (userId, token, expiresIn = 604800000) => { // 1 semaine par défaut
    const expiresAt = new Date(Date.now() + expiresIn);
    
    sessions[token] = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    return token;
  },
  
  findByToken: (token) => {
    const session = sessions[token];
    if (!session) return null;
    
    // Vérifier si la session a expiré
    if (new Date(session.expiresAt) < new Date()) {
      delete sessions[token];
      return null;
    }
    
    return session;
  },
  
  delete: (token) => {
    if (sessions[token]) {
      delete sessions[token];
      return true;
    }
    return false;
  },
  
  deleteAllForUser: (userId) => {
    let count = 0;
    Object.entries(sessions).forEach(([token, session]) => {
      if (session.userId === userId) {
        delete sessions[token];
        count++;
      }
    });
    return count;
  }
};

// Fonctions pour gérer les logs d'audit
export const auditDb = {
  log: (action, entityType, entityId, userId, details = {}) => {
    const logEntry = {
      id: auditLogs.length + 1,
      action,
      entityType,
      entityId,
      userId,
      details,
      timestamp: new Date().toISOString()
    };
    auditLogs.push(logEntry);
    return logEntry;
  },
  
  findAll: (options = {}) => {
    let result = [...auditLogs];
    
    // Filtrer selon les options
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        result = result.filter(log => log[key] === value);
      });
    }
    
    // Tri par date, plus récent en premier
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    if (options.limit && options.offset) {
      const start = options.offset;
      const end = start + options.limit;
      result = result.slice(start, end);
    }
    
    return result;
  }
};

// Fonctions pour manipuler les pages
export const pageDb = {
  findAll: (options = {}) => {
    let result = [...pages];
    
    // Filtrer selon les options
    if (options.where) {
      if (options.where.status) {
        result = result.filter(page => page.status === options.where.status);
      }
      if (options.where.parentId) {
        result = result.filter(page => page.parentId === options.where.parentId);
      }
    }
    
    // Trier selon les options
    if (options.order) {
      // Simple tri par ordre ascendant
      result.sort((a, b) => a.order - b.order);
    }
    
    // Pagination
    if (options.limit && options.offset) {
      const start = options.offset;
      const end = start + options.limit;
      result = result.slice(start, end);
    }
    
    return result;
  },
  
  findOne: (options = {}) => {
    if (options.where) {
      if (options.where.slug) {
        return pages.find(page => page.slug === options.where.slug);
      }
      if (options.where.id) {
        return pages.find(page => page.id === options.where.id);
      }
    }
    return null;
  },
  
  findByPk: (id) => {
    return pages.find(page => page.id === parseInt(id));
  },
  
  findAndCountAll: (options = {}) => {
    const rows = pageDb.findAll(options);
    return {
      count: rows.length,
      rows
    };
  },
  
  create: (data) => {
    const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
    
    const newPage = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() { return {...this}; }
    };
    pages.push(newPage);
    return newPage;
  },
  
  update: (id, data) => {
    const index = pages.findIndex(page => page.id === parseInt(id));
    if (index !== -1) {
      pages[index] = {
        ...pages[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return pages[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = pages.findIndex(page => page.id === parseInt(id));
    if (index !== -1) {
      pages.splice(index, 1);
      return true;
    }
    return false;
  },
  
  max: (field, options = {}) => {
    let filteredPages = [...pages];
    
    if (options.where) {
      if (options.where.parentId !== undefined) {
        filteredPages = filteredPages.filter(page => {
          if (options.where.parentId === null) {
            return page.parentId === null;
          }
          return page.parentId === options.where.parentId;
        });
      }
    }
    
    if (filteredPages.length === 0) return 0;
    
    // Trouver la valeur maximale
    let maxValue = filteredPages[0][field] || 0;
    for (const page of filteredPages) {
      if (page[field] > maxValue) {
        maxValue = page[field];
      }
    }
    
    return maxValue;
  }
};

// === ORGANIGRAMMES ===
let organigrammes = [
  {
    id: 1,
    title: "Direction Générale",
    description: "Structure organisationnelle de la direction générale de SMI Corporation",
    slug: "direction-generale",
    status: "published",
    userId: 1, // Admin user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 2,
    title: "Département IT",
    description: "Organigramme du département informatique",
    slug: "departement-it",
    status: "published",
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 3,
    title: "Équipe Marketing",
    description: "Structure de l'équipe marketing et communication",
    slug: "equipe-marketing",
    status: "draft",
    userId: 2, // Editor user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  }
];

export const organigrammeDb = {
  findAll: (options = {}) => {
    let result = [...organigrammes];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        result = result.filter(org => org[key] === options.where[key]);
      });
    }
    
    if (options.order) {
      // Simple ordering support
      result.sort((a, b) => {
        for (let [field, direction] of options.order) {
          if (a[field] < b[field]) return direction === 'ASC' ? -1 : 1;
          if (a[field] > b[field]) return direction === 'ASC' ? 1 : -1;
        }
        return 0;
      });
    }
    
    if (options.limit) {
      const offset = options.offset || 0;
      result = result.slice(offset, offset + options.limit);
    }
    
    return result;
  },
  
  findOne: (options = {}) => {
    if (options.where) {
      return organigrammes.find(org => {
        return Object.keys(options.where).every(key => 
          org[key] === options.where[key]
        );
      }) || null;
    }
    return organigrammes[0] || null;
  },
  
  findByPk: (id) => {
    return organigrammes.find(org => org.id === parseInt(id)) || null;
  },
  
  create: (data) => {
    const newId = organigrammes.length > 0 ? Math.max(...organigrammes.map(o => o.id)) + 1 : 1;
    
    const newOrganigramme = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() { return {...this}; }
    };
    organigrammes.push(newOrganigramme);
    return newOrganigramme;
  },
  
  update: (id, data) => {
    const index = organigrammes.findIndex(org => org.id === parseInt(id));
    if (index !== -1) {
      organigrammes[index] = {
        ...organigrammes[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return organigrammes[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = organigrammes.findIndex(org => org.id === parseInt(id));
    if (index !== -1) {
      organigrammes.splice(index, 1);
      return true;
    }
    return false;
  }
};

// === EMPLOYÉS ===
let employees = [
  // Direction Générale (organigramme 1)
  {
    id: 1,
    name: "Marie Dubois",
    position: "Directrice Générale",
    email: "marie.dubois@smi-corp.fr",
    phone: "01 23 45 67 89",
    parentId: null,
    organigrammeId: 1,
    level: 0,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 2,
    name: "Pierre Martin",
    position: "Directeur des Opérations",
    email: "pierre.martin@smi-corp.fr",
    phone: "01 23 45 67 90",
    parentId: 1,
    organigrammeId: 1,
    level: 1,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 3,
    name: "Sophie Laurent",
    position: "Directrice des Ressources Humaines",
    email: "sophie.laurent@smi-corp.fr",
    phone: "01 23 45 67 91",
    parentId: 1,
    organigrammeId: 1,
    level: 1,
    orderIndex: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 4,
    name: "Thomas Leroy",
    position: "Responsable Production",
    email: "thomas.leroy@smi-corp.fr",
    phone: "01 23 45 67 92",
    parentId: 2,
    organigrammeId: 1,
    level: 2,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 5,
    name: "Julie Moreau",
    position: "Responsable Qualité",
    email: "julie.moreau@smi-corp.fr",
    phone: "01 23 45 67 93",
    parentId: 2,
    organigrammeId: 1,
    level: 2,
    orderIndex: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },

  // Département IT (organigramme 2)
  {
    id: 6,
    name: "Alexandre Rousseau",
    position: "Directeur Technique",
    email: "alexandre.rousseau@smi-corp.fr",
    phone: "01 23 45 67 94",
    parentId: null,
    organigrammeId: 2,
    level: 0,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 7,
    name: "Sarah Dupond",
    position: "Lead Developer Frontend",
    email: "sarah.dupond@smi-corp.fr",
    phone: "01 23 45 67 95",
    parentId: 6,
    organigrammeId: 2,
    level: 1,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 8,
    name: "Kevin Bernard",
    position: "Lead Developer Backend",
    email: "kevin.bernard@smi-corp.fr",
    phone: "01 23 45 67 96",
    parentId: 6,
    organigrammeId: 2,
    level: 1,
    orderIndex: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 9,
    name: "Emma Garcia",
    position: "DevOps Engineer",
    email: "emma.garcia@smi-corp.fr",
    phone: "01 23 45 67 97",
    parentId: 6,
    organigrammeId: 2,
    level: 1,
    orderIndex: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },

  // Équipe Marketing (organigramme 3)
  {
    id: 10,
    name: "Nathalie Lefebvre",
    position: "Directrice Marketing",
    email: "nathalie.lefebvre@smi-corp.fr",
    phone: "01 23 45 67 98",
    parentId: null,
    organigrammeId: 3,
    level: 0,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 11,
    name: "David Roux",
    position: "Responsable Communication",
    email: "david.roux@smi-corp.fr",
    phone: "01 23 45 67 99",
    parentId: 10,
    organigrammeId: 3,
    level: 1,
    orderIndex: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 12,
    name: "Lisa Petit",
    position: "Responsable Digital",
    email: "lisa.petit@smi-corp.fr",
    phone: "01 23 45 68 00",
    parentId: 10,
    organigrammeId: 3,
    level: 1,
    orderIndex: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  }
];

export const employeeDb = {
  findAll: (options = {}) => {
    let result = [...employees];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        result = result.filter(emp => emp[key] === options.where[key]);
      });
    }
    
    if (options.order) {
      // Simple ordering support
      result.sort((a, b) => {
        for (let [field, direction] of options.order) {
          if (a[field] < b[field]) return direction === 'ASC' ? -1 : 1;
          if (a[field] > b[field]) return direction === 'ASC' ? 1 : -1;
        }
        return 0;
      });
    }
    
    if (options.limit) {
      const offset = options.offset || 0;
      result = result.slice(offset, offset + options.limit);
    }
    
    return result;
  },
  
  findOne: (options = {}) => {
    if (options.where) {
      return employees.find(emp => {
        return Object.keys(options.where).every(key => 
          emp[key] === options.where[key]
        );
      }) || null;
    }
    return employees[0] || null;
  },
  
  findByPk: (id) => {
    return employees.find(emp => emp.id === parseInt(id)) || null;
  },
  
  create: (data) => {
    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    
    const newEmployee = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() { return {...this}; }
    };
    employees.push(newEmployee);
    return newEmployee;
  },
  
  update: (id, data) => {
    const index = employees.findIndex(emp => emp.id === parseInt(id));
    if (index !== -1) {
      employees[index] = {
        ...employees[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return employees[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = employees.findIndex(emp => emp.id === parseInt(id));
    if (index !== -1) {
      employees.splice(index, 1);
      return true;
    }
    return false;
  }
};

// Structure de données pour stocker les images
let images = [
  {
    id: 1,
    filename: "logo-smi.jpg",
    originalName: "logo-smi-corporation.jpg",
    url: "/uploads/images/logo-smi.jpg",
    mimeType: "image/jpeg",
    size: 45678,
    width: 800,
    height: 600,
    alt: "Logo SMI Corporation",
    caption: "Logo officiel de SMI Corporation",
    userId: 1,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 2,
    filename: "banner-accueil.jpg",
    originalName: "banner-accueil-smi.jpg",
    url: "/uploads/images/banner-accueil.jpg",
    mimeType: "image/jpeg",
    size: 123456,
    width: 1920,
    height: 1080,
    alt: "Bannière page d'accueil",
    caption: "Image de bannière pour la page d'accueil",
    userId: 1,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  },
  {
    id: 3,
    filename: "equipe-direction.jpg",
    originalName: "photo-equipe-direction.jpg",
    url: "/uploads/images/equipe-direction.jpg",
    mimeType: "image/jpeg",
    size: 89012,
    width: 1200,
    height: 800,
    alt: "Équipe de direction",
    caption: "Photo de l'équipe de direction SMI Corporation",
    userId: 2,
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return {...this}; }
  }
];

export const imageDb = {
  findAll: async (options = {}) => {
    let result = [...images];
    
    // Filtrage par where
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        const value = options.where[key];
        result = result.filter(img => {
          if (typeof value === 'object' && value.length) {
            // Gérer les tableaux (IN clause)
            return value.includes(img[key]);
          }
          return img[key] === value;
        });
      });
    }
    
    // Pagination
    if (options.offset) {
      result = result.slice(options.offset);
    }
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  },
  
  findOne: async (options = {}) => {
    if (options.where) {
      return images.find(img => {
        return Object.keys(options.where).every(key => 
          img[key] === options.where[key]
        );
      }) || null;
    }
    return images[0] || null;
  },
  
  findByPk: async (id) => {
    return images.find(img => img.id === parseInt(id)) || null;
  },
  
  findAndCountAll: async (options = {}) => {
    const allResults = await imageDb.findAll({ where: options.where });
    const count = allResults.length;
    
    let result = allResults;
    if (options.offset) {
      result = result.slice(options.offset);
    }
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return { count, rows: result };
  },
  
  create: async (data) => {
    const newImage = {
      id: Math.max(...images.map(img => img.id), 0) + 1,
      filename: data.filename,
      originalName: data.originalName,
      url: data.url || `/uploads/images/${data.filename}`,
      mimeType: data.mimeType,
      size: data.size || 0,
      width: data.width || 0,
      height: data.height || 0,
      alt: data.alt || '',
      caption: data.caption || '',
      userId: data.userId || 1,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toJSON: function() { return {...this}; }
    };
    images.push(newImage);
    return newImage;
  },
  
  update: (id, data) => {
    const index = images.findIndex(img => img.id === parseInt(id));
    if (index !== -1) {
      images[index] = {
        ...images[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return images[index];
    }
    return null;
  },
  
  destroy: (id) => {
    const index = images.findIndex(img => img.id === parseInt(id));
    if (index !== -1) {
      images.splice(index, 1);
      return true;
    }
    return false;
  },
  
  max: async (field, options = {}) => {
    if (images.length === 0) return 0;
    return Math.max(...images.map(img => img[field] || 0));
  }
};