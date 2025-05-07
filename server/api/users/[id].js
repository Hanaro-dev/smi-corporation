const { User } = require("../models");

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;
  const body = await readBody(event);

  if (!body.name || body.name.length < 3) {
    throw createError({ statusCode: 400, message: "Nom invalide." });
  }
  if (!["admin", "editor", "viewer"].includes(body.role)) {
    throw createError({ statusCode: 400, message: "Rôle invalide." });
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw createError({ statusCode: 404, message: "Utilisateur non trouvé." });
  }

  Object.assign(user, body);
  await user.save();
  return user;
});
