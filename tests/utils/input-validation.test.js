import { describe, it, expect, beforeEach } from 'vitest'
import { 
  sanitizeHtml, 
  sanitizeText, 
  isValidEmail, 
  isValidPassword, 
  isValidUsername,
  isValidSlug,
  validateUserRegistration,
  validateUserLogin,
  validatePageData,
  checkRateLimit
} from '../../server/utils/input-validation.js'
import { ValidationError } from '../../server/utils/error-handler.js'

describe('Input Validation Utils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHtml(html)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Hello</p>')
    })

    it('should remove dangerous attributes', () => {
      const html = '<div onclick="alert()">Test</div>'
      const result = sanitizeHtml(html)
      expect(result).not.toContain('onclick')
    })

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null)).toBe('')
      expect(sanitizeHtml(undefined)).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      const result = sanitizeText('  hello world  ')
      expect(result).toBe('hello world')
    })

    it('should remove HTML characters', () => {
      const result = sanitizeText('<script>test</script>')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should respect maxLength', () => {
      const result = sanitizeText('hello world', 5)
      expect(result).toBe('hello')
    })

    it('should normalize whitespace', () => {
      const result = sanitizeText('hello    world')
      expect(result).toBe('hello world')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('Password123!')).toBe(true)
      expect(isValidPassword('MySecure123@')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(isValidPassword('password')).toBe(false) // No uppercase, number, special
      expect(isValidPassword('PASSWORD')).toBe(false) // No lowercase, number, special
      expect(isValidPassword('Password')).toBe(false) // No number, special
      expect(isValidPassword('Pass123')).toBe(false) // Too short
      expect(isValidPassword('')).toBe(false)
    })
  })

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(isValidUsername('user123')).toBe(true)
      expect(isValidUsername('test_user')).toBe(true)
      expect(isValidUsername('Username')).toBe(true)
    })

    it('should reject invalid usernames', () => {
      expect(isValidUsername('us')).toBe(false) // Too short
      expect(isValidUsername('user-name')).toBe(false) // Contains hyphen
      expect(isValidUsername('user@name')).toBe(false) // Contains @
      expect(isValidUsername('')).toBeFalsy()
    })
  })

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true)
      expect(isValidSlug('test123')).toBe(true)
      expect(isValidSlug('simple')).toBe(true)
    })

    it('should reject invalid slugs', () => {
      expect(isValidSlug('Hello-World')).toBe(false) // Uppercase
      expect(isValidSlug('hello_world')).toBe(false) // Underscore
      expect(isValidSlug('hello world')).toBe(false) // Space
      expect(isValidSlug('')).toBeFalsy()
    })
  })

  describe('validateUserRegistration', () => {
    it('should validate correct user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        username: 'johndoe'
      }
      
      const result = validateUserRegistration(userData)
      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('john@example.com')
      expect(result.password).toBe('Password123!')
      expect(result.username).toBe('johndoe')
    })

    it('should throw ValidationError for missing fields', () => {
      expect(() => validateUserRegistration({})).toThrow(ValidationError)
      expect(() => validateUserRegistration({ name: 'John' })).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!'
      }
      expect(() => validateUserRegistration(userData)).toThrow(ValidationError)
    })

    it('should throw ValidationError for weak password', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak'
      }
      expect(() => validateUserRegistration(userData)).toThrow(ValidationError)
    })
  })

  describe('validateUserLogin', () => {
    it('should validate correct login data', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = validateUserLogin(loginData)
      expect(result.email).toBe('test@example.com')
      expect(result.password).toBe('password123')
    })

    it('should throw ValidationError for missing fields', () => {
      expect(() => validateUserLogin({})).toThrow(ValidationError)
      expect(() => validateUserLogin({ email: 'test@example.com' })).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid email', () => {
      const loginData = {
        email: 'invalid',
        password: 'password'
      }
      expect(() => validateUserLogin(loginData)).toThrow(ValidationError)
    })
  })

  describe('validatePageData', () => {
    it('should validate correct page data', () => {
      const pageData = {
        title: 'Test Page',
        content: '<p>Hello world</p>',
        slug: 'test-page',
        status: 'published'
      }
      
      const result = validatePageData(pageData)
      expect(result.title).toBe('Test Page')
      expect(result.slug).toBe('test-page')
      expect(result.status).toBe('published')
    })

    it('should throw ValidationError for missing title', () => {
      expect(() => validatePageData({})).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid slug', () => {
      const pageData = {
        title: 'Test Page',
        slug: 'Invalid Slug'
      }
      expect(() => validatePageData(pageData)).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid status', () => {
      const pageData = {
        title: 'Test Page',
        status: 'invalid'
      }
      expect(() => validatePageData(pageData)).toThrow(ValidationError)
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Reset rate limit store before each test
      // Note: This is a simplified test - in reality you'd need to mock the store
    })

    it('should allow requests within limit', () => {
      const result = checkRateLimit('192.168.1.1', 5, 60000)
      expect(result).toBe(true)
    })

    it('should handle different IPs independently', () => {
      // Use unique IPs for this test to avoid conflicts with other tests
      const ip1 = `192.168.1.${Math.floor(Math.random() * 1000)}`
      const ip2 = `192.168.1.${Math.floor(Math.random() * 1000)}`
      
      // First call should pass for each IP
      expect(checkRateLimit(ip1, 2, 60000)).toBe(true)
      expect(checkRateLimit(ip2, 2, 60000)).toBe(true)
    })
  })
})