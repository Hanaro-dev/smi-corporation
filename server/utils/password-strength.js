/**
 * Password Strength Validation Utility
 * Implements comprehensive password security checks
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
  preventCommonPasswords: true
};

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'password1', 'admin', 'administrator', 'root', 'user', 'test', 'guest',
  'welcome', 'letmein', 'monkey', 'dragon', 'master', 'football', 'baseball',
  'sunshine', 'iloveyou', 'trustno1', '000000', '111111', '123123'
]);

export class PasswordStrengthValidator {
  static validate(password, requirements = PASSWORD_REQUIREMENTS) {
    const errors = [];
    const warnings = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors, warnings, score: 0 };
    }

    // Length checks
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }
    
    if (password.length > requirements.maxLength) {
      errors.push(`Password must not exceed ${requirements.maxLength} characters`);
    }

    // Character type requirements
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    if (requirements.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.has(lowerPassword)) {
        errors.push('Password is too common. Please choose a more unique password');
      }
      
      // Check for keyboard patterns
      if (this.isKeyboardPattern(password)) {
        warnings.push('Password contains keyboard patterns. Consider using a more random combination');
      }
      
      // Check for repeated characters
      if (this.hasRepeatedChars(password)) {
        warnings.push('Password contains repeated characters. Consider more variation');
      }
    }

    // Calculate password strength score
    const score = this.calculateStrengthScore(password);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      strength: this.getStrengthLabel(score)
    };
  }

  static calculateStrengthScore(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 25);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Additional complexity bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);
    
    // Penalty for patterns
    if (this.isKeyboardPattern(password)) score -= 10;
    if (this.hasRepeatedChars(password)) score -= 5;
    
    // Penalty for dictionary words
    if (this.containsDictionaryWords(password)) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  static getStrengthLabel(score) {
    if (score >= 80) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  }

  static isKeyboardPattern(password) {
    const patterns = [
      'qwerty', 'asdf', 'zxcv', '123456', '654321',
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
    ];
    
    const lowerPassword = password.toLowerCase();
    return patterns.some(pattern => 
      lowerPassword.includes(pattern) || 
      lowerPassword.includes(pattern.split('').reverse().join(''))
    );
  }

  static hasRepeatedChars(password) {
    // Check for 3 or more consecutive repeated characters
    return /(.)\1{2,}/.test(password);
  }

  static containsDictionaryWords(password) {
    // Simple check for common English words
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome', 'hello', 'world',
      'computer', 'internet', 'email', 'phone', 'name', 'birthday'
    ];
    
    const lowerPassword = password.toLowerCase();
    return commonWords.some(word => lowerPassword.includes(word));
  }

  static generateSecurePassword(length = 16) {
    const chars = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      special: '!@#$%^&*(),.?":{}|<>'
    };
    
    const allChars = Object.values(chars).join('');
    let password = '';
    
    // Ensure at least one character from each category
    password += this.getRandomChar(chars.lowercase);
    password += this.getRandomChar(chars.uppercase);
    password += this.getRandomChar(chars.numbers);
    password += this.getRandomChar(chars.special);
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  static getRandomChar(chars) {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }
}

export default PasswordStrengthValidator;