export const validateUser = (user) => {
  const errors = {};
  if (!user.name || user.name.length < 3) {
    errors.name = "Le nom doit contenir au moins 3 caractères.";
  }
  if (!["admin", "editor", "viewer"].includes(user.role)) {
    errors.role = "Rôle invalide.";
  }
  return errors;
};
