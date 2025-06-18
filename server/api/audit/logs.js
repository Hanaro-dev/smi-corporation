import { getAuditLogs } from '../../services/audit-service.js';
import auth from '../../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../../middleware/check-permission.js';

export default defineEventHandler(async (event) => {
  // Protection de la route - seuls les utilisateurs avec permission admin ou manage_audit peuvent y accéder
  await auth(event);
  await requireAnyPermission(['admin', 'manage_audit'])(event);
  
  const method = getMethod(event);
  
  // GET /api/audit/logs - Récupérer les logs d'audit
  if (method === 'GET') {
    const { 
      page = 1, 
      limit = 20, 
      entity_type, 
      action, 
      entity_id, 
      user_id 
    } = getQuery(event);
    
    // Construire les filtres
    const filters = {};
    if (entity_type) filters.entityType = entity_type;
    if (action) filters.action = action;
    if (entity_id) filters.entityId = parseInt(entity_id);
    if (user_id) filters.userId = parseInt(user_id);
    
    // Récupérer les logs avec pagination
    const result = getAuditLogs(
      parseInt(page), 
      parseInt(limit), 
      filters
    );
    
    return result;
  }
  
  throw createError({
    statusCode: 405,
    message: "Méthode non autorisée"
  });
});