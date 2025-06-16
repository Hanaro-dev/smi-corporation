import { Permission } from "../../models.js";
import auth from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/check-permission.js";
import { logPermissionAction } from "../../services/audit-service.js";

export default defineEventHandler(async (event) => {
  await auth(event); // Protéger toutes les routes
  const method = getMethod(event);

  // GET /api/permissions - Liste des permissions
  if (method === "GET") {
    try {
      const permissions = await Permission.findAll();
      return permissions;
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération des permissions"
      });
    }
  }

  // POST /api/permissions - Création d'une permission
  if (method === "POST") {
    // Vérifier que l'utilisateur a le droit de créer des permissions
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
      // Vérifier si la permission existe déjà
      const existingPermission = await Permission.findOne({ where: { name: body.name } });
      if (existingPermission) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Une permission avec ce nom existe déjà"
        });
      }

      // Créer la permission
      const newPermission = await Permission.create({ name: body.name });
      
      // Journaliser l'action
      const user = event.context.user;
      await logPermissionAction(
        "create",
        newPermission.id,
        newPermission.name,
        user.id,
        user.name
      );
      
      return newPermission;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la création de la permission :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la création de la permission"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
});