// Centralized configuration management
import { config as envConfig } from '../utils/env-validation.js'

/**
 * Application configuration with type safety and validation
 */
export const appConfig = {
  // Application settings
  app: {
    name: process.env.APP_NAME || 'SMI Corporation',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    port: parseInt(process.env.PORT) || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },

  // Database configuration
  database: {
    useMock: process.env.USE_MOCK_DB === 'true',
    
    // Real database settings
    dialect: process.env.DB_DIALECT || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'smi_corporation',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    
    // SQLite settings
    storage: process.env.DB_STORAGE || './database.sqlite',
    
    // Connection pool settings
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },

    // Migration settings
    migrations: {
      autoRun: process.env.DB_AUTO_MIGRATE === 'true',
      path: './server/migrations',
      pattern: /\.js$/
    }
  },

  // Authentication & Security
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    
    // Session settings
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24h
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000, // 24h
    
    // Password requirements
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
      maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128
    },

    // Account lockout settings
    lockout: {
      maxAttempts: parseInt(process.env.AUTH_MAX_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION) || 15 * 60 * 1000, // 15 min
      resetTime: parseInt(process.env.AUTH_RESET_TIME) || 60 * 60 * 1000 // 1 hour
    }
  },

  // CSRF Protection
  csrf: {
    enabled: process.env.CSRF_ENABLED !== 'false',
    secret: process.env.CSRF_SECRET || process.env.JWT_SECRET,
    cookieKey: process.env.CSRF_COOKIE_KEY || 'XSRF-TOKEN',
    headerKey: process.env.CSRF_HEADER_KEY || 'x-xsrf-token',
    cookieHttpOnly: process.env.CSRF_COOKIE_HTTP_ONLY !== 'false',
    cookieSameSite: process.env.CSRF_COOKIE_SAME_SITE || 'strict',
    excludedPaths: [
      '/api/_auth/session',
      '/api/auth/logout'
    ]
  },

  // Rate Limiting
  rateLimit: {
    // Global rate limiting
    global: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false'
    },
    
    // API specific limits
    api: {
      maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX) || 1000,
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 60 * 60 * 1000 // 1 hour
    },
    
    // Authentication endpoints
    auth: {
      maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15 * 60 * 1000 // 15 minutes
    }
  },

  // Caching configuration
  cache: {
    // Memory cache settings
    memory: {
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 5 * 60 * 1000, // 5 minutes
      maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
      cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL) || 5 * 60 * 1000 // 5 minutes
    },

    // Redis settings (for production)
    redis: {
      enabled: process.env.REDIS_ENABLED === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DATABASE) || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'smi:',
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
      lazyConnect: true
    },

    // Cache TTL by type
    ttl: {
      user: parseInt(process.env.CACHE_TTL_USER) || 10 * 60 * 1000, // 10 minutes
      page: parseInt(process.env.CACHE_TTL_PAGE) || 15 * 60 * 1000, // 15 minutes
      role: parseInt(process.env.CACHE_TTL_ROLE) || 30 * 60 * 1000, // 30 minutes
      navigation: parseInt(process.env.CACHE_TTL_NAVIGATION) || 30 * 60 * 1000, // 30 minutes
      session: parseInt(process.env.CACHE_TTL_SESSION) || 5 * 60 * 1000 // 5 minutes
    }
  },

  // File upload settings
  uploads: {
    // Image uploads
    images: {
      enabled: process.env.UPLOADS_IMAGES_ENABLED !== 'false',
      maxSize: parseInt(process.env.UPLOADS_IMAGES_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
      allowedTypes: (process.env.UPLOADS_IMAGES_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
      path: process.env.UPLOADS_IMAGES_PATH || './public/uploads/images',
      urlPrefix: process.env.UPLOADS_IMAGES_URL_PREFIX || '/uploads/images',
      
      // Image processing
      processing: {
        enabled: process.env.IMAGE_PROCESSING_ENABLED !== 'false',
        quality: parseInt(process.env.IMAGE_QUALITY) || 85,
        thumbnails: {
          enabled: process.env.IMAGE_THUMBNAILS_ENABLED !== 'false',
          sizes: (process.env.IMAGE_THUMBNAIL_SIZES || '150x150,300x300,600x600').split(',')
        }
      }
    },

    // General file uploads
    files: {
      enabled: process.env.UPLOADS_FILES_ENABLED !== 'false',
      maxSize: parseInt(process.env.UPLOADS_FILES_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedTypes: (process.env.UPLOADS_FILES_ALLOWED_TYPES || 'application/pdf,text/plain,application/msword').split(','),
      path: process.env.UPLOADS_FILES_PATH || './public/uploads/files',
      urlPrefix: process.env.UPLOADS_FILES_URL_PREFIX || '/uploads/files'
    }
  },

  // Email configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    
    // SMTP settings
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD
    },
    
    // Default sender
    from: {
      name: process.env.EMAIL_FROM_NAME || 'SMI Corporation',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@smi-corporation.com'
    },

    // Email templates
    templates: {
      path: process.env.EMAIL_TEMPLATES_PATH || './server/templates/emails',
      engine: process.env.EMAIL_TEMPLATE_ENGINE || 'handlebars'
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    
    // File logging
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || './logs',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5
    },

    // External logging services
    external: {
      sentry: {
        enabled: process.env.SENTRY_ENABLED === 'true',
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE || process.env.npm_package_version
      }
    }
  },

  // API configuration
  api: {
    // Pagination defaults
    pagination: {
      defaultLimit: parseInt(process.env.API_DEFAULT_LIMIT) || 10,
      maxLimit: parseInt(process.env.API_MAX_LIMIT) || 100,
      defaultOffset: parseInt(process.env.API_DEFAULT_OFFSET) || 0
    },

    // CORS settings
    cors: {
      enabled: process.env.CORS_ENABLED !== 'false',
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS !== 'false',
      methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,PATCH,OPTIONS').split(','),
      allowedHeaders: (process.env.CORS_HEADERS || 'Content-Type,Authorization,X-Requested-With').split(',')
    },

    // Response settings
    response: {
      includeTimestamp: process.env.API_INCLUDE_TIMESTAMP !== 'false',
      includeRequestId: process.env.API_INCLUDE_REQUEST_ID !== 'false',
      enableCompression: process.env.API_ENABLE_COMPRESSION !== 'false'
    }
  },

  // Performance monitoring
  performance: {
    // APM settings
    apm: {
      enabled: process.env.APM_ENABLED === 'true',
      serviceName: process.env.APM_SERVICE_NAME || 'smi-corporation',
      serverUrl: process.env.APM_SERVER_URL,
      secretToken: process.env.APM_SECRET_TOKEN
    },

    // Request timeout
    timeout: {
      api: parseInt(process.env.API_TIMEOUT) || 30000, // 30 seconds
      database: parseInt(process.env.DB_TIMEOUT) || 10000, // 10 seconds
      external: parseInt(process.env.EXTERNAL_TIMEOUT) || 15000 // 15 seconds
    }
  },

  // Feature flags
  features: {
    userRegistration: process.env.FEATURE_USER_REGISTRATION !== 'false',
    passwordReset: process.env.FEATURE_PASSWORD_RESET !== 'false',
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    twoFactorAuth: process.env.FEATURE_2FA === 'true',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
  }
}

/**
 * Validate configuration on startup
 */
export function validateConfig() {
  const errors = []

  // Validate required settings
  if (!appConfig.auth.jwtSecret || appConfig.auth.jwtSecret === 'fallback-dev-secret-change-in-production') {
    if (appConfig.app.isProduction) {
      errors.push('JWT_SECRET must be set in production')
    }
  }

  if (appConfig.database.useMock && appConfig.app.isProduction) {
    errors.push('Cannot use mock database in production')
  }

  if (appConfig.auth.jwtSecret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long')
  }

  // Validate database connection settings
  if (!appConfig.database.useMock) {
    if (!appConfig.database.host) {
      errors.push('DB_HOST is required when not using mock database')
    }
    if (!appConfig.database.name) {
      errors.push('DB_NAME is required when not using mock database')
    }
  }

  // Validate email settings if enabled
  if (appConfig.email.enabled) {
    if (!appConfig.email.smtp.host) {
      errors.push('SMTP_HOST is required when email is enabled')
    }
    if (!appConfig.email.from.address) {
      errors.push('EMAIL_FROM_ADDRESS is required when email is enabled')
    }
  }

  // Validate upload paths
  if (appConfig.uploads.images.enabled && !appConfig.uploads.images.path) {
    errors.push('UPLOADS_IMAGES_PATH is required when image uploads are enabled')
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:')
    errors.forEach(error => console.error(`   - ${error}`))
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`)
  }

  console.log('✅ Configuration validation passed')
  return true
}

/**
 * Get configuration for specific module
 */
export function getConfig(module) {
  if (!appConfig[module]) {
    throw new Error(`Configuration module '${module}' not found`)
  }
  return appConfig[module]
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature) {
  return appConfig.features[feature] === true
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isDevelopment: appConfig.app.isDevelopment,
    isProduction: appConfig.app.isProduction,
    isTest: appConfig.app.isTest,
    environment: appConfig.app.environment
  }
}

// Export individual configs for convenience
export const {
  app: appSettings,
  database: dbConfig,
  auth: authConfig,
  cache: cacheConfig,
  api: apiConfig,
  features: featureFlags
} = appConfig

// Validate configuration on module load
if (process.env.NODE_ENV !== 'test') {
  validateConfig()
}