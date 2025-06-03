import { ERROR_MESSAGES } from "../constants/messages";

export const validateUser = (user, isUpdate = false) => {
  const errors = {};

  // Validation du nom
  if (!user.name || user.name.trim().length < 3) {
    errors.name = ERROR_MESSAGES.INVALID_NAME;
  } else if (!/^[a-zA-Z0-9\sÀ-ÿ'-]+$/.test(user.name.trim())) { // Autorise les espaces, accents, apostrophes et tirets
    errors.name = "Le nom contient des caractères non autorisés.";
  }

  // Validation du nom d'utilisateur (optionnel à la création, mais validé si fourni)
  if (user.username && user.username.trim().length > 0) {
    if (user.username.trim().length < 3 || user.username.trim().length > 50) {
      errors.username = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(user.username.trim())) {
      errors.username = "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores.";
    }
  } else if (!isUpdate && !user.username) { // Requis à la création si vous le souhaitez, sinon supprimez ce bloc
    // errors.username = "Le nom d'utilisateur est requis.";
  }


  // Validation de l'email
  if (!user.email || !/\S+@\S+\.\S+/.test(user.email)) {
    errors.email = "Veuillez fournir une adresse email valide.";
  }

  // Validation du mot de passe (uniquement à la création ou si le mot de passe est modifié)
  if (!isUpdate && (!user.password || user.password.length < 8)) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (isUpdate && user.password && user.password.length > 0 && user.password.length < 8) {
    errors.password = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
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
  if (!input.email || !/\S+@\S+\.\S+/.test(input.email)) {
    errors.email = "Veuillez fournir une adresse email valide.";
  }
  if (!input.password || input.password.length === 0) {
    errors.password = "Le mot de passe est requis.";
  }
  return errors;
};

export const validatePageInput = (body) => {
  const errors = {};
  if (!body.title || body.title.trim().length < 3) {
    errors.title = "Le titre doit contenir au moins 3 caractères.";
  }
  if (!body.content || body.content.trim().length === 0) {
    errors.content = "Le contenu est requis.";
  }
  return errors;
};
