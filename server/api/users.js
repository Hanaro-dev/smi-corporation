import { ERROR_MESSAGES } from "../constants/messages";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/check-permission.js";
import { validateUser, validateLoginInput } from "../utils/validators";
import jwt from 'jsonwebtoken';
import { userDb, sessionDb, roleDb, auditDb } from "../utils/mock-db.js";

export default defineEventHandler(async (event) => {
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

    // Récupérer le rôle et ses permissions
    const role = roleDb.findByPk(user.role_id);
    if (!role) {
      throw createError({
        statusCode: 500,
        message: "Erreur: rôle utilisateur non trouvé",
      });
    }

    // Générer un token JWT avec une durée de vie plus longue (24h)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role_id: user.role_id,
        role: role.name
      },
      process.env.JWT_SECRET || "YOUR_FALLBACK_JWT_SECRET",
      { expiresIn: "24h" }
    );

    // Créer une session avec une durée de vie plus longue (1 semaine)
    sessionDb.create(user.id, token, 7 * 24 * 60 * 60 * 1000);

    // Journaliser la connexion
    auditDb.log(
      'login',
      'user',
      user.id,
      user.id,
      { email: user.email, role: role.name }
    );

    // Retourner les informations de l'utilisateur et le token sans mot de passe
    const userResponse = user.toJSON ? user.toJSON() : { ...user };
    delete userResponse.password;

    return { 
      user: userResponse,
      token,
      expiresIn: 24 * 60 * 60 // 24 heures en secondes
    };
  }

  // GET /api/users (Liste des utilisateurs - Protégé)
  if (method === "GET") {
    await auth(event); // Protéger cette route
    await requirePermission("manage_users")(event); // Vérifier les permissions
    
    const { page = 1, limit = 10, role_id } = getQuery(event);
    const offset = (page - 1) * limit;
    
    // Construire les options de filtrage
    const options = {
      limit: Number(limit),
      offset
    };
    
    // Ajouter un filtre sur le rôle si fourni
    if (role_id) {
      options.where = { role_id: parseInt(role_id) };
    }
    
    // Récupérer les utilisateurs avec pagination
    const result = userDb.findAndCountAll(options);
    
    return { 
      users: result.rows, 
      total: result.count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(result.count / Number(limit))
    };
  }

  // POST /api/users (Création d'un utilisateur)
  if (method === "POST") {
    // Pour la création d'utilisateurs, vérifier l'authentification et la permission
    await auth(event);
    await requirePermission("manage_users")(event);
    
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
    
    // Vérifier si le rôle existe
    if (body.role_id) {
      const role = roleDb.findByPk(parseInt(body.role_id));
      if (!role) {
        throw createError({
          statusCode: 404,
          message: "Le rôle spécifié n'existe pas."
        });
      }
    }
    
    // Créer l'utilisateur avec la base de données simulée
    const newUser = userDb.create({
      name: body.name,
      username: body.username,
      email: body.email,
      password: body.password,
      role_id: body.role_id || 3  // Rôle par défaut: utilisateur standard
    });
    
    // Journaliser la création
    const authUser = event.context.user;
    auditDb.log(
      'create',
      'user',
      newUser.id,
      authUser.id,
      { email: newUser.email, role_id: newUser.role_id }
    );
    
    // Retourner l'utilisateur sans mot de passe
    const userResponse = newUser.toJSON ? newUser.toJSON() : { ...newUser };
    delete userResponse.password;
    return userResponse;
  }

  // DELETE /api/users (Suppression d'un utilisateur par ID dans les paramètres)
  if (method === "DELETE") {
    await auth(event); // Protéger cette route
    await requirePermission("manage_users")(event); // Vérifier les permissions
    
    const { id } = getQuery(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "L'ID de l'utilisateur est requis."
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = userDb.findById(parseInt(id));
    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Utilisateur non trouvé."
      });
    }
    
    // Empêcher la suppression de son propre compte
    const authUser = event.context.user;
    if (user.id === authUser.id) {
      throw createError({
        statusCode: 403,
        message: "Vous ne pouvez pas supprimer votre propre compte."
      });
    }
    
    // Stocker les informations pour le log avant suppression
    const userInfo = {
      id: user.id,
      email: user.email,
      role_id: user.role_id
    };
    
    // Supprimer toutes les sessions de l'utilisateur
    sessionDb.deleteAllForUser(user.id);
    
    // Supprimer l'utilisateur
    const success = userDb.destroy(user.id);
    
    if (!success) {
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la suppression de l'utilisateur."
      });
    }
    
    // Journaliser la suppression
    auditDb.log(
      'delete',
      'user',
      userInfo.id,
      authUser.id,
      userInfo
    );
    
    return {
      message: "Utilisateur supprimé avec succès.",
      userId: parseInt(id)
    };
  }

  throw createError({ statusCode: 405, message: "Méthode non autorisée." });
});
