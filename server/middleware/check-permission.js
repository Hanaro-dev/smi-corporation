import { roleDb, permissionDb, auditDb } from '../utils/mock-db.js';
import { defineEventHandler, createError } from '../utils/http-utils.js';

/**
 * Middleware pour vérifier si l'utilisateur a une permission spécifique
 * @param {string} permissionName - Le nom de la permission requise
 * @returns {Function} - Middleware H3
 */
export const requirePermission = (permissionName) => {
  return defineEventHandler(async (event) => {
    try {
      // Si l'utilisateur n'est pas dans le contexte, il n'est pas authentifié
      if (!event.context.user) {
        throw createError({
          statusCode: 401,
          message: "Authentification requise"
        });
      }

      const user = event.context.user;
      const userRole = event.context.userRole || null;
      
      // Si on n'a pas le rôle dans le contexte, le récupérer
      if (!userRole && user.role_id) {
        const role = roleDb.findByPk(user.role_id);
        if (!role) {
          throw createError({
            statusCode: 403,
            message: "Aucun rôle attribué à cet utilisateur"
          });
        }
        event.context.userRole = role;
      }
      
      const role = event.context.userRole;
      
      // Vérifier si le rôle a la permission requise ou est admin
      if (role.hasPermission('admin') || role.hasPermission(permissionName)) {
        return; // Permission accordée
      }
      
      // Journaliser le refus d'accès
      auditDb.log(
        'permission_denied',
        'access',
        null,
        user.id,
        {
          permission: permissionName,
          role: role.name,
          url: event.node.req.url,
          method: event.node.req.method
        }
      );
      
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas la permission requise pour effectuer cette action"
      });
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la vérification des permissions :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la vérification des permissions"
      });
    }
  });
};

/**
 * Middleware pour vérifier si l'utilisateur a un rôle spécifique
 * @param {string} roleName - Le nom du rôle requis
 * @returns {Function} - Middleware H3
 */
export const requireRole = (roleName) => {
  return defineEventHandler(async (event) => {
    try {
      // Si l'utilisateur n'est pas dans le contexte, il n'est pas authentifié
      if (!event.context.user) {
        throw createError({
          statusCode: 401,
          message: "Authentification requise"
        });
      }

      const user = event.context.user;
      const userRole = event.context.userRole || null;
      
      // Si on n'a pas le rôle dans le contexte, le récupérer
      if (!userRole && user.role_id) {
        const role = roleDb.findByPk(user.role_id);
        if (!role) {
          throw createError({
            statusCode: 403,
            message: "Aucun rôle attribué à cet utilisateur"
          });
        }
        event.context.userRole = role;
      }
      
      const role = event.context.userRole;
      
      // Vérifier si l'utilisateur a le rôle requis ou est admin
      if (role.name === 'admin' || role.name === roleName) {
        return; // Rôle autorisé
      }
      
      // Journaliser le refus d'accès
      auditDb.log(
        'role_denied',
        'access',
        null,
        user.id,
        {
          requiredRole: roleName,
          userRole: role.name,
          url: event.node.req.url,
          method: event.node.req.method
        }
      );
      
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas le rôle requis pour effectuer cette action"
      });
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la vérification du rôle :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la vérification du rôle"
      });
    }
  });
};

/**
 * Middleware pour vérifier si l'utilisateur a l'une des permissions spécifiées
 * @param {string[]} permissionNames - Les noms des permissions, dont une est requise
 * @returns {Function} - Middleware H3
 */
export const requireAnyPermission = (permissionNames) => {
  return defineEventHandler(async (event) => {
    try {
      // Si l'utilisateur n'est pas dans le contexte, il n'est pas authentifié
      if (!event.context.user) {
        throw createError({
          statusCode: 401,
          message: "Authentification requise"
        });
      }

      const user = event.context.user;
      const userRole = event.context.userRole || null;
      
      // Si on n'a pas le rôle dans le contexte, le récupérer
      if (!userRole && user.role_id) {
        const role = roleDb.findByPk(user.role_id);
        if (!role) {
          throw createError({
            statusCode: 403,
            message: "Aucun rôle attribué à cet utilisateur"
          });
        }
        event.context.userRole = role;
      }
      
      const role = event.context.userRole;
      
      // Si l'utilisateur est admin, il a toutes les permissions
      if (role.hasPermission('admin')) {
        return; // Permission accordée
      }
      
      // Vérifier si le rôle a au moins une des permissions requises
      let hasAnyPermission = false;
      for (const permName of permissionNames) {
        if (role.hasPermission(permName)) {
          hasAnyPermission = true;
          break;
        }
      }
      
      if (hasAnyPermission) {
        return; // Permission accordée
      }
      
      // Journaliser le refus d'accès
      auditDb.log(
        'permission_denied',
        'access',
        null,
        user.id,
        {
          requiredPermissions: permissionNames,
          role: role.name,
          url: event.node.req.url,
          method: event.node.req.method
        }
      );
      
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas les permissions requises pour effectuer cette action"
      });
    } catch (error) {
      if (error.statusCode) throw error; // Renvoyer nos erreurs personnalisées
      
      console.error("Erreur lors de la vérification des permissions :", error);
      throw createError({
        statusCode: 500,
        message: "Erreur serveur lors de la vérification des permissions"
      });
    }
  });
};

/**
 * Middleware pour journaliser les actions de gestion des permissions
 * @returns {Function} - Middleware H3
 */
export const logPermissionAction = () => {
  return defineEventHandler(async (event) => {
    const method = getMethod(event);
    const url = event.node.req.url;
    const user = event.context.user;
    
    // Enregistrer l'action dans le système d'audit
    auditDb.log(
      'permission_action',
      'permission',
      null,
      user?.id || null,
      {
        method,
        url,
        user: user ? `${user.name} (${user.id})` : 'Anonyme'
      }
    );
  });
};

/**
 * Exportation par défaut pour le middleware de permissions
 * Utilise requirePermission comme fonction principale
 */
export default defineEventHandler(async (event) => {
  // Ce middleware par défaut peut être personnalisé selon vos besoins
  // Par exemple, vérifier une permission de base ou journaliser toutes les requêtes
  
  // Journaliser l'accès
  if (event.context.user) {
    auditDb.log(
      'access',
      'general',
      null,
      event.context.user.id,
      {
        url: event.node.req.url,
        method: getMethod(event)
      }
    );
  }
  
  // Pas de blocage par défaut, juste logging
  return;
});