import { Role, Permission } from "../../../models.js";
import auth from "../../../middleware/auth.js";
import { requirePermission } from "../../../middleware/check-permission.js";
import { logRolePermissionAction } from "../../../services/audit-service.js";

export default defineEventHandler(async (event) => {
  await auth(event); // Protéger toutes les routes
  const method = getMethod(event);
  const roleId = event.context.params.id;

  // Vérifier si l'ID est un nombre valide
  if (isNaN(parseInt(roleId))) {
    throw createError({
      statusCode: 400,
      message: "L'ID du rôle doit être un nombre."
    });
  }

  // GET /api/roles/:id/permissions - Récupérer toutes les permissions d'un rôle
  if (method === "GET") {
    try {
      const role = await Role.findByPk(parseInt(roleId), {
        include: [{ model: Permission }]
      });

      if (!role) {
        throw createError({
          statusCode: 404,
          message: "Rôle non trouvé"
        });
      }

      return role.Permissions;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la récupération des permissions du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération des permissions du rôle"
      });
    }
  }

  // POST /api/roles/:id/permissions - Ajouter une permission à un rôle
  if (method === "POST") {
    // Vérifier que l'utilisateur a le droit de gérer les permissions
    await requirePermission("manage_permissions")(event);
    
    const body = await readBody(event);
    
    // Validation des données
    if (!body.permissionId || isNaN(parseInt(body.permissionId))) {
      throw createError({
        statusCode: 400,
        message: "L'ID de la permission est requis et doit être un nombre"
      });
    }

    try {
      // Vérifier si le rôle existe
      const role = await Role.findByPk(parseInt(roleId));
      if (!role) {
        throw createError({
          statusCode: 404,
          message: "Rôle non trouvé"
        });
      }

      // Vérifier si la permission existe
      const permission = await Permission.findByPk(parseInt(body.permissionId));
      if (!permission) {
        throw createError({
          statusCode: 404,
          message: "Permission non trouvée"
        });
      }

      // Vérifier si la permission est déjà attribuée au rôle
      const hasPermission = await role.hasPermission(permission);
      if (hasPermission) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Cette permission est déjà attribuée à ce rôle"
        });
      }

      // Ajouter la permission au rôle
      await role.addPermission(permission);
      
      // Journaliser l'action
      const user = event.context.user;
      await logRolePermissionAction(
        "assign",
        role.id,
        role.name,
        permission.id,
        permission.name,
        user.id,
        user.name
      );
      
      // Récupérer le rôle mis à jour avec ses permissions
      const updatedRole = await Role.findByPk(parseInt(roleId), {
        include: [{ model: Permission }]
      });
      
      return updatedRole;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de l'ajout de la permission au rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de l'ajout de la permission au rôle"
      });
    }
  }

  // DELETE /api/roles/:id/permissions/:permissionId - Retirer une permission d'un rôle
  if (method === "DELETE") {
    // Vérifier que l'utilisateur a le droit de gérer les permissions
    await requirePermission("manage_permissions")(event);
    
    const query = getQuery(event);
    const permissionId = query.permissionId;
    
    // Validation des données
    if (!permissionId || isNaN(parseInt(permissionId))) {
      throw createError({
        statusCode: 400,
        message: "L'ID de la permission est requis et doit être un nombre"
      });
    }

    try {
      // Vérifier si le rôle existe
      const role = await Role.findByPk(parseInt(roleId));
      if (!role) {
        throw createError({
          statusCode: 404,
          message: "Rôle non trouvé"
        });
      }

      // Vérifier si la permission existe
      const permission = await Permission.findByPk(parseInt(permissionId));
      if (!permission) {
        throw createError({
          statusCode: 404,
          message: "Permission non trouvée"
        });
      }

      // Vérifier si la permission est attribuée au rôle
      const hasPermission = await role.hasPermission(permission);
      if (!hasPermission) {
        throw createError({
          statusCode: 404,
          message: "Cette permission n'est pas attribuée à ce rôle"
        });
      }

      // Retirer la permission du rôle
      await role.removePermission(permission);
      
      // Journaliser l'action
      const user = event.context.user;
      await logRolePermissionAction(
        "remove",
        role.id,
        role.name,
        permission.id,
        permission.name,
        user.id,
        user.name
      );
      
      return { message: "Permission retirée du rôle avec succès" };
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors du retrait de la permission du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors du retrait de la permission du rôle"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
});