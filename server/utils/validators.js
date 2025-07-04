import { ERROR_MESSAGES } from "../constants/messages";
import { 
  isValidEmail, 
  isValidPassword, 
  isValidUsername, 
  sanitizeInput 
} from "./input-validation.js";

export const validateUser = (user, isUpdate = false) => {
  const errors = {};

  // Validation du nom avec sanitisation
  if (!user.name || user.name.trim().length < 3) {
    errors.name = ERROR_MESSAGES.INVALID_NAME || "Le nom doit contenir au moins 3 caractères.";
  } else if (!/^[a-zA-Z0-9\sÀ-ÿ'-]+$/.test(user.name.trim())) {
    errors.name = "Le nom contient des caractères non autorisés.";
  } else if (user.name.trim().length > 100) {
    errors.name = "Le nom ne peut pas dépasser 100 caractères.";
  }

  // Validation du nom d'utilisateur avec fonction robuste
  if (user.username && user.username.trim().length > 0) {
    if (!isValidUsername(user.username.trim())) {
      errors.username = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères (lettres, chiffres et underscores uniquement).";
    }
  }

  // Validation de l'email avec fonction robuste
  if (!user.email) {
    errors.email = "L'email est requis.";
  } else if (!isValidEmail(user.email)) {
    errors.email = "Veuillez fournir une adresse email valide.";
  }

  // Validation robuste du mot de passe
  if (!isUpdate) {
    // À la création, mot de passe obligatoire et robuste
    if (!user.password) {
      errors.password = "Le mot de passe est requis.";
    } else if (!isValidPassword(user.password)) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).";
    }
  } else if (user.password && user.password.trim() !== "") {
    // À la mise à jour, si mot de passe fourni, il doit être robuste
    if (!isValidPassword(user.password)) {
      errors.password = "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).";
    }
  }


  // Validation du rôle (si applicable et si le champ role_id est utilisé)
  // Note: Le modèle User actuel utilise role_id, pas user.role.
  // Adaptez cette validation si vous utilisez directement un champ 'role' dans le body
  // ou si vous validez 'role_id'.
  // Exemple si vous attendez un role_id (nombre) :
  if (user.role_id && (isNaN(parseInt(user.role_id)) || !Number.isInteger(Number(user.role_id)))) {
    errors.role_id = "L'ID de rôle doit être un nombre entier.";
  } else if (Object.prototype.hasOwnProperty.call(user, 'role') && !["admin", "editor", "viewer"].includes(user.role)) {
     // Si vous passez un champ 'role' textuel, décommentez et adaptez :
     // errors.role = ERROR_MESSAGES.INVALID_ROLE;
  }


  return errors;
};

export const validateLoginInput = (input) => {
  const errors = {};
  
  // Validation email avec fonction robuste
  if (!input.email) {
    errors.email = "L'email est requis.";
  } else if (!isValidEmail(input.email)) {
    errors.email = "Veuillez fournir une adresse email valide.";
  }
  
  // Validation mot de passe pour connexion (moins stricte qu'à la création)
  if (!input.password || input.password.length === 0) {
    errors.password = "Le mot de passe est requis.";
  }
  
  return errors;
};

export const validatePageInput = (body) => {
  const errors = {};
  
  // Validation du titre
  if (!body.title || body.title.trim().length < 3) {
    errors.title = "Le titre doit contenir au moins 3 caractères.";
  }
  
  // Validation du contenu
  if (!body.content || body.content.trim().length === 0) {
    errors.content = "Le contenu est requis.";
  }
  
  // Validation du slug (si fourni)
  if (body.slug !== undefined) {
    if (body.slug.trim().length === 0) {
      errors.slug = "Le slug ne peut pas être vide.";
    } else if (!/^[a-z0-9-]+$/i.test(body.slug.trim())) {
      errors.slug = "Le slug ne peut contenir que des lettres, des chiffres et des tirets.";
    }
  }
  
  // Validation du statut (si fourni)
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) {
      errors.status = "Le statut doit être 'draft' ou 'published'.";
    }
  }
  
  // Validation du parent (si fourni)
  if (body.parentId !== undefined && body.parentId !== null) {
    if (isNaN(parseInt(body.parentId)) || !Number.isInteger(Number(body.parentId))) {
      errors.parentId = "L'ID parent doit être un nombre entier.";
    }
  }
  
  // Validation de l'ordre (si fourni)
  if (body.order !== undefined) {
    if (isNaN(parseInt(body.order)) || !Number.isInteger(Number(body.order))) {
      errors.order = "L'ordre doit être un nombre entier.";
    }
  }
  
  return errors;
};
