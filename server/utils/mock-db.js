// Base de données simulée en mémoire pour le développement
// Ce fichier sert uniquement pendant le développement en l'absence de base de données réelle
import bcrypt from 'bcryptjs';

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

// Structure pour stocker les sessions
let sessions = {};

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