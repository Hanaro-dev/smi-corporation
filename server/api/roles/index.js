import { defineEventHandler, createError, getMethod, readBody, getCookie } from 'h3';
import { Role, Permission } from "../../models.js";
import { roleDb, sessionDb, userDb, roleDb as roleDbMock, auditDb } from '../../utils/mock-db.js';
import { checkPermission } from "../../utils/permission-utils.js";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on utilise la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

export default defineEventHandler(async (event) => {
  try {
    // Authentification comme dans les autres endpoints
    const token = getCookie(event, "auth_token");
    
    if (!token) {
      throw createError({ statusCode: 401, message: "Token d'authentification requis." });
    }
    
    const session = sessionDb.findByToken(token);
    if (!session) {
      throw createError({ statusCode: 401, message: "Session invalide." });
    }
    
    const user = await userDb.findById(session.userId);
    if (!user) {
      throw createError({ statusCode: 401, message: "Utilisateur non trouvé." });
    }

    // Récupérer le rôle de l'utilisateur avec ses permissions
    const role = roleDbMock.findByPk(user.role_id);
    if (!role) {
      throw createError({
        statusCode: 500,
        message: "Rôle utilisateur non trouvé."
      });
    }

    // Mettre l'utilisateur dans le contexte
    const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;
    
    event.context.user = userWithoutPassword;
    event.context.userRole = role;
    event.context.permissions = role.getPermissions();

    const method = getMethod(event);

  // GET /api/roles - Liste des rôles
  if (method === "GET") {
    // Vérifier les permissions de lecture
    await checkPermission(event, "view");
    
    try {
      if (useMockDb) {
        console.log("Mode base de données simulée: utilisation des données simulées pour /api/roles");
        const roles = roleDbMock.findAll();
        // Enrichir avec les permissions de chaque rôle
        return roles.map(role => ({
          ...role,
          Permissions: role.getPermissions()
        }));
      }
      
      const roles = await Role.findAll({
        include: [{ model: Permission }]
      });
      return roles;
    } catch (error) {
      console.error("Erreur lors de la récupération des rôles :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération des rôles"
      });
    }
  }

  // POST /api/roles - Création d'un rôle
  if (method === "POST") {
    // Vérifier que l'utilisateur a la permission de gérer les rôles
    await checkPermission(event, "manage_permissions");
    
    const body = await readBody(event);
    
    // Validation des données
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: "Le nom du rôle est requis et doit être une chaîne de caractères"
      });
    }

    try {
      if (useMockDb) {
        // Vérifier si le rôle existe déjà
        const existingRole = roleDbMock.findOne({ where: { name: body.name } });
        if (existingRole) {
          throw createError({
            statusCode: 409, // Conflict
            message: "Un rôle avec ce nom existe déjà"
          });
        }

        // Créer le rôle
        const newRole = roleDbMock.create({ name: body.name });
        
        // Journaliser l'action
        const user = event.context.user;
        auditDb.create({
          userId: user.id,
          action: 'role_create',
          details: `Rôle créé: ${body.name}`,
          ipAddress: 'unknown',
          userAgent: 'unknown'
        });
        
        return newRole;
      }
      
      // Mode base de données réelle
      const existingRole = await Role.findOne({ where: { name: body.name } });
      if (existingRole) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Un rôle avec ce nom existe déjà"
        });
      }

      // Créer le rôle
      const newRole = await Role.create({ name: body.name });
      
      // Journaliser l'action
      const user = event.context.user;
      auditDb.create({
        userId: user.id,
        action: 'role_create',
        details: `Rôle créé: ${body.name}`,
        ipAddress: 'unknown',
        userAgent: 'unknown'
      });
      
      return newRole;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la création du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la création du rôle"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
  
  } catch (error) {
    // Intercepter les erreurs de connexion à la base de données
    if (error.name && error.name.startsWith('Sequelize')) {
      console.error("Erreur de base de données:", error);
      throw createError({
        statusCode: 503,
        message: "Service de base de données temporairement indisponible."
      });
    }
    // Laisser passer les autres erreurs
    throw error;
  }
});