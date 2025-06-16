import { Role, Permission } from "../../models.js";
import auth from "../../middleware/auth.js";
import { logRoleAction } from "../../services/audit-service.js";
import { requirePermission } from "../../middleware/check-permission.js";

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

  // GET /api/roles/:id - Récupérer un rôle par ID avec ses permissions
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

      return role;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la récupération du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération du rôle"
      });
    }
  }

  // PUT /api/roles/:id - Mettre à jour un rôle
  if (method === "PUT") {
    // Vérifier que l'utilisateur a la permission de gérer les rôles
    await requirePermission("manage_roles")(event);
    
    const body = await readBody(event);
    
    // Validation des données
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: "Le nom du rôle est requis et doit être une chaîne de caractères"
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

      // Vérifier si le nouveau nom existe déjà pour un autre rôle
      if (body.name !== role.name) {
        const existingRole = await Role.findOne({ where: { name: body.name } });
        if (existingRole && existingRole.id !== parseInt(roleId)) {
          throw createError({
            statusCode: 409, // Conflict
            message: "Un autre rôle avec ce nom existe déjà"
          });
        }
      }

      // Conserver l'ancien nom pour l'audit
      const oldName = role.name;
      
      // Mettre à jour le rôle
      await role.update({ name: body.name });
      
      // Journaliser l'action
      const user = event.context.user;
      await logRoleAction(
        "update",
        role.id,
        role.name,
        user.id,
        user.name,
        { oldName }
      );
      
      return role;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la mise à jour du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la mise à jour du rôle"
      });
    }
  }

  // DELETE /api/roles/:id - Supprimer un rôle
  if (method === "DELETE") {
    // Vérifier que l'utilisateur a la permission de gérer les rôles
    await requirePermission("manage_roles")(event);
    
    try {
      // Vérifier si le rôle existe
      const role = await Role.findByPk(parseInt(roleId));
      if (!role) {
        throw createError({
          statusCode: 404,
          message: "Rôle non trouvé"
        });
      }

      // Vérifier si des utilisateurs utilisent ce rôle
      const usersWithRole = await role.getUsers();
      if (usersWithRole && usersWithRole.length > 0) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Ce rôle est attribué à des utilisateurs et ne peut pas être supprimé"
        });
      }

      // Conserver les informations pour l'audit
      const roleInfo = {
        id: role.id,
        name: role.name
      };
      
      // Supprimer le rôle
      await role.destroy();
      
      // Journaliser l'action
      const user = event.context.user;
      await logRoleAction(
        "delete",
        roleInfo.id,
        roleInfo.name,
        user.id,
        user.name
      );
      
      return { message: "Rôle supprimé avec succès" };
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la suppression du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la suppression du rôle"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
});