import { describe, it, expect } from 'vitest'
import { 
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS
} from '../../server/utils/error-handler.js'

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create an app error with default values', () => {
      const error = new AppError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
      expect(error.timestamp).toBeDefined()
      expect(error.name).toBe('AppError')
    })

    it('should create an app error with custom values', () => {
      const error = new AppError('Custom error', 400, false)
      
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(false)
    })
  })

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Invalid input', 'email')
      
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.field).toBe('email')
      expect(error.type).toBe('validation')
    })

    it('should create a validation error without field', () => {
      const error = new ValidationError('Invalid input')
      
      expect(error.field).toBe(null)
    })
  })

  describe('AuthenticationError', () => {
    it('should create an authentication error', () => {
      const error = new AuthenticationError()
      
      expect(error.message).toBe('Authentication failed')
      expect(error.statusCode).toBe(401)
      expect(error.type).toBe('authentication')
    })

    it('should create an authentication error with custom message', () => {
      const error = new AuthenticationError('Token expired')
      
      expect(error.message).toBe('Token expired')
    })
  })

  describe('AuthorizationError', () => {
    it('should create an authorization error', () => {
      const error = new AuthorizationError()
      
      expect(error.message).toBe('Insufficient permissions')
      expect(error.statusCode).toBe(403)
      expect(error.type).toBe('authorization')
    })
  })

  describe('NotFoundError', () => {
    it('should create a not found error', () => {
      const error = new NotFoundError()
      
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
      expect(error.type).toBe('not_found')
    })
  })

  describe('ConflictError', () => {
    it('should create a conflict error', () => {
      const error = new ConflictError()
      
      expect(error.message).toBe('Resource conflict')
      expect(error.statusCode).toBe(409)
      expect(error.type).toBe('conflict')
    })
  })

  describe('RateLimitError', () => {
    it('should create a rate limit error', () => {
      const error = new RateLimitError()
      
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.statusCode).toBe(429)
      expect(error.type).toBe('rate_limit')
    })
  })

  describe('HTTP_STATUS constants', () => {
    it('should have correct status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.CONFLICT).toBe(409)
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429)
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
    })
  })

  describe('Response helpers', () => {
    describe('createSuccessResponse', () => {
      it('should create a success response', () => {
        const response = createSuccessResponse({ id: 1 }, 'Created successfully', 201)
        
        expect(response.success).toBe(true)
        expect(response.statusCode).toBe(201)
        expect(response.message).toBe('Created successfully')
        expect(response.data).toEqual({ id: 1 })
        expect(response.timestamp).toBeDefined()
      })

      it('should create a success response with defaults', () => {
        const response = createSuccessResponse({ id: 1 })
        
        expect(response.message).toBe('Success')
        expect(response.statusCode).toBe(200)
      })
    })

    describe('createErrorResponse', () => {
      it('should create an error response', () => {
        const response = createErrorResponse('Something went wrong', 500, { error: 'details' })
        
        expect(response.success).toBe(false)
        expect(response.statusCode).toBe(500)
        expect(response.message).toBe('Something went wrong')
        expect(response.details).toEqual({ error: 'details' })
        expect(response.timestamp).toBeDefined()
      })

      it('should create an error response with defaults', () => {
        const response = createErrorResponse('Error occurred')
        
        expect(response.statusCode).toBe(500)
        expect(response.details).toBe(null)
      })
    })
  })
})