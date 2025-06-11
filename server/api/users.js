import { ERROR_MESSAGES } from "../constants/messages";
import auth from "../middleware/auth.js";
import { validateUser, validateLoginInput } from "../utils/validators";
import jwt from 'jsonwebtoken';
// Utiliser la base de données simulée au lieu de Sequelize pendant le développement
import { userDb } from "../utils/mock-db.js";

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

    // Utiliser la base de données simulée
    const user = userDb.findByEmail(body.email);
    if (!user || !userDb.verifyPassword(body.password, user.password)) {
      throw createError({
        statusCode: 401,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS || "Email ou mot de passe incorrect.",
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, permissions: user.permissions },
      process.env.JWT_SECRET || "YOUR_FALLBACK_JWT_SECRET",
      { expiresIn: "1h" }
    );

    // Retourner les informations de l'utilisateur et le token sans mot de passe
    const userResponse = { ...user };
    delete userResponse.password;

    return { user: userResponse, token };
  }


  // GET /api/users (Liste des utilisateurs - Protégé)
  if (method === "GET") {
    await auth(event); // Protéger cette route
    const { page = 1, limit = 10 } = getQuery(event);
    const offset = (page - 1) * limit;
    
    // Utiliser la base de données simulée
    const allUsers = userDb.getAll(); // Déjà sans mot de passe
    const total = allUsers.length;
    const paginatedUsers = allUsers.slice(offset, offset + Number(limit));
    
    return { users: paginatedUsers, total };
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
    
    // Vérifier si l'email existe déjà
    const existingUser = userDb.findByEmail(body.email);
    if (existingUser) {
      throw createError({
        statusCode: 409, // Conflict
        message: "Un utilisateur avec cet email existe déjà."
      });
    }
    
    // Créer l'utilisateur avec la base de données simulée
    const newUser = userDb.create({
      name: body.name || body.username,
      email: body.email,
      password: body.password,
      permissions: body.permissions || ["view"], // permissions de base
    });
    
    // Retourner l'utilisateur sans mot de passe
    const userResponse = { ...newUser };
    delete userResponse.password;
    return userResponse;
  }

  // DELETE /api/users (Suppression d'un utilisateur - Protégé)
  // Note: La suppression est généralement gérée via /api/users/:id (DELETE)
  // Simulée pour le développement car mock-db.js n'implémente pas encore la suppression
  if (method === "DELETE") {
    await auth(event); // Protéger cette route
    const { id } = getQuery(event);
    
    // NOTE: La base de données simulée n'implémente pas actuellement
    // de fonction de suppression. Cette fonctionnalité sera disponible
    // quand la base de données réelle sera mise en place.
    
    return {
      message: "Utilisateur supprimé avec succès (simulation).",
      note: "La suppression réelle sera implémentée avec la base de données MySQL."
    };
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
