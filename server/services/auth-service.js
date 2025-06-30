// Authentication service layer
import jwt from 'jsonwebtoken';
import { userDb, sessionDb, roleDb, auditDb } from '../utils/mock-db.js';
import { authConfig, appSettings } from '../config/index.js';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils/error-handler.js';
import { userRepository } from '../repositories/index.js';

export class AuthService {
  /**
   * Authenticate user and create session
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} clientIP - Client IP address
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>} Authentication result
   */
  static async authenticate(email, password, clientIP, userAgent) {
    try {
      // Find user by email using repository
      const user = await userRepository.findByEmail(email);
      
      if (!user) {
        await this.logFailedAttempt(email, 'user_not_found', clientIP, userAgent);
        throw new AuthenticationError('Identifiants invalides');
      }

      // Verify password
      const isValidPassword = userDb.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        await this.logFailedAttempt(email, 'wrong_password', clientIP, userAgent, user.id);
        throw new ValidationError('Identifiants invalides');
      }

      // Get user role
      const role = roleDb.findByPk(user.role_id);
      if (!role) {
        throw new Error('Erreur: rôle utilisateur non trouvé');
      }

      // Generate JWT token
      const token = this.generateToken(user, role);
      
      // Create session
      sessionDb.create(user.id, token, authConfig.sessionMaxAge);
      
      // Log successful login
      await this.logSuccessfulLogin(user, role, clientIP, userAgent);
      
      // Prepare user data (without password)
      const userWithoutPassword = this.sanitizeUser(user);
      
      return {
        success: true,
        user: userWithoutPassword,
        token,
        role: role.name,
        expiresIn: config.security.cookieMaxAge,
        redirect: this.getRedirectUrl(role.name)
      };
      
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Authentication error:', error);
      throw new Error('Erreur d\'authentification');
    }
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @param {Object} role - Role object
   * @returns {string} JWT token
   */
  static generateToken(user, role) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role_id: user.role_id,
        role: role.name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token or null if invalid
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Remove password from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   */
  static sanitizeUser(user) {
    const sanitized = user.toJSON ? user.toJSON() : { ...user };
    delete sanitized.password;
    return sanitized;
  }

  /**
   * Get redirect URL based on role
   * @param {string} roleName - Role name
   * @returns {string} Redirect URL
   */
  static getRedirectUrl(roleName) {
    switch (roleName) {
      case 'admin':
        return '/admin';
      case 'editor':
        return '/admin/pages';
      default:
        return '/';
    }
  }

  /**
   * Log successful login
   * @param {Object} user - User object
   * @param {Object} role - Role object
   * @param {string} clientIP - Client IP
   * @param {string} userAgent - User agent
   */
  static async logSuccessfulLogin(user, role, clientIP, userAgent) {
    auditDb.log(
      'login',
      'user',
      user.id,
      user.id,
      { 
        email: user.email,
        role: role.name,
        ip: clientIP,
        userAgent
      }
    );
  }

  /**
   * Log failed login attempt
   * @param {string} email - Email used in attempt
   * @param {string} reason - Failure reason
   * @param {string} clientIP - Client IP
   * @param {string} userAgent - User agent
   * @param {number} userId - User ID if user exists
   */
  static async logFailedAttempt(email, reason, clientIP, userAgent, userId = null) {
    auditDb.log(
      'login_failed',
      'user',
      userId,
      null,
      { 
        email,
        reason,
        ip: clientIP,
        userAgent
      }
    );
  }

  /**
   * Logout user and invalidate session
   * @param {string} token - JWT token
   * @returns {boolean} Success status
   */
  static async logout(token) {
    try {
      const decoded = this.verifyToken(token);
      if (decoded) {
        sessionDb.deleteByUserId(decoded.id);
      }
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Check if user session is valid
   * @param {string} token - JWT token
   * @returns {Object|null} User session or null if invalid
   */
  static async validateSession(token) {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) return null;

      const session = sessionDb.findByUserId(decoded.id);
      if (!session) return null;

      const user = userDb.findByPk(decoded.id);
      if (!user) return null;

      return {
        user: this.sanitizeUser(user),
        role: decoded.role,
        token
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }
}