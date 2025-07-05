// Enhanced security utilities

import crypto from 'crypto';
import { setHeader } from 'h3';
import { config } from './env-validation.js';

/**
 * Enhanced HTML sanitization with configurable options
 */
export class AdvancedSanitizer {
  constructor() {
    this.defaultConfig = {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
      allowedAttributes: {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class', 'id']
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      maxLength: 10000
    };
  }

  sanitizeHtml(html, options = {}) {
    if (!html || typeof html !== 'string') return '';
    
    const config = { ...this.defaultConfig, ...options };
    let sanitized = html.substring(0, config.maxLength);

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove style tags and their content
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: urls
    sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
    
    // Remove data: urls (except for images if explicitly allowed)
    if (!options.allowDataUrls) {
      sanitized = sanitized.replace(/\s*data\s*:/gi, '');
    }
    
    // Validate and clean URLs in href and src attributes
    sanitized = this.sanitizeUrls(sanitized, config.allowedSchemes);
    
    // Remove non-allowed tags
    if (config.allowedTags.length > 0) {
      const allowedTags = config.allowedTags.join('|');
      const regex = new RegExp(`<(?!\\/?(?:${allowedTags})\\b)[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    return sanitized;
  }

  sanitizeUrls(html, allowedSchemes) {
    // Sanitize href attributes
    html = html.replace(/href\s*=\s*["']([^"']+)["']/gi, (match, url) => {
      const cleanUrl = this.validateUrl(url, allowedSchemes);
      return cleanUrl ? `href="${cleanUrl}"` : '';
    });

    // Sanitize src attributes
    html = html.replace(/src\s*=\s*["']([^"']+)["']/gi, (match, url) => {
      const cleanUrl = this.validateUrl(url, allowedSchemes);
      return cleanUrl ? `src="${cleanUrl}"` : '';
    });

    return html;
  }

  validateUrl(url, allowedSchemes) {
    try {
      const parsedUrl = new URL(url);
      if (allowedSchemes.includes(parsedUrl.protocol.slice(0, -1))) {
        return url;
      }
    } catch {
      // If URL parsing fails, check for relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        // Allow relative URLs but sanitize them
        return url.replace(/[<>"']/g, '');
      }
    }
    return null;
  }

  sanitizeText(text, maxLength = 1000) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>"`]/g, '') // Remove potential HTML and template injection chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, maxLength);
  }
}

/**
 * Enhanced rate limiting with sliding window
 */
export class SlidingWindowRateLimit {
  constructor() {
    this.windows = new Map();
    this.maxSize = 10000;
    
    // Cleanup old windows every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  isAllowed(identifier, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.windows.has(identifier)) {
      this.windows.set(identifier, []);
    }

    const requests = this.windows.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= limit) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.windows.set(identifier, validRequests);
    
    return true;
  }

  cleanup() {
    const now = Date.now();
    const cutoff = now - 3600000; // 1 hour
    
    for (const [key, requests] of this.windows.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > cutoff);
      
      if (validRequests.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, validRequests);
      }
    }
    
    // Limit memory usage
    if (this.windows.size > this.maxSize) {
      const keys = Array.from(this.windows.keys());
      const toDelete = keys.slice(0, keys.length - this.maxSize);
      toDelete.forEach(key => this.windows.delete(key));
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.windows.clear();
  }
}

/**
 * Secure token generation
 */
export class TokenGenerator {
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateNumericCode(length = 6) {
    const code = crypto.randomInt(0, Math.pow(10, length));
    return code.toString().padStart(length, '0');
  }

  static generateAPIKey(prefix = 'smi', length = 32) {
    const token = this.generateSecureToken(length);
    return `${prefix}_${token}`;
  }

  static hashToken(token, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(token).digest('hex');
  }
}

/**
 * Input validation with context-aware rules
 */
export class ContextualValidator {
  static validateEmail(email, context = {}) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check for common typos in domain
    const domain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const suspiciousDomain = commonDomains.find(d => 
      this.levenshteinDistance(domain, d) === 1 && domain !== d
    );
    
    if (suspiciousDomain && context.suggestCorrections) {
      console.warn(`Possible typo in email domain: ${domain}, did you mean ${suspiciousDomain}?`);
    }

    return email.toLowerCase().trim();
  }

  static validatePassword(password, options = {}) {
    const defaults = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '@$!%*?&',
      preventCommonPasswords: true
    };

    const config = { ...defaults, ...options };

    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }

    if (password.length < config.minLength) {
      throw new Error(`Password must be at least ${config.minLength} characters long`);
    }

    if (password.length > config.maxLength) {
      throw new Error(`Password must be no more than ${config.maxLength} characters long`);
    }

    const checks = [];
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      checks.push('one uppercase letter');
    }
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      checks.push('one lowercase letter');
    }
    if (config.requireNumbers && !/\d/.test(password)) {
      checks.push('one number');
    }
    if (config.requireSpecialChars) {
      const specialRegex = new RegExp(`[${config.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
      if (!specialRegex.test(password)) {
        checks.push(`one special character (${config.specialChars})`);
      }
    }

    if (checks.length > 0) {
      throw new Error(`Password must contain ${checks.join(', ')}`);
    }

    // Check against common passwords
    if (config.preventCommonPasswords) {
      const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123', 
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
      ];
      
      if (commonPasswords.includes(password.toLowerCase())) {
        throw new Error('Password is too common, please choose a more secure password');
      }
    }

    return password;
  }

  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

/**
 * Security headers helper
 */
export function setSecurityHeaders(event) {
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
  setHeader(event, 'X-Frame-Options', 'DENY');
  setHeader(event, 'X-XSS-Protection', '1; mode=block');
  setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader(event, 'Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    setHeader(event, 'Content-Security-Policy', 
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'");
  }
}

// Global instances
export const sanitizer = new AdvancedSanitizer();
export const rateLimiter = new SlidingWindowRateLimit();