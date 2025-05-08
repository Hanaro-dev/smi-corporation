import { ERROR_MESSAGES } from "../constants/messages";

export const validateUser = (user) => {
  const errors = {};
  if (!user.name || user.name.length < 3) {
    errors.name = ERROR_MESSAGES.INVALID_NAME;
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(user.name)) {
    errors.name = "Le nom contient des caractères non autorisés.";
  }
  if (!["admin", "editor", "viewer"].includes(user.role)) {
    errors.role = ERROR_MESSAGES.INVALID_ROLE;
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
