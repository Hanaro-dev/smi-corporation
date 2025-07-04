import { Role, Permission } from "../models.js";
import { userDb } from "./mock-db.js";

/**
 * Vérifie si l'utilisateur connecté possède une permission spécifique
 * @param {Object} event - L'événement H3
 * @param {string} permissionName - Le nom de la permission à vérifier
 * @returns {Promise<boolean>} - Vrai si l'utilisateur a la permission, lance une erreur sinon
 */
export const checkPermission = async (event, permissionName) => {
  // Si l'utilisateur n'est pas dans le contexte, il n'est pas authentifié
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: "Authentification requise"
    });
  }

  const user = event.context.user;
  
  // Si on utilise la base de données simulée
  if (process.env.USE_MOCK_DB === 'true') {
    // En mode simulé, les permissions sont directement sur l'utilisateur
    if (user.permissions && user.permissions.includes(permissionName)) {
      return true;
    }
    
    // Si l'utilisateur est admin, il a toutes les permissions
    if (user.permissions && user.permissions.includes('admin')) {
      return true;
    }
    
    throw createError({
      statusCode: 403,
      message: "Vous n'avez pas la permission requise pour effectuer cette action"
    });
  } 
  else {
    // En mode réel, on vérifie via les relations role-permission
    try {
      // Récupérer le rôle de l'utilisateur avec ses permissions
      const userRole = await Role.findByPk(user.role_id, {
        include: [{ model: Permission }]
      });
      
      if (!userRole) {
        throw createError({
          statusCode: 403,
          message: "Aucun rôle attribué à cet utilisateur"
        });
      }
      
      // Vérifier si le rôle a la permission requise
      const hasPermission = userRole.Permissions.some(
        permission => permission.name === permissionName
      );
      
      if (hasPermission) {
        return true;
      }
      
      // Vérifier si le rôle a la permission 'admin' qui donne accès à tout
      const isAdmin = userRole.Permissions.some(
        permission => permission.name === 'admin'
      );
      
      if (isAdmin) {
        return true;
      }
      
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas la permission requise pour effectuer cette action"
      });
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      // Log l'erreur pour les administrateurs sans exposer les détails
      console.error("Permission check error:", {
        userId: user.id,
        permission: permissionName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw createError({
        statusCode: 500,
        message: "Erreur interne du serveur"
      });
    }
  }
};

/**
 * Vérifie si l'utilisateur connecté possède un rôle spécifique
 * @param {Object} event - L'événement H3
 * @param {string} roleName - Le nom du rôle à vérifier
 * @returns {Promise<boolean>} - Vrai si l'utilisateur a le rôle, lance une erreur sinon
 */
export const hasRole = async (event, roleName) => {
  // Si l'utilisateur n'est pas dans le contexte, il n'est pas authentifié
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: "Authentification requise"
    });
  }

  const user = event.context.user;
  
  // Si on utilise la base de données simulée
  if (process.env.USE_MOCK_DB === 'true') {
    // En mode simulé, on ne peut pas vraiment vérifier les rôles
    // On vérifie donc les permissions d'admin
    if (user.permissions && user.permissions.includes('admin')) {
      return true;
    }
    
    throw createError({
      statusCode: 403,
      message: "Vous n'avez pas le rôle requis pour effectuer cette action"
    });
  } 
  else {
    try {
      // Récupérer le rôle de l'utilisateur
      const userRole = await Role.findByPk(user.role_id);
      
      if (!userRole) {
        throw createError({
          statusCode: 403,
          message: "Aucun rôle attribué à cet utilisateur"
        });
      }
      
      // Vérifier si l'utilisateur a le rôle requis
      if (userRole.name === roleName) {
        return true;
      }
      
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas le rôle requis pour effectuer cette action"
      });
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      // Log l'erreur pour les administrateurs sans exposer les détails
      console.error("Role check error:", {
        userId: user.id,
        role: roleName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw createError({
        statusCode: 500,
        message: "Erreur interne du serveur"
      });
    }
  }
};