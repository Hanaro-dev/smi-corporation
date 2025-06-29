// Enhanced error handling utilities

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.type = 'validation';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'authentication';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.type = 'authorization';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.type = 'not_found';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.type = 'conflict';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.type = 'rate_limit';
  }
}

/**
 * Error logger with structured logging
 */
class ErrorLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'error';
  }

  log(error, context = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
      type: error.type || 'unknown',
      isOperational: error.isOperational || false,
      context
    };

    // In production, you might want to send this to an external service
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service
      this.sendToExternalService(logData);
    } else {
      // Development logging
      console.error('🚨 Application Error:', JSON.stringify(logData, null, 2));
    }
  }

  sendToExternalService(logData) {
    // Placeholder for external logging service integration
    // Could be Sentry, LogRocket, Winston, etc.
    console.error('[EXTERNAL LOG]', logData);
  }
}

/**
 * Global error handler for Nuxt/Nitro
 */
export function createErrorHandler() {
  const logger = new ErrorLogger();

  return (error, event) => {
    const context = {
      url: event?.node?.req?.url,
      method: event?.node?.req?.method,
      userAgent: event?.node?.req?.headers?.['user-agent'],
      ip: event?.node?.req?.headers?.['x-forwarded-for'] || 
          event?.node?.req?.socket?.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Log the error
    logger.log(error, context);

    // Determine response based on error type
    if (error instanceof AppError) {
      return createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
        data: {
          type: error.type,
          field: error.field || undefined,
          timestamp: error.timestamp
        }
      });
    }

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: {
          type: 'validation',
          errors: validationErrors,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
        data: {
          type: 'authentication',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Handle database connection errors
    if (error.name === 'SequelizeConnectionError') {
      return createError({
        statusCode: 503,
        statusMessage: 'Service temporarily unavailable',
        data: {
          type: 'database',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generic error fallback
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    return createError({
      statusCode: 500,
      statusMessage: isDevelopment ? error.message : 'Internal server error',
      data: {
        type: 'internal',
        stack: isDevelopment ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    });
  };
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export function asyncErrorHandler(fn) {
  return async (event) => {
    try {
      return await fn(event);
    } catch (error) {
      const errorHandler = createErrorHandler();
      throw errorHandler(error, event);
    }
  };
}

/**
 * Validation error helper
 * @param {string} message - Error message
 * @param {string} field - Field that caused the error
 * @throws {ValidationError}
 */
export function throwValidationError(message, field = null) {
  throw new ValidationError(message, field);
}

/**
 * HTTP status code helpers
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Response helpers
 */
export function createSuccessResponse(data, message = 'Success', statusCode = 200) {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(message, statusCode = 500, details = null) {
  return {
    success: false,
    statusCode,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

// Global error logger instance
export const errorLogger = new ErrorLogger();