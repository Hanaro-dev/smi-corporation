// Environment variable validation and configuration
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validates required environment variables
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variable is missing
 */
function validateRequiredEnvVars(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Gets a required environment variable
 * @param {string} varName - Environment variable name
 * @param {string} [defaultValue] - Optional default value
 * @returns {string} Environment variable value
 * @throws {Error} If variable is missing and no default provided
 */
function getRequiredEnvVar(varName, defaultValue = null) {
  const value = process.env[varName];
  
  if (!value) {
    if (defaultValue !== null) {
      console.warn(`Environment variable ${varName} not set, using default value`);
      return defaultValue;
    }
    throw new Error(`Required environment variable ${varName} is not set`);
  }
  
  return value;
}

// Validate critical security environment variables
const REQUIRED_SECURITY_VARS = ['JWT_SECRET'];

try {
  validateRequiredEnvVars(REQUIRED_SECURITY_VARS);
} catch (error) {
  console.error('❌ Environment Configuration Error:', error.message);
  console.error('💡 Please create a .env file with the required variables:');
  console.error('   JWT_SECRET=your-secure-random-string-here');
  process.exit(1);
}

// Export validated configuration
export const config = {
  jwt: {
    secret: getRequiredEnvVar('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  database: {
    useMock: process.env.USE_MOCK_DB === 'true',
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql'
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000'), // 7 days
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800') // 7 days in seconds
  }
};

export { validateRequiredEnvVars, getRequiredEnvVar };