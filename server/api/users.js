import { ERROR_MESSAGES } from "../constants/messages";
import { User } from "../models.js";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "GET") {
    const { page = 1, limit = 10 } = getQuery(event);
    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({ offset, limit });
    return { users: rows, total: count };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const { name, role_id } = body;

    if (!name || name.length < 3) {
      throw createError({
        statusCode: 400,
        message: ERROR_MESSAGES.INVALID_NAME,
      });
    }

    return await User.create({ name, role_id });
  }

  if (method === "DELETE") {
    const { id } = getQuery(event);
    const user = await User.findByPk(id);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }
    await user.destroy();
    return { message: "Utilisateur supprimé avec succès." };
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
