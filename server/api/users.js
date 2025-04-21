let users = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "editor" },
  { id: 3, name: "Charlie", role: "viewer" },
];

const validRoles = ["admin", "editor", "viewer"];

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      users: users.slice(start, end),
      total: users.length,
      page,
      limit,
    };
  }

  if (method === "POST") {
    // Ajouter un nouvel utilisateur
    const body = await readBody(event);
    const { name, role } = body;

    // Validation
    if (!name || name.length < 3) {
      throw createError({ statusCode: 400, message: "Nom invalide." });
    }
    if (!validRoles.includes(role)) {
      throw createError({ statusCode: 400, message: "Rôle invalide." });
    }

    const newUser = { id: users.length + 1, name, role };
    users.push(newUser);
    return newUser;
  }

  if (method === "DELETE") {
    // Supprimer un utilisateur
    const body = await readBody(event);
    const { id } = body;

    users = users.filter((user) => user.id !== id);
    return { message: "Utilisateur supprimé avec succès." };
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
