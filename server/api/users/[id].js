import { User } from "../../models.js"; // Extension .js ajoutée pour la cohérence
import { validateUser } from "../../utils/validators.js"; // Extension .js ajoutée
import { ERROR_MESSAGES } from "../../constants/messages.js"; // Extension .js ajoutée
import auth from "../../middleware/auth.js"; // Extension .js ajoutée

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

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] } // Exclure le mot de passe par défaut
  });

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
      allowedUpdates.password = body.password; // Le hook s'occupera du hachage
    }

    try {
      await user.update(allowedUpdates);
      // Recharger l'utilisateur pour obtenir les données à jour sans le mot de passe
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      return updatedUser;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw createError({
          statusCode: 409, // Conflict
          message: error.errors.map(e => e.message).join(', ') || "Un utilisateur avec cet email ou nom d'utilisateur existe déjà."
        });
      }
      throw createError({
        statusCode: 500,
        message: ERROR_MESSAGES.DATABASE_ERROR || "Erreur lors de la mise à jour de l'utilisateur."
      });
    }
  }

  if (method === "DELETE") {
    try {
      await user.destroy();
      return { message: "Utilisateur supprimé avec succès." };
    } catch (_) { // Variable renommée en _
      throw createError({
        statusCode: 500,
        message: ERROR_MESSAGES.DATABASE_ERROR || "Erreur lors de la suppression de l'utilisateur."
      });
    }
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
