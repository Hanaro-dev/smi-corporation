import { ERROR_MESSAGES } from "../constants/messages";
import { User } from "../models.js";
import auth from "../middleware/auth.js";
import { validateUser, validateLoginInput } from "../utils/validators"; // Ajout de validateLoginInput
import jwt from 'jsonwebtoken'; // Pour la génération de token JWT

export default defineEventHandler(async (event) => {
  // La protection par `auth` middleware sera spécifique à certaines routes/méthodes si nécessaire
  // await auth(event);
  const method = getMethod(event);
  const route = event.node.req.url;

  // Route pour la connexion (POST /api/users/login)
  if (method === "POST" && route.endsWith("/login")) {
    const body = await readBody(event);
    const errors = validateLoginInput(body);
    if (Object.keys(errors).length > 0) {
      throw createError({ statusCode: 400, message: errors });
    }

    const user = await User.findOne({ where: { email: body.email } });
    if (!user || !(await user.validPassword(body.password))) {
      throw createError({
        statusCode: 401,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS || "Email ou mot de passe incorrect.",
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET || "YOUR_FALLBACK_JWT_SECRET", // Assurez-vous d'avoir JWT_SECRET dans .env
      { expiresIn: "1h" } // ou une autre durée de validité
    );

    // Retourner les informations de l'utilisateur et le token
    // Exclure le mot de passe de la réponse
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    return { user: userResponse, token };
  }


  // GET /api/users (Liste des utilisateurs - Protégé)
  if (method === "GET") {
    await auth(event); // Protéger cette route
    const { page = 1, limit = 10 } = getQuery(event);
    const offset = (page - 1) * limit;
    // Exclure le mot de passe des résultats
    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      attributes: { exclude: ['password'] }
    });
    return { users: rows, total: count };
  }

  // POST /api/users (Création d'un utilisateur - Peut être public ou protégé selon les besoins)
  // Si c'est pour un enregistrement public, retirez `await auth(event);`
  if (method === "POST") {
    // await auth(event); // Décommentez si la création doit être protégée
    const body = await readBody(event);
    const errors = validateUser(body, false); // false car c'est une création
    if (Object.keys(errors).length > 0) {
      throw createError({
        statusCode: 400,
        message: errors,
      });
    }
    try {
      const newUser = await User.create({
        name: body.name,
        username: body.username,
        email: body.email,
        password: body.password,
        role_id: body.role_id, // Assurez-vous que role_id est bien géré
      });
      // Exclure le mot de passe de la réponse
      const userResponse = { ...newUser.toJSON() };
      delete userResponse.password;
      return userResponse;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw createError({
          statusCode: 409, // Conflict
          message: error.errors.map(e => e.message).join(', ') || "Un utilisateur avec cet email ou nom d'utilisateur existe déjà."
        });
      }
      throw createError({
        statusCode: 500,
        message: ERROR_MESSAGES.DATABASE_ERROR || "Erreur lors de la création de l'utilisateur."
      });
    }
  }

  // DELETE /api/users (Suppression d'un utilisateur - Protégé)
  // Note: La suppression est généralement gérée via /api/users/:id (DELETE)
  // Ce bloc pourrait être redondant si vous avez un handler pour [id].js
  if (method === "DELETE") {
    await auth(event); // Protéger cette route
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
