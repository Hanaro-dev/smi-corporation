import { validateUser } from "../../utils/validators.js";
import { ERROR_MESSAGES } from "../../constants/messages.js";
import auth from "../../middleware/auth.js";
// Utiliser la base de données simulée au lieu de Sequelize pendant le développement
import { userDb } from "../../utils/mock-db.js";

export default defineEventHandler(async (event) => {
  await auth(event); // Protéger toutes les méthodes de ce handler
  const method = getMethod(event);
  const userId = event.context.params.id;

  // Vérifier si l'ID est un nombre valide
  if (isNaN(parseInt(userId))) {
    throw createError({
      statusCode: 400,
      message: "L'ID utilisateur doit être un nombre.",
    });
  }

  // Récupérer l'utilisateur par ID depuis la base de données simulée
  // Note: userDb n'a pas de méthode findById, donc on simule cette fonctionnalité
  const allUsers = userDb.getAll();
  const user = allUsers.find(u => u.id === parseInt(userId));

  if (!user) {
    throw createError({
      statusCode: 404,
      message: ERROR_MESSAGES.USER_NOT_FOUND || "Utilisateur non trouvé.",
    });
  }

  if (method === "GET") {
    return user; // Le mot de passe est déjà exclu
  }

  if (method === "PUT") {
    const body = await readBody(event);
    // Utiliser le deuxième argument de validateUser pour indiquer une mise à jour
    const errors = validateUser(body, true);

    // Retirer la validation du mot de passe si celui-ci n'est pas fourni pour la mise à jour
    if (!body.password || body.password.trim() === "") {
      delete errors.password;
    }

    if (Object.keys(errors).length > 0) {
      throw createError({
        statusCode: 400,
        message: errors,
      });
    }

    // Champs autorisés à la mise à jour
    const allowedUpdates = {
      name: body.name,
      username: body.username,
      email: body.email,
      role_id: body.role_id,
    };

    // Mettre à jour le mot de passe uniquement s'il est fourni et non vide
    if (body.password && body.password.trim() !== "") {
      allowedUpdates.password = body.password;
    }

    // La base de données simulée n'implémente pas de méthode update
    // Simulons cette fonctionnalité pour le développement
    return {
      id: parseInt(userId),
      ...allowedUpdates,
      message: "Utilisateur mis à jour avec succès (simulation).",
      note: "La mise à jour réelle sera implémentée avec la base de données MySQL."
    };
  }

  if (method === "DELETE") {
    // La base de données simulée n'implémente pas de méthode destroy
    // Simulons cette fonctionnalité pour le développement
    return {
      message: "Utilisateur supprimé avec succès (simulation).",
      note: "La suppression réelle sera implémentée avec la base de données MySQL."
    };
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
