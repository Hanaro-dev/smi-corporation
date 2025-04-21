import { Role, Permission } from "~/server/models";

export default defineEventHandler(async (event) => {
  const body = await readBody(event); // Récupère le corps de la requête
  const { role, permission } = body;

  try {
    // Recherche du rôle et de la permission
    const roleInstance = await Role.findOne({ where: { name: role } });
    const permissionInstance = await Permission.findOne({
      where: { name: permission },
    });

    if (!roleInstance || !permissionInstance) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          statusMessage: "Rôle ou permission introuvable.",
        })
      );
    }

    // Ajout de la permission au rôle
    await roleInstance.addPermission(permissionInstance);

    return { message: "Permission attribuée avec succès." };
  } catch (error) {
    console.error(error);
    return sendError(
      event,
      createError({ statusCode: 500, statusMessage: "Erreur serveur." })
    );
  }
});
