import { defineEventHandler, createError, getMethod, readBody } from 'h3';
import { Permission } from "../../models.js";
import { permissionDb } from '../../utils/mock-db-optimized.js';
import { auditDb } from '../../utils/mock-db.js';
import { checkPermission } from "../../utils/permission-utils.js";
import { authenticateUser, handleDatabaseError } from "../../services/auth-middleware.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../../constants/api-constants.js";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on utilise la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

export default defineEventHandler(async (event) => {
  try {
    // Authentification centralisée
    await authenticateUser(event);
    
    const method = getMethod(event);

  // GET /api/permissions - Liste des permissions
  if (method === "GET") {
    // Vérifier les permissions de lecture
    await checkPermission(event, "view");
    
    try {
      if (useMockDb) {
        console.log("Mode base de données simulée: utilisation des données simulées pour /api/permissions");
        return permissionDb.findAll();
      }
      
      const permissions = await Permission.findAll();
      return permissions;
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la récupération des permissions"
      });
    }
  }

  // POST /api/permissions - Création d'une permission
  if (method === "POST") {
    // Vérifier que l'utilisateur a le droit de créer des permissions
    await checkPermission(event, "manage_permissions");
    
    const body = await readBody(event);
    
    // Validation des données
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: "Le nom de la permission est requis et doit être une chaîne de caractères"
      });
    }

    try {
      if (useMockDb) {
        // Vérifier si la permission existe déjà
        const existingPermission = permissionDb.findOne({ where: { name: body.name } });
        if (existingPermission) {
          throw createError({
            statusCode: 409, // Conflict
            message: "Une permission avec ce nom existe déjà"
          });
        }

        // Créer la permission
        const newPermission = permissionDb.create({ name: body.name });
        
        // Journaliser l'action
        const user = event.context.user;
        auditDb.create({
          userId: user.id,
          action: 'permission_create',
          details: `Permission créée: ${body.name}`,
          ipAddress: 'unknown',
          userAgent: 'unknown'
        });
        
        return newPermission;
      }
      
      // Mode base de données réelle
      const existingPermission = await Permission.findOne({ where: { name: body.name } });
      if (existingPermission) {
        throw createError({
          statusCode: 409, // Conflict
          message: "Une permission avec ce nom existe déjà"
        });
      }

      // Créer la permission
      const newPermission = await Permission.create({ name: body.name });
      
      // Journaliser l'action
      const user = event.context.user;
      auditDb.create({
        userId: user.id,
        action: 'permission_create',
        details: `Permission créée: ${body.name}`,
        ipAddress: 'unknown',
        userAgent: 'unknown'
      });
      
      return newPermission;
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la création de la permission :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la création de la permission"
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
  
  } catch (error) {
    handleDatabaseError(error, "gestion des permissions");
  }
});