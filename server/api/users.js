const { User } = require("./models");

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    // Récupérer tous les utilisateurs
    return await User.findAll();
  }

  if (method === "POST") {
    // Ajouter un nouvel utilisateur
    const body = await readBody(event);
    const { name, role } = body;

    // Validation
    if (!name || name.length < 3) {
      throw createError({ statusCode: 400, message: "Nom invalide." });
    }
    if (!["admin", "editor", "viewer"].includes(role)) {
      throw createError({ statusCode: 400, message: "Rôle invalide." });
    }

    return await User.create({ name, role });
  }

  if (method === "DELETE") {
    // Supprimer un utilisateur
    const id = event.context.params.id;
    const user = await User.findByPk(id);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Utilisateur non trouvé.",
      });
    }
    await user.destroy();
    return { message: "Utilisateur supprimé avec succès." };
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
