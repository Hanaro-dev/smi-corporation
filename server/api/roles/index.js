import { Role, Permission } from "../../models.js";
import auth from "../../middleware/auth.js";
import { logRoleAction } from "../../services/audit-service.js";
import { requirePermission } from "../../middleware/check-permission.js";

export default defineEventHandler(async (event) => {
  await auth(event); // Protéger toutes les routes de rôles
  const method = getMethod(event);

  // GET /api/roles - Liste des rôles
  if (method === "GET") {
    try {
      const roles = await Role.findAll({
        include: [{ model: Permission }]
      });
      return roles;
    } catch (error) {
      console.error("Erreur lors de la récupération des rôles :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération des rôles"
      });
    }
  }

  // POST /api/roles - Création d'un rôle
  if (method === "POST") {
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
      // Vérifier si le rôle existe déjà
      const existingRole = await Role.findOne({ where: { name: body.name } });
      if (existingRole) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Un rôle avec ce nom existe déjà"
        });
      }

      // Créer le rôle
      const newRole = await Role.create({ name: body.name });
      
      // Journaliser l'action
      const user = event.context.user;
      await logRoleAction(
        "create",
        newRole.id,
        newRole.name,
        user.id,
        user.name
      );
      
      return newRole;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la création du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la création du rôle"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
});