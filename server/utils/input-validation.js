// Input validation and sanitization utilities

/**
 * Import ValidationError from error-handler
 */
import { ValidationError } from './error-handler.js';

// Simple HTML sanitization without external dependencies
function createSimplePurify() {
  return {
    sanitize: (html, options = {}) => {
      if (!html || typeof html !== 'string') return '';
      
      // Remove script tags and their content
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove dangerous attributes
      html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      html = html.replace(/\s*javascript\s*:/gi, '');
      
      // Keep only allowed tags if specified
      if (options.ALLOWED_TAGS) {
        const allowedTags = options.ALLOWED_TAGS.join('|');
        const regex = new RegExp(`<(?!\\/?(${allowedTags})\\b)[^>]*>`, 'gi');
        html = html.replace(regex, '');
      }
      
      return html;
    }
  };
}

const purify = createSimplePurify();

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Enhanced password validation regex
 * At least 8 chars, one uppercase, one lowercase, one number, one special char
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

/**
 * Username validation regex (alphanumeric and underscores only)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;

/**
 * Slug validation regex (lowercase letters, numbers, and hyphens)
 */
const SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Sanitizes HTML content
 * @param {string} html - Raw HTML content
 * @returns {string} Sanitized HTML
 */
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed']
  });
}

/**
 * Sanitizes plain text input with configurable length
 * @param {string} text - Raw text input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 */
function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potential HTML and quote chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, maxLength);
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
function isValidPassword(password) {
  return PASSWORD_REGEX.test(password);
}

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
function isValidUsername(username) {
  return username && USERNAME_REGEX.test(username);
}

/**
 * Validates slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid
 */
function isValidSlug(slug) {
  return slug && SLUG_REGEX.test(slug);
}

/**
 * Validates user registration data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validated and sanitized user data
 * @throws {ValidationError} If validation fails
 */
function validateUserRegistration(userData) {
  const { name, email, password, username } = userData;
  
  // Validate required fields
  if (!name || !email || !password) {
    throw new ValidationError('Nom, email et mot de passe sont requis');
  }
  
  // Validate email
  if (!isValidEmail(email)) {
    throw new ValidationError('Format d\'email invalide', 'email');
  }
  
  // Validate password
  if (!isValidPassword(password)) {
    throw new ValidationError(
      'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)',
      'password'
    );
  }
  
  // Validate username if provided
  if (username && !isValidUsername(username)) {
    throw new ValidationError(
      'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores (3-50 caractères)',
      'username'
    );
  }
  
  return {
    name: sanitizeText(name),
    email: email.toLowerCase().trim(),
    password: password, // Don't sanitize password as it will be hashed
    username: username ? sanitizeText(username) : null
  };
}

/**
 * Validates user login data
 * @param {Object} loginData - Login data to validate
 * @returns {Object} Validated login data
 * @throws {ValidationError} If validation fails
 */
function validateUserLogin(loginData) {
  const { email, password } = loginData;
  
  if (!email || !password) {
    throw new ValidationError('Email et mot de passe requis');
  }
  
  if (!isValidEmail(email)) {
    throw new ValidationError('Format d\'email invalide', 'email');
  }
  
  return {
    email: email.toLowerCase().trim(),
    password: password
  };
}

/**
 * Validates page data
 * @param {Object} pageData - Page data to validate
 * @returns {Object} Validated and sanitized page data
 * @throws {ValidationError} If validation fails
 */
function validatePageData(pageData) {
  const { title, content, slug, status, parentId } = pageData;
  
  if (!title) {
    throw new ValidationError('Le titre est requis', 'title');
  }
  
  if (title.length < 3 || title.length > 255) {
    throw new ValidationError('Le titre doit contenir entre 3 et 255 caractères', 'title');
  }
  
  if (slug && !isValidSlug(slug)) {
    throw new ValidationError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets', 'slug');
  }
  
  if (status && !['draft', 'published'].includes(status)) {
    throw new ValidationError('Statut invalide', 'status');
  }
  
  if (parentId && (!Number.isInteger(parentId) || parentId < 1)) {
    throw new ValidationError('ID parent invalide', 'parentId');
  }
  
  return {
    title: sanitizeText(title),
    content: content ? sanitizeHtml(content) : null,
    slug: slug ? slug.toLowerCase().trim() : null,
    status: status || 'draft',
    parentId: parentId || null
  };
}


/**
 * Generic input sanitization function
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
function sanitizeInput(input, maxLength = 255) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potential HTML and quote chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, maxLength);
}

export {
  sanitizeHtml,
  sanitizeText,
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidSlug,
  validateUserRegistration,
  validateUserLogin,
  validatePageData
};