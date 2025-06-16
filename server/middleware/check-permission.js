import { checkPermission, hasRole } from '../utils/permission-utils.js';
import { Role, Permission } from '../models.js';

/**
 * Middleware pour vérifier si l'utilisateur a une permission spécifique
 * @param {string} permissionName - Le nom de la permission requise
 * @returns {Function} - Middleware H3
 */
export const requirePermission = (permissionName) => {
  return defineEventHandler(async (event) => {
    try {
      await checkPermission(event, permissionName);
    } catch (error) {
      throw createError({
        statusCode: error.statusCode || 403,
        message: error.message || "Accès refusé",
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
      await hasRole(event, roleName);
    } catch (error) {
      throw createError({
        statusCode: error.statusCode || 403,
        message: error.message || "Accès refusé",
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
    // Si l'utilisateur n'est pas dans le contexte, il n'est pas authentifié
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        message: "Authentification requise",
      });
    }

    const user = event.context.user;
    let hasAnyPermission = false;

    // Si on utilise la base de données simulée
    if (process.env.USE_MOCK_DB === 'true') {
      // En mode simulé, les permissions sont directement sur l'utilisateur
      if (user.permissions) {
        // Vérifier si l'utilisateur a au moins une des permissions requises
        hasAnyPermission = permissionNames.some(permission => 
          user.permissions.includes(permission)
        );

        // Si l'utilisateur est admin, il a toutes les permissions
        if (user.permissions.includes('admin')) {
          hasAnyPermission = true;
        }
      }
    } 
    else {
      try {
        // Récupérer le rôle de l'utilisateur avec ses permissions
        const userRole = await Role.findByPk(user.role_id, {
          include: [{ model: Permission }]
        });
        
        if (!userRole) {
          throw createError({
            statusCode: 403,
            message: "Aucun rôle attribué à cet utilisateur",
          });
        }
        
        // Vérifier si le rôle a au moins une des permissions requises
        hasAnyPermission = permissionNames.some(permName => 
          userRole.Permissions.some(permission => permission.name === permName)
        );
        
        // Vérifier si le rôle a la permission 'admin' qui donne accès à tout
        const isAdmin = userRole.Permissions.some(
          permission => permission.name === 'admin'
        );
        
        if (isAdmin) {
          hasAnyPermission = true;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des permissions :", error);
        throw createError({
          statusCode: 500,
          message: "Erreur serveur lors de la vérification des permissions",
        });
      }
    }

    if (!hasAnyPermission) {
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas les permissions requises pour effectuer cette action",
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
    
    // Enregistrer l'action dans les logs
    console.log(`[${new Date().toISOString()}] Action sur les permissions - Utilisateur: ${user?.name || 'Anonyme'} (ID: ${user?.id || 'N/A'}) - Méthode: ${method} - URL: ${url}`);
    
    // Dans un environnement de production, on pourrait stocker ces logs dans une base de données
    // ou un service de logging externe
  });
};