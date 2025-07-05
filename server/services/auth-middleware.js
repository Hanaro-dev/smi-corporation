/**
 * Authentication Middleware Service
 * Centralized authentication logic for API endpoints
 */
import { createError, getCookie } from 'h3';
import { sessionDb, userDb, roleDb } from '../utils/mock-db.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/api-constants.js';

/**
 * Authenticate user and populate context
 * @param {Event} event - H3 event object
 * @returns {Promise<Object>} User data with permissions
 */
export async function authenticateUser(event) {
  const token = getCookie(event, "auth_token");
  
  if (!token) {
    throw createError({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: ERROR_MESSAGES.AUTH.TOKEN_REQUIRED
    });
  }
  
  // Find session
  const session = sessionDb.findByToken(token);
  if (!session) {
    throw createError({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: ERROR_MESSAGES.AUTH.INVALID_SESSION
    });
  }
  
  // Find user
  const user = await userDb.findById(session.userId);
  if (!user) {
    throw createError({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: ERROR_MESSAGES.AUTH.USER_NOT_FOUND
    });
  }

  // Get user role with permissions
  const role = roleDb.findByPk(user.role_id);
  if (!role) {
    throw createError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES.AUTH.ROLE_NOT_FOUND
    });
  }

  // Prepare user without password
  const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
  delete userWithoutPassword.password;
  
  // Add permissions to user
  const permissions = role.getPermissions();
  userWithoutPassword.permissions = permissions.map(p => p.name);
  
  // Set context
  event.context.user = userWithoutPassword;
  event.context.userRole = role;
  event.context.permissions = permissions;

  return userWithoutPassword;
}

/**
 * Validate ID parameter
 * @param {string} id - ID parameter to validate
 * @param {string} paramName - Name of the parameter for error messages
 * @returns {number} Parsed ID
 */
export function validateIdParameter(id, paramName = 'ID') {
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `${paramName} invalide.`
    });
  }
  return parseInt(id);
}

/**
 * Handle database errors consistently
 * @param {Error} error - The error to handle
 * @param {string} operation - Description of the failed operation
 */
export function handleDatabaseError(error, operation = 'opération') {
  if (error.statusCode) {
    throw error; // Re-throw createError instances
  }
  
  // Handle Sequelize errors
  if (error.name && error.name.startsWith('Sequelize')) {
    console.error("Erreur de base de données:", error);
    throw createError({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: ERROR_MESSAGES.DATABASE.SERVICE_UNAVAILABLE
    });
  }
  
  console.error(`Erreur lors de ${operation}:`, error);
  throw createError({
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: `Erreur lors de ${operation}.`
  });
}