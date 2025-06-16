// Service d'audit pour journaliser les actions importantes
import fs from 'fs/promises';
import path from 'path';
import { formatISO } from 'date-fns';

// Configuration
const AUDIT_LOG_ENABLED = process.env.AUDIT_LOG_ENABLED !== 'false';
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || './logs/audit';
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Enregistre une action dans le journal d'audit
 * @param {Object} data - Les données à journaliser
 * @param {string} data.action - Type d'action (création, modification, suppression, etc.)
 * @param {string} data.entity - Entité concernée (rôle, permission, utilisateur, etc.)
 * @param {string} data.entityId - Identifiant de l'entité
 * @param {string} data.userId - Identifiant de l'utilisateur ayant effectué l'action
 * @param {string} data.userName - Nom de l'utilisateur ayant effectué l'action
 * @param {Object} data.details - Détails supplémentaires sur l'action
 */
export const logAuditAction = async (data) => {
  if (!AUDIT_LOG_ENABLED) return;

  try {
    const timestamp = formatISO(new Date());
    const logEntry = {
      timestamp,
      ...data,
    };

    // Créer le répertoire de logs s'il n'existe pas
    await fs.mkdir(AUDIT_LOG_PATH, { recursive: true });

    // Nom du fichier de log basé sur la date
    const logDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFilePath = path.join(AUDIT_LOG_PATH, `audit-${logDate}.log`);

    // Vérifier si le fichier existe déjà
    let stats;
    try {
      stats = await fs.stat(logFilePath);
    } catch (err) {
      // Le fichier n'existe pas encore
    }

    // Si le fichier est trop grand, créer un nouveau fichier avec timestamp
    if (stats && stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const newLogFilePath = path.join(AUDIT_LOG_PATH, `audit-${logDate}-${timestamp}.log`);
      await fs.appendFile(newLogFilePath, JSON.stringify(logEntry) + '\n', 'utf8');
    } else {
      // Ajouter l'entrée au fichier de log existant ou créer un nouveau
      await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', 'utf8');
    }
  } catch (error) {
    // En cas d'erreur, ne pas bloquer l'application mais logger l'erreur
    console.error('Erreur lors de l\'enregistrement dans le journal d\'audit:', error);
  }
};

/**
 * Enregistre une action liée aux rôles
 */
export const logRoleAction = async (action, roleId, roleName, userId, userName, details = {}) => {
  await logAuditAction({
    action,
    entity: 'role',
    entityId: roleId,
    entityName: roleName,
    userId,
    userName,
    details,
  });
};

/**
 * Enregistre une action liée aux permissions
 */
export const logPermissionAction = async (action, permissionId, permissionName, userId, userName, details = {}) => {
  await logAuditAction({
    action,
    entity: 'permission',
    entityId: permissionId,
    entityName: permissionName,
    userId,
    userName,
    details,
  });
};

/**
 * Enregistre une action liée à l'attribution de permissions
 */
export const logRolePermissionAction = async (action, roleId, roleName, permissionId, permissionName, userId, userName) => {
  await logAuditAction({
    action,
    entity: 'role_permission',
    entityId: `${roleId}_${permissionId}`,
    userId,
    userName,
    details: {
      roleId,
      roleName,
      permissionId,
      permissionName,
    },
  });
};

/**
 * Récupère les entrées récentes du journal d'audit (pour l'interface d'administration)
 * @param {number} limit - Nombre maximum d'entrées à récupérer
 * @param {string} entityType - Type d'entité à filtrer (optionnel)
 * @returns {Promise<Array>} - Entrées du journal d'audit
 */
export const getRecentAuditLogs = async (limit = 100, entityType = null) => {
  if (!AUDIT_LOG_ENABLED) return [];

  try {
    // Créer le répertoire de logs s'il n'existe pas
    await fs.mkdir(AUDIT_LOG_PATH, { recursive: true });

    // Lister tous les fichiers de log
    const files = await fs.readdir(AUDIT_LOG_PATH);
    
    // Filtrer pour ne garder que les fichiers de log d'audit et les trier par date (du plus récent au plus ancien)
    const logFiles = files
      .filter(file => file.startsWith('audit-') && file.endsWith('.log'))
      .sort()
      .reverse();

    // Lire les entrées des fichiers les plus récents
    const entries = [];
    for (const file of logFiles) {
      if (entries.length >= limit) break;

      const filePath = path.join(AUDIT_LOG_PATH, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Chaque ligne est une entrée JSON
      const fileEntries = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.error('Erreur lors du parsing d\'une entrée de log:', e);
            return null;
          }
        })
        .filter(entry => entry !== null && (!entityType || entry.entity === entityType));

      entries.push(...fileEntries);
      
      // Ne garder que le nombre d'entrées demandé
      if (entries.length > limit) {
        entries.length = limit;
      }
    }

    return entries;
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error);
    return [];
  }
};