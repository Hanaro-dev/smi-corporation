import { auditDb } from '../utils/mock-db.js';

/**
 * Journalise une action sur un utilisateur
 * @param {string} actionType - Type d'action (create, update, delete, login, logout)
 * @param {number} userId - ID de l'utilisateur concerné
 * @param {number} performedBy - ID de l'utilisateur qui a effectué l'action
 * @param {Object} details - Détails supplémentaires sur l'action
 * @returns {Object} - L'entrée de journal créée
 */
export const logUserAction = async (actionType, userId, performedBy, details = {}) => {
  return auditDb.log(
    actionType,
    'user',
    userId,
    performedBy,
    details
  );
};

/**
 * Journalise une action sur un rôle
 * @param {string} actionType - Type d'action (create, update, delete)
 * @param {number} roleId - ID du rôle concerné
 * @param {string} roleName - Nom du rôle
 * @param {number} performedBy - ID de l'utilisateur qui a effectué l'action
 * @param {Object} details - Détails supplémentaires sur l'action
 * @returns {Object} - L'entrée de journal créée
 */
export const logRoleAction = async (actionType, roleId, roleName, performedBy, details = {}) => {
  return auditDb.log(
    actionType,
    'role',
    roleId,
    performedBy,
    { roleName, ...details }
  );
};

/**
 * Journalise une action sur une permission
 * @param {string} actionType - Type d'action (create, update, delete)
 * @param {number} permissionId - ID de la permission concernée
 * @param {string} permissionName - Nom de la permission
 * @param {number} performedBy - ID de l'utilisateur qui a effectué l'action
 * @param {Object} details - Détails supplémentaires sur l'action
 * @returns {Object} - L'entrée de journal créée
 */
export const logPermissionAction = async (actionType, permissionId, permissionName, performedBy, details = {}) => {
  return auditDb.log(
    actionType,
    'permission',
    permissionId,
    performedBy,
    { permissionName, ...details }
  );
};

/**
 * Journalise une action sur l'attribution d'une permission à un rôle
 * @param {string} actionType - Type d'action (assign, remove)
 * @param {number} roleId - ID du rôle
 * @param {string} roleName - Nom du rôle
 * @param {number} permissionId - ID de la permission
 * @param {string} permissionName - Nom de la permission
 * @param {number} performedBy - ID de l'utilisateur qui a effectué l'action
 * @param {Object} details - Détails supplémentaires sur l'action
 * @returns {Object} - L'entrée de journal créée
 */
export const logRolePermissionAction = async (
  actionType,
  roleId,
  roleName,
  permissionId,
  permissionName,
  performedBy,
  details = {}
) => {
  return auditDb.log(
    actionType,
    'role_permission',
    roleId,
    performedBy,
    { 
      roleName,
      permissionId,
      permissionName,
      ...details
    }
  );
};

/**
 * Récupère les journaux d'audit avec pagination
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} limit - Nombre d'éléments par page
 * @param {Object} filters - Filtres à appliquer (entityType, action, entityId, userId)
 * @returns {Object} - { logs, total, page, limit, totalPages }
 */
export const getAuditLogs = (page = 1, limit = 20, filters = {}) => {
  const offset = (page - 1) * limit;
  
  const options = {
    limit,
    offset,
    where: {}
  };
  
  // Appliquer les filtres
  if (filters.entityType) options.where.entityType = filters.entityType;
  if (filters.action) options.where.action = filters.action;
  if (filters.entityId) options.where.entityId = parseInt(filters.entityId);
  if (filters.userId) options.where.userId = parseInt(filters.userId);
  
  // Récupérer les logs
  const logs = auditDb.findAll(options);
  
  // Compter le total pour la pagination
  const allLogs = auditDb.findAll({ where: options.where });
  
  return {
    logs,
    total: allLogs.length,
    page,
    limit,
    totalPages: Math.ceil(allLogs.length / limit)
  };
};

/**
 * Récupère les dernières actions pour un utilisateur spécifique
 * @param {number} userId - ID de l'utilisateur
 * @param {number} limit - Nombre maximum d'actions à retourner
 * @returns {Array} - Liste des dernières actions de l'utilisateur
 */
export const getUserActivityLog = (userId, limit = 10) => {
  const options = {
    where: { userId: parseInt(userId) },
    limit
  };
  
  return auditDb.findAll(options);
};

/**
 * Récupère l'historique des modifications pour une entité spécifique
 * @param {string} entityType - Type d'entité (user, role, permission, role_permission)
 * @param {number} entityId - ID de l'entité
 * @param {number} limit - Nombre maximum d'entrées à retourner
 * @returns {Array} - Liste des modifications de l'entité
 */
export const getEntityHistory = (entityType, entityId, limit = 20) => {
  const options = {
    where: {
      entityType,
      entityId: parseInt(entityId)
    },
    limit
  };
  
  return auditDb.findAll(options);
};