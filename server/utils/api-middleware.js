// Common API middleware for improved code quality and consistency
import jwt from 'jsonwebtoken';
import { config } from './env-validation.js';
import { checkRateLimit } from './input-validation.js';
import { ValidationError } from './error-handler.js';
import { userCache, cacheKeys } from './cache.js';
import { userDb } from './mock-db.js';

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Middleware function
 */
export function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (event) => {
    const clientIP = getClientIP(event);
    
    if (!checkRateLimit(clientIP, maxRequests, windowMs)) {
      throw createError({
        statusCode: 429,
        message: "Trop de requêtes. Veuillez réessayer plus tard."
      });
    }
  };
}

/**
 * Authentication middleware
 * @param {Event} event - Nuxt event object
 * @returns {Object} User object if authenticated
 * @throws {Error} If not authenticated
 */
export async function requireAuth(event) {
  const token = getCookie(event, 'auth_token') || getHeader(event, 'authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw createError({
      statusCode: 401,
      message: "Token d'authentification requis"
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from cache or database
    const user = await userCache.getOrSet(
      cacheKeys.user(decoded.id),
      async () => {
        const userData = userDb.findByPk(decoded.id);
        return userData ? userData.toJSON() : null;
      },
      300000 // 5 minutes
    );
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Utilisateur non trouvé"
      });
    }
    
    // Add user to event context
    event.context.user = user;
    event.context.userId = user.id;
    
    return user;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw createError({
        statusCode: 401,
        message: "Token invalide"
      });
    }
    if (error.name === 'TokenExpiredError') {
      throw createError({
        statusCode: 401,
        message: "Token expiré"
      });
    }
    throw error;
  }
}

/**
 * Permission check middleware
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @returns {Function} Middleware function
 */
export function requirePermission(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  
  return async (event) => {
    const user = await requireAuth(event);
    
    // Get user permissions from cache
    const userPermissions = await userCache.getOrSet(
      cacheKeys.userPermissions(user.id),
      async () => {
        // Mock permission check - in real app, query database
        const rolePermissionsMap = {
          1: ['admin', 'edit', 'view', 'manage_users', 'manage_roles', 'manage_permissions'],
          2: ['edit', 'view'],
          3: ['view']
        };
        return rolePermissionsMap[user.role_id] || [];
      },
      600000 // 10 minutes
    );
    
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('admin')
    );
    
    if (!hasPermission) {
      throw createError({
        statusCode: 403,
        message: "Permissions insuffisantes"
      });
    }
    
    return user;
  };
}

/**
 * Admin-only middleware
 * @param {Event} event - Nuxt event object
 * @returns {Object} User object if admin
 */
export async function requireAdmin(event) {
  return await requirePermission('admin')(event);
}

/**
 * Input validation middleware
 * @param {Function} validator - Validation function
 * @returns {Function} Middleware function
 */
export function validateInput(validator) {
  return async (event) => {
    const body = await readBody(event);
    
    try {
      const validatedData = validator(body);
      event.context.validatedData = validatedData;
      return validatedData;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw createError({
          statusCode: 400,
          message: error.message,
          data: { field: error.field }
        });
      }
      throw error;
    }
  };
}

/**
 * Pagination middleware
 * @param {number} defaultLimit - Default items per page
 * @param {number} maxLimit - Maximum items per page
 * @returns {Function} Middleware function
 */
export function paginate(defaultLimit = 10, maxLimit = 100) {
  return (event) => {
    const query = getQuery(event);
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
    const offset = (page - 1) * limit;
    
    event.context.pagination = {
      page,
      limit,
      offset,
      skip: offset
    };
    
    return { page, limit, offset, skip: offset };
  };
}

/**
 * Error handling wrapper
 * @param {Function} handler - API handler function
 * @returns {Function} Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      // Log error for debugging
      console.error('API Error:', {
        url: event.node.req.url,
        method: event.node.req.method,
        error: error.message,
        stack: error.stack,
        user: event.context.user?.id
      });
      
      // Re-throw createError instances
      if (error.statusCode) {
        throw error;
      }
      
      // Handle validation errors
      if (error instanceof ValidationError) {
        throw createError({
          statusCode: 400,
          message: error.message
        });
      }
      
      // Handle database errors
      if (error.name === 'SequelizeValidationError') {
        throw createError({
          statusCode: 400,
          message: 'Données invalides',
          data: error.errors?.map(e => ({ field: e.path, message: e.message }))
        });
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw createError({
          statusCode: 409,
          message: 'Cette valeur est déjà utilisée'
        });
      }
      
      // Generic server error
      throw createError({
        statusCode: 500,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
      });
    }
  };
}

/**
 * Logging middleware
 * @param {Event} event - Nuxt event object
 */
export function logRequest(event) {
  const start = Date.now();
  const { method, url } = event.node.req;
  const userAgent = getHeader(event, 'user-agent');
  const clientIP = getClientIP(event);
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${clientIP} - ${userAgent}`);
  
  // Log response time on completion
  event.node.res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = event.node.res.statusCode;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} - ${duration}ms`);
  });
}

/**
 * CORS middleware
 * @param {Object} options - CORS options
 * @returns {Function} Middleware function
 */
export function cors(options = {}) {
  const defaultOptions = {
    origin: process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  
  const corsOptions = { ...defaultOptions, ...options };
  
  return (event) => {
    const origin = getHeader(event, 'origin');
    
    if (corsOptions.origin === '*' || (Array.isArray(corsOptions.origin) && corsOptions.origin.includes(origin))) {
      setHeader(event, 'Access-Control-Allow-Origin', origin || '*');
    }
    
    setHeader(event, 'Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    setHeader(event, 'Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    
    if (corsOptions.credentials) {
      setHeader(event, 'Access-Control-Allow-Credentials', 'true');
    }
    
    // Handle preflight requests
    if (event.node.req.method === 'OPTIONS') {
      setResponseStatus(event, 204);
      return '';
    }
  };
}

/**
 * Cache control middleware
 * @param {number} maxAge - Cache max age in seconds
 * @param {boolean} isPrivate - Whether cache is private
 * @returns {Function} Middleware function
 */
export function cacheControl(maxAge = 300, isPrivate = false) {
  return (event) => {
    const cacheValue = isPrivate ? 'private' : 'public';
    setHeader(event, 'Cache-Control', `${cacheValue}, max-age=${maxAge}`);
  };
}

/**
 * Compose multiple middleware functions
 * @param {...Function} middlewares - Middleware functions
 * @returns {Function} Composed middleware function
 */
export function compose(...middlewares) {
  return async (event) => {
    for (const middleware of middlewares) {
      await middleware(event);
    }
  };
}

// Helper to get client IP
function getClientIP(event) {
  return getHeader(event, 'x-forwarded-for') || 
         getHeader(event, 'x-real-ip') || 
         event.node.req.socket.remoteAddress || 
         'unknown';
}