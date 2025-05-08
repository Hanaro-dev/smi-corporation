import { Role, Permission } from "../../models.js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { role, permission } = body;

  if (!role || !permission) {
    return sendError(
      event,
      createError({
        statusCode: 400,
        statusMessage: "Le rôle et la permission sont requis.",
      })
    );
  }

  try {
    const roleInstance = await Role.findOne({ where: { name: role } });
    const permissionInstance = await Permission.findOne({ where: { name: permission } });

    if (!roleInstance) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          statusMessage: `Le rôle "${role}" est introuvable.`,
        })
      );
    }

    if (!permissionInstance) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          statusMessage: `La permission "${permission}" est introuvable.`,
        })
      );
    }

    const hasPermission = await roleInstance.hasPermission(permissionInstance);
    if (hasPermission) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          statusMessage: `La permission "${permission}" est déjà attribuée au rôle "${role}".`,
        })
      );
    }

    await roleInstance.addPermission(permissionInstance);

    return { message: "Permission attribuée avec succès." };
  } catch (error) {
    console.error("Erreur lors de l'attribution de la permission :", error);
    return sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: "Erreur serveur : impossible d'attribuer la permission.",
      })
    );
  }
});
