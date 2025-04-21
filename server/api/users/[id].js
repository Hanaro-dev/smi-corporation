const { User } = require("../models");

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;
  const body = await readBody(event);

  const user = await User.findByPk(id);
  if (!user) {
    throw createError({ statusCode: 404, message: "Utilisateur non trouvé." });
  }

  if (body.name && body.name.length >= 3) {
    user.name = body.name;
  } else {
    throw createError({ statusCode: 400, message: "Nom invalide." });
  }

  if (body.role && ["admin", "editor", "viewer"].includes(body.role)) {
    user.role = body.role;
  } else {
    throw createError({ statusCode: 400, message: "Rôle invalide." });
  }

  await user.save();
  return user;
});
