/**
 * Audit Service
 * Centralized audit logging for consistent activity tracking
 */
import { getRequestIP, getHeader } from 'h3';
import { auditDb } from '../utils/mock-db.js';
import { AUDIT_ACTIONS } from '../constants/api-constants.js';
import type { AuthenticatedEvent, User, Organigramme, AuditLogInput } from '../types/index.js';

export class AuditService {
  /**
   * Log an audit event
   * @param event - H3 event object
   * @param action - Action performed
   * @param details - Description of the action
   * @param userId - ID of the user performing the action
   * @param targetId - ID of the target resource (optional)
   * @param metadata - Additional metadata (optional)
   */
  static async log(
    event: AuthenticatedEvent, 
    action: string, 
    details: string, 
    userId: number | null = null, 
    targetId: number | null = null, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const auditData: AuditLogInput = {
        userId,
        action,
        entityType: action.split('_')[0] || 'unknown',
        entityId: targetId,
        newData: {
          details,
          ...metadata,
          timestamp: new Date().toISOString()
        },
        ipAddress: getRequestIP(event) || 'unknown',
        userAgent: getHeader(event, 'user-agent') || 'unknown'
      };

      await auditDb.create(auditData);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break main functionality
    }
  }

  /**
   * Log authentication events
   */
  static async logLogin(event: AuthenticatedEvent, user: Partial<User>, success: boolean = true, reason: string | null = null): Promise<void> {
    const action = success ? AUDIT_ACTIONS.LOGIN : AUDIT_ACTIONS.LOGIN_FAILED;
    const userId = success ? user.id : null;
    const details = success 
      ? `Connexion réussie: ${user.email}` 
      : `Tentative de connexion échouée: ${user?.email || 'email inconnu'}`;
    
    await this.log(event, action, details, userId || undefined, null, {
      email: user?.email,
      role: user?.role || 'unknown',
      reason
    });
  }

  static async logLogout(event: AuthenticatedEvent, user: User): Promise<void> {
    await this.log(event, AUDIT_ACTIONS.LOGOUT, `Déconnexion: ${user.email}`, user.id);
  }

  /**
   * Log organigramme events
   */
  static async logOrganigrammeCreate(event: AuthenticatedEvent, organigramme: Organigramme, userId: number): Promise<void> {
    await this.log(
      event, 
      AUDIT_ACTIONS.ORGANIGRAMME_CREATE,
      `Organigramme créé: ${organigramme.title}`,
      userId,
      organigramme.id,
      { title: organigramme.title, status: organigramme.status }
    );
  }

  static async logOrganigrammeUpdate(event: AuthenticatedEvent, organigramme: Organigramme, userId: number): Promise<void> {
    await this.log(
      event,
      AUDIT_ACTIONS.ORGANIGRAMME_UPDATE,
      `Organigramme modifié: ${organigramme.title} (ID: ${organigramme.id})`,
      userId,
      organigramme.id,
      { title: organigramme.title, status: organigramme.status }
    );
  }

  static async logOrganigrammeDelete(event: AuthenticatedEvent, organigramme: Organigramme, userId: number): Promise<void> {
    await this.log(
      event,
      AUDIT_ACTIONS.ORGANIGRAMME_DELETE,
      `Organigramme supprimé: ${organigramme.title} (ID: ${organigramme.id})`,
      userId,
      organigramme.id,
      { title: organigramme.title }
    );
  }

  /**
   * Log user management events
   */
  static async logUserCreate(event: AuthenticatedEvent, newUser: User, adminUserId: number): Promise<void> {
    await this.log(
      event,
      AUDIT_ACTIONS.USER_CREATE,
      `Utilisateur créé: ${newUser.email}`,
      adminUserId,
      newUser.id,
      { email: newUser.email, role: newUser.role_id }
    );
  }

  static async logUserUpdate(event: AuthenticatedEvent, user: User, adminUserId: number): Promise<void> {
    await this.log(
      event,
      AUDIT_ACTIONS.USER_UPDATE,
      `Utilisateur modifié: ${user.email} (ID: ${user.id})`,
      adminUserId,
      user.id,
      { email: user.email }
    );
  }

  static async logUserDelete(event: AuthenticatedEvent, user: User, adminUserId: number): Promise<void> {
    await this.log(
      event,
      AUDIT_ACTIONS.USER_DELETE,
      `Utilisateur supprimé: ${user.email} (ID: ${user.id})`,
      adminUserId,
      user.id,
      { email: user.email }
    );
  }
}

/**
 * Legacy functions for backward compatibility
 * @deprecated Use AuditService class methods instead
 */
export const logUserAction = async (actionType: string, userId: number, performedBy: number, details: Record<string, any> = {}): Promise<any> => {
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
 * @param actionType - Type d'action (create, update, delete)
 * @param roleId - ID du rôle concerné
 * @param roleName - Nom du rôle
 * @param performedBy - ID de l'utilisateur qui a effectué l'action
 * @param details - Détails supplémentaires sur l'action
 * @returns L'entrée de journal créée
 */
export const logRoleAction = async (
  actionType: string, 
  roleId: number, 
  roleName: string, 
  performedBy: number, 
  details: Record<string, any> = {}
): Promise<any> => {
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
 * @param actionType - Type d'action (create, update, delete)
 * @param permissionId - ID de la permission concernée
 * @param permissionName - Nom de la permission
 * @param performedBy - ID de l'utilisateur qui a effectué l'action
 * @param details - Détails supplémentaires sur l'action
 * @returns L'entrée de journal créée
 */
export const logPermissionAction = async (
  actionType: string, 
  permissionId: number, 
  permissionName: string, 
  performedBy: number, 
  details: Record<string, any> = {}
): Promise<any> => {
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
 * @param actionType - Type d'action (assign, remove)
 * @param roleId - ID du rôle
 * @param roleName - Nom du rôle
 * @param permissionId - ID de la permission
 * @param permissionName - Nom de la permission
 * @param performedBy - ID de l'utilisateur qui a effectué l'action
 * @param details - Détails supplémentaires sur l'action
 * @returns L'entrée de journal créée
 */
export const logRolePermissionAction = async (
  actionType: string,
  roleId: number,
  roleName: string,
  permissionId: number,
  permissionName: string,
  performedBy: number,
  details: Record<string, any> = {}
): Promise<any> => {
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
 * @param page - Numéro de page (commence à 1)
 * @param limit - Nombre d'éléments par page
 * @param filters - Filtres à appliquer (entityType, action, entityId, userId)
 * @returns { logs, total, page, limit, totalPages }
 */
export const getAuditLogs = (
  page: number = 1, 
  limit: number = 20, 
  filters: Record<string, any> = {}
): { logs: any[], total: number, page: number, limit: number, totalPages: number } => {
  const offset = (page - 1) * limit;
  
  const options = {
    limit,
    offset,
    where: {} as Record<string, any>
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
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre maximum d'actions à retourner
 * @returns Liste des dernières actions de l'utilisateur
 */
export const getUserActivityLog = (userId: number, limit: number = 10): any[] => {
  const options = {
    where: { userId: parseInt(userId.toString()) },
    limit
  };
  
  return auditDb.findAll(options);
};

/**
 * Récupère l'historique des modifications pour une entité spécifique
 * @param entityType - Type d'entité (user, role, permission, role_permission)
 * @param entityId - ID de l'entité
 * @param limit - Nombre maximum d'entrées à retourner
 * @returns Liste des modifications de l'entité
 */
export const getEntityHistory = (entityType: string, entityId: number, limit: number = 20): any[] => {
  const options = {
    where: {
      entityType,
      entityId: parseInt(entityId.toString())
    },
    limit
  };
  
  return auditDb.findAll(options);
};