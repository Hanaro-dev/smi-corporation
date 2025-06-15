// Base de données simulée en mémoire pour le développement
// Ce fichier sert uniquement pendant le développement en l'absence de base de données réelle
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on doit utiliser la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

// Fonction pour hacher un mot de passe
const hashPassword = (plainPassword) => {
  // En développement, on utilise un coût faible pour la rapidité
  // En production, utilisez un coût plus élevé (10-12)
  const salt = bcrypt.genSaltSync(5);
  return bcrypt.hashSync(plainPassword, salt);
};

// Fonction pour vérifier un mot de passe
const comparePassword = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

// Créer un utilisateur admin avec mot de passe haché
const adminHashedPassword = hashPassword('admin123');

// Structure de données pour stocker les utilisateurs
let users = [
  {
    id: 1,
    email: "admin@exemple.fr",
    name: "Administrateur",
    password: adminHashedPassword, // Mot de passe haché
    permissions: ["admin", "edit", "view"],
    createdAt: new Date().toISOString()
  }
];

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

// Structure pour stocker les sessions
let sessions = {};

// Note: Pas d'importation directe des modèles pour éviter les références circulaires
console.log("Mock DB initialisé en mode", useMockDb ? "simulation" : "compatibilité");

// Fonctions pour manipuler les utilisateurs
export const userDb = {
  findByEmail: (email) => {
    return users.find(user => user.email === email);
  },
  
  findById: (id) => {
    return users.find(user => user.id === id);
  },
  
  create: (userData) => {
    // Hacher le mot de passe avant de le stocker
    const hashedPassword = hashPassword(userData.password);
    
    const newUser = {
      id: users.length + 1,
      ...userData,
      password: hashedPassword, // Remplacer par le mot de passe haché
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    return newUser;
  },
  
  getAll: () => {
    return [...users].map(user => {
      // Ne jamais renvoyer les mots de passe
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
  
  // Fonction de vérification de mot de passe
  verifyPassword: (plainPassword, hashedPassword) => {
    return comparePassword(plainPassword, hashedPassword);
  }
};

// Fonctions pour gérer les sessions
export const sessionDb = {
  create: (userId, token) => {
    sessions[token] = {
      userId,
      createdAt: new Date().toISOString()
    };
    return token;
  },
  
  findByToken: (token) => {
    return sessions[token];
  },
  
  delete: (token) => {
    if (sessions[token]) {
      delete sessions[token];
      return true;
    }
    return false;
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
    return pages.find(page => page.id === id);
  },
  
  findAndCountAll: (options = {}) => {
    const rows = pageDb.findAll(options);
    return {
      count: rows.length,
      rows
    };
  },
  
  create: (data) => {
    const newId = Math.floor(Math.random() * 1000);
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
    const index = pages.findIndex(page => page.id === id);
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
    const index = pages.findIndex(page => page.id === id);
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