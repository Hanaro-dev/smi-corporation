import { Permission } from "../../models.js";
import auth from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/check-permission.js";
import { logPermissionAction } from "../../services/audit-service.js";

export default defineEventHandler(async (event) => {
  await auth(event); // Protéger toutes les routes
  const method = getMethod(event);
  const permissionId = event.context.params.id;

  // Vérifier si l'ID est un nombre valide
  if (isNaN(parseInt(permissionId))) {
    throw createError({
      statusCode: 400,
      message: "L'ID de la permission doit être un nombre."
    });
  }

  // GET /api/permissions/:id - Récupérer une permission par ID
  if (method === "GET") {
    try {
      const permission = await Permission.findByPk(parseInt(permissionId));
      
      if (!permission) {
        throw createError({
          statusCode: 404,
          message: "Permission non trouvée"
        });
      }

      return permission;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la récupération de la permission :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération de la permission"
      });
    }
  }

  // PUT /api/permissions/:id - Mettre à jour une permission
  if (method === "PUT") {
    // Vérifier que l'utilisateur a le droit de modifier des permissions
    await requirePermission("manage_permissions")(event);
    
    const body = await readBody(event);
    
    // Validation des données
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: "Le nom de la permission est requis et doit être une chaîne de caractères"
      });
    }

    try {
      // Vérifier si la permission existe
      const permission = await Permission.findByPk(parseInt(permissionId));
      if (!permission) {
        throw createError({
          statusCode: 404,
          message: "Permission non trouvée"
        });
      }

      // Vérifier si le nouveau nom existe déjà pour une autre permission
      if (body.name !== permission.name) {
        const existingPermission = await Permission.findOne({ where: { name: body.name } });
        if (existingPermission && existingPermission.id !== parseInt(permissionId)) {
          throw createError({
            statusCode: 409, // Conflict
            message: "Une autre permission avec ce nom existe déjà"
          });
        }
      }

      // Conserver l'ancien nom pour l'audit
      const oldName = permission.name;

      // Mettre à jour la permission
      await permission.update({ name: body.name });
      
      // Journaliser l'action
      const user = event.context.user;
      await logPermissionAction(
        "update",
        permission.id,
        permission.name,
        user.id,
        user.name,
        { oldName }
      );
      
      return permission;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la mise à jour de la permission :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la mise à jour de la permission"
      });
    }
  }

  // DELETE /api/permissions/:id - Supprimer une permission
  if (method === "DELETE") {
    // Vérifier que l'utilisateur a le droit de supprimer des permissions
    await requirePermission("manage_permissions")(event);
    
    try {
      // Vérifier si la permission existe
      const permission = await Permission.findByPk(parseInt(permissionId));
      if (!permission) {
        throw createError({
          statusCode: 404,
          message: "Permission non trouvée"
        });
      }

      // Vérifier si la permission est associée à des rôles
      const associatedRoles = await permission.getRoles();
      if (associatedRoles && associatedRoles.length > 0) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Cette permission est attribuée à des rôles et ne peut pas être supprimée. Retirez-la d'abord des rôles associés."
        });
      }

      // Conserver les informations pour l'audit
      const permissionInfo = {
        id: permission.id,
        name: permission.name
      };

      // Supprimer la permission
      await permission.destroy();
      
      // Journaliser l'action
      const user = event.context.user;
      await logPermissionAction(
        "delete",
        permissionInfo.id,
        permissionInfo.name,
        user.id,
        user.name
      );
      
      return { message: "Permission supprimée avec succès" };
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la suppression de la permission :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la suppression de la permission"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
});