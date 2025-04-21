const validRoles = ["admin", "editor", "viewer"];

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params.id);
  const body = await readBody(event);

  const user = users.find((u) => u.id === id);
  if (!user) {
    throw createError({ statusCode: 404, message: "Utilisateur non trouvé." });
  }

  if (body.name && body.name.length >= 3) {
    user.name = body.name;
  } else {
    throw createError({ statusCode: 400, message: "Nom invalide." });
  }

  if (body.role && validRoles.includes(body.role)) {
    user.role = body.role;
  } else {
    throw createError({ statusCode: 400, message: "Rôle invalide." });
  }

  return user;
});
