import { validateUser } from "../../utils/validators.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../../constants/api-constants.js";
import { requirePermission } from "../../middleware/check-permission.js";
import { userDb, roleDb, sessionDb } from "../../utils/mock-db-optimized.js";
import { auditDb } from "../../utils/mock-db.js";
import { authenticateUser, handleDatabaseError } from "../../services/auth-middleware.js";
import { defineEventHandler, createError, getMethod, readBody } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // Authentification centralisée
    await authenticateUser(event);
  const method = getMethod(event);
  const userId = event.context.params.id;

  // Vérifier si l'ID est un nombre valide
  if (isNaN(parseInt(userId))) {
    throw createError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: ERROR_MESSAGES.VALIDATION.INVALID_ID,
    });
  }

  // Récupérer l'utilisateur par ID
  const user = userDb.findById(parseInt(userId));

  if (!user) {
    throw createError({
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
    });
  }

  // GET /api/users/:id - Obtenir un utilisateur
  if (method === "GET") {
    // Vérifier les permissions - l'utilisateur peut voir son propre profil ou doit avoir la permission manage_users
    const authUser = event.context.user;
    if (authUser.id !== parseInt(userId)) {
      await requirePermission("manage_users")(event);
    }
    
    // Retourner l'utilisateur avec son rôle
    return user.toJSON ? user.toJSON() : { ...user };
  }

  // PUT /api/users/:id - Mettre à jour un utilisateur
  if (method === "PUT") {
    // Vérifier les permissions - l'utilisateur peut modifier son propre profil ou doit avoir la permission manage_users
    const authUser = event.context.user;
    if (authUser.id !== parseInt(userId)) {
      await requirePermission("manage_users")(event);
    }
    
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

    // Si le rôle est modifié, vérifier qu'il existe et que l'utilisateur a les permissions
    if (body.role_id && body.role_id !== user.role_id) {
      // Seul un utilisateur avec manage_user_roles peut changer les rôles
      await requirePermission("manage_user_roles")(event);
      
      // Vérifier si le rôle existe
      const role = roleDb.findByPk(parseInt(body.role_id));
      if (!role) {
        throw createError({
          statusCode: 404,
          message: "Le rôle spécifié n'existe pas."
        });
      }
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (body.email && body.email !== user.email) {
      const existingUser = userDb.findByEmail(body.email);
      if (existingUser && existingUser.id !== parseInt(userId)) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Un autre utilisateur avec cet email existe déjà."
        });
      }
    }

    // Stocker les données avant modification pour l'audit
    const oldData = {
      email: user.email,
      name: user.name,
      username: user.username,
      role_id: user.role_id
    };

    // Champs autorisés à la mise à jour
    const allowedUpdates = {
      name: body.name,
      username: body.username,
      email: body.email
    };

    // Mettre à jour le rôle uniquement si l'utilisateur a les permissions nécessaires
    if (body.role_id && event.context.user.id !== parseInt(userId)) {
      allowedUpdates.role_id = parseInt(body.role_id);
    }

    // Mettre à jour le mot de passe uniquement s'il est fourni et non vide
    if (body.password && body.password.trim() !== "") {
      allowedUpdates.password = body.password;
    }

    // Mettre à jour l'utilisateur
    const updatedUser = userDb.update(parseInt(userId), allowedUpdates);
    
    if (!updatedUser) {
      // Log l'erreur sans exposer les détails
      console.error("User update failed:", {
        userId: parseInt(userId),
        timestamp: new Date().toISOString(),
        updatedBy: event.context.user.id
      });
      
      throw createError({
        statusCode: 500,
        message: "Erreur interne du serveur"
      });
    }

    // Si le rôle a été modifié, déconnecter l'utilisateur de toutes ses sessions
    if (body.role_id && body.role_id !== oldData.role_id) {
      sessionDb.deleteAllForUser(parseInt(userId));
    }

    // Journaliser la mise à jour
    auditDb.log(
      'update',
      'user',
      updatedUser.id,
      event.context.user.id,
      {
        oldData,
        newData: {
          email: updatedUser.email,
          name: updatedUser.name,
          username: updatedUser.username,
          role_id: updatedUser.role_id
        }
      }
    );

    // Retourner l'utilisateur mis à jour sans mot de passe
    const userResponse = updatedUser.toJSON ? updatedUser.toJSON() : { ...updatedUser };
    delete userResponse.password;
    return userResponse;
  }

  // DELETE /api/users/:id - Supprimer un utilisateur
  if (method === "DELETE") {
    // Seul un utilisateur avec manage_users peut supprimer des utilisateurs
    await requirePermission("manage_users")(event);
    
    // Un utilisateur ne peut pas supprimer son propre compte par cette route
    if (event.context.user.id === parseInt(userId)) {
      throw createError({
        statusCode: 403,
        message: "Vous ne pouvez pas supprimer votre propre compte par cette route."
      });
    }
    
    // Stocker les informations pour le log avant suppression
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      role_id: user.role_id
    };
    
    // Supprimer toutes les sessions de l'utilisateur
    sessionDb.deleteAllForUser(parseInt(userId));
    
    // Supprimer l'utilisateur
    const success = userDb.destroy(parseInt(userId));
    
    if (!success) {
      // Log l'erreur sans exposer les détails
      console.error("User deletion failed:", {
        userId: parseInt(userId),
        timestamp: new Date().toISOString(),
        deletedBy: event.context.user.id
      });
      
      throw createError({
        statusCode: 500,
        message: "Erreur interne du serveur"
      });
    }
    
    // Journaliser la suppression
    auditDb.log(
      'delete',
      'user',
      userInfo.id,
      event.context.user.id,
      userInfo
    );
    
    return {
      message: "Utilisateur supprimé avec succès.",
      userId: parseInt(userId)
    };
  }

  throw createError({ statusCode: HTTP_STATUS.METHOD_NOT_ALLOWED, message: ERROR_MESSAGES.GENERIC.METHOD_NOT_ALLOWED });
  
  } catch (error) {
    // Utiliser le gestionnaire d'erreurs centralisé
    handleDatabaseError(error, "gestion des utilisateurs");
  }
});
