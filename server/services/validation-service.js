/**
 * Validation Service
 * Centralized validation logic for consistent data validation
 */
import DOMPurify from 'dompurify';
import { VALIDATION_RULES, ERROR_MESSAGES, STATUS_VALUES } from '../constants/api-constants.js';

/**
 * Base validation class for common validation patterns
 */
export class ValidationService {
  static validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return `${fieldName} est requis.`;
    }
    return null;
  }

  static validateStringLength(value, fieldName, minLength, maxLength) {
    if (typeof value !== 'string') {
      return `${fieldName} doit être une chaîne de caractères.`;
    }
    
    const trimmedValue = value.trim();
    if (trimmedValue.length < minLength || trimmedValue.length > maxLength) {
      return `${fieldName} doit contenir entre ${minLength} et ${maxLength} caractères.`;
    }
    
    return null;
  }

  static validateStatus(status) {
    if (status && !Object.values(STATUS_VALUES).includes(status)) {
      return ERROR_MESSAGES.VALIDATION.INVALID_STATUS;
    }
    return null;
  }

  static sanitizeText(text) {
    if (!text) return null;
    return DOMPurify.sanitize(text.trim());
  }

  /**
   * Generate slug from title with proper normalization
   * @param {string} title - Title to convert to slug
   * @returns {string} Generated slug
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

/**
 * Organigramme validation service
 */
export class OrganigrammeValidator extends ValidationService {
  static validate(data) {
    const errors = {};

    // Title validation
    const titleError = this.validateRequired(data.title, 'Le titre');
    if (titleError) {
      errors.title = titleError;
    } else {
      const lengthError = this.validateStringLength(
        data.title, 
        'Le titre', 
        VALIDATION_RULES.TITLE.MIN_LENGTH, 
        VALIDATION_RULES.TITLE.MAX_LENGTH
      );
      if (lengthError) {
        errors.title = lengthError;
      }
    }

    // Description validation (optional)
    if (data.description) {
      const descError = this.validateStringLength(
        data.description,
        'La description',
        0,
        VALIDATION_RULES.DESCRIPTION.MAX_LENGTH
      );
      if (descError) {
        errors.description = descError;
      }
    }

    // Status validation
    const statusError = this.validateStatus(data.status);
    if (statusError) {
      errors.status = statusError;
    }

    return errors;
  }

  static sanitize(data) {
    return {
      title: this.sanitizeText(data.title),
      description: this.sanitizeText(data.description),
      status: data.status || STATUS_VALUES.DRAFT,
      slug: data.slug || this.generateSlug(data.title)
    };
  }
}

/**
 * Employee validation service
 */
export class EmployeeValidator extends ValidationService {
  static validate(data) {
    const errors = {};

    // Name validation
    const nameError = this.validateRequired(data.name, 'Le nom');
    if (nameError) {
      errors.name = nameError;
    } else {
      const lengthError = this.validateStringLength(
        data.name, 
        'Le nom', 
        2, 
        VALIDATION_RULES.TITLE.MAX_LENGTH
      );
      if (lengthError) {
        errors.name = lengthError;
      }
    }

    // Position validation
    const positionError = this.validateRequired(data.position, 'Le poste');
    if (positionError) {
      errors.position = positionError;
    }

    // Level validation (if provided)
    if (data.level !== undefined) {
      if (!Number.isInteger(data.level) || data.level < 0 || data.level > VALIDATION_RULES.EMPLOYEE.MAX_LEVEL) {
        errors.level = `Le niveau doit être un entier entre 0 et ${VALIDATION_RULES.EMPLOYEE.MAX_LEVEL}.`;
      }
    }

    // Email validation (optional)
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Format d\'email invalide.';
    }

    return errors;
  }

  static sanitize(data) {
    return {
      name: this.sanitizeText(data.name),
      position: this.sanitizeText(data.position),
      email: data.email ? this.sanitizeText(data.email) : null,
      phone: data.phone ? this.sanitizeText(data.phone) : null,
      level: data.level || 0,
      parentId: data.parentId || null,
      orderIndex: data.orderIndex || 0,
      isActive: data.isActive !== false
    };
  }
}

/**
 * User validation service
 */
export class UserValidator extends ValidationService {
  static validateLogin(data) {
    const errors = {};

    // Email validation
    const emailError = this.validateRequired(data.email, 'L\'email');
    if (emailError) {
      errors.email = emailError;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Format d\'email invalide.';
    }

    // Password validation
    const passwordError = this.validateRequired(data.password, 'Le mot de passe');
    if (passwordError) {
      errors.password = passwordError;
    }

    return errors;
  }

  static validateRegistration(data) {
    const errors = this.validateLogin(data);

    // Name validation
    const nameError = this.validateRequired(data.name, 'Le nom');
    if (nameError) {
      errors.name = nameError;
    }

    // Password strength validation
    if (data.password && data.password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      errors.password = `Le mot de passe doit contenir au moins ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} caractères.`;
    }

    return errors;
  }
}