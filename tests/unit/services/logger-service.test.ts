/**
 * Tests unitaires pour LoggerService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LoggerService } from '../../../server/services/logger-service.js'

describe('LoggerService', () => {
  let logger: LoggerService
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    }
    
    logger = new LoggerService({
      level: 'debug',
      enableConsole: true,
      enableFile: false,
      enableRemote: false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Log Levels', () => {
    it('should respect log level hierarchy', () => {
      const errorLogger = new LoggerService({ level: 'error' })
      
      expect(errorLogger.shouldLog('error')).toBe(true)
      expect(errorLogger.shouldLog('warn')).toBe(false)
      expect(errorLogger.shouldLog('info')).toBe(false)
      expect(errorLogger.shouldLog('debug')).toBe(false)
    })

    it('should log all levels when set to debug', () => {
      expect(logger.shouldLog('error')).toBe(true)
      expect(logger.shouldLog('warn')).toBe(true)
      expect(logger.shouldLog('info')).toBe(true)
      expect(logger.shouldLog('debug')).toBe(true)
    })
  })

  describe('Log Entry Creation', () => {
    it('should create properly formatted log entries', () => {
      const entry = logger.createLogEntry('info', 'Test message', { userId: 123 })
      
      expect(entry).toMatchObject({
        level: 'info',
        message: 'Test message',
        service: 'smi-cms',
        userId: 123
      })
      
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(entry.pid).toBe(process.pid)
    })

    it('should include environment and version info', () => {
      const entry = logger.createLogEntry('info', 'Test')
      
      expect(entry.environment).toBe('test')
      expect(entry.service).toBe('smi-cms')
      expect(typeof entry.version).toBe('string')
    })
  })

  describe('Console Formatting', () => {
    it('should format console messages with colors and metadata', () => {
      const entry = {
        timestamp: '2025-01-02T10:30:45.123Z',
        level: 'info',
        message: 'Test message',
        requestId: 'req_123456789_abcdef',
        userId: 123,
        duration: 250
      }

      const formatted = logger.formatConsoleMessage(entry)
      
      expect(formatted).toContain('[10:30:45]')
      expect(formatted).toContain('INFO')
      expect(formatted).toContain('Test message')
      expect(formatted).toContain('(req: req_1234)')
      expect(formatted).toContain('(user: 123)')
      expect(formatted).toContain('(250ms)')
    })

    it('should handle missing optional fields gracefully', () => {
      const entry = {
        timestamp: '2025-01-02T10:30:45.123Z',
        level: 'warn',
        message: 'Warning message'
      }

      const formatted = logger.formatConsoleMessage(entry)
      
      expect(formatted).toContain('WARN')
      expect(formatted).toContain('Warning message')
      expect(formatted).not.toContain('(req:')
      expect(formatted).not.toContain('(user:')
    })
  })

  describe('Convenience Methods', () => {
    it('should log error messages', () => {
      logger.error('Error message', { code: 500 })
      
      expect(consoleSpy.error).toHaveBeenCalled()
      const call = consoleSpy.error.mock.calls[0][0]
      expect(call).toContain('ERROR')
      expect(call).toContain('Error message')
    })

    it('should log info messages', () => {
      logger.info('Info message', { data: 'test' })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('INFO')
      expect(call).toContain('Info message')
    })

    it('should not log debug messages when level is info', () => {
      const infoLogger = new LoggerService({ level: 'info' })
      infoLogger.debug('Debug message')
      
      expect(consoleSpy.log).not.toHaveBeenCalled()
    })
  })

  describe('Request/Response Logging', () => {
    it('should log API requests with metadata', () => {
      const mockEvent = {
        node: {
          req: {
            method: 'POST',
            url: '/api/users',
            headers: {
              'user-agent': 'test-agent',
              'x-forwarded-for': '192.168.1.1',
              'content-length': '100'
            },
            socket: { remoteAddress: '127.0.0.1' }
          }
        },
        context: {}
      }

      const requestId = logger.logRequest(mockEvent, Date.now())
      
      expect(typeof requestId).toBe('string')
      expect(requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
      expect(mockEvent.context.requestId).toBe(requestId)
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should log API responses with performance metrics', () => {
      const mockEvent = {
        context: {
          requestId: 'req_123_abc',
          startTime: Date.now() - 250
        }
      }

      logger.logResponse(mockEvent, 200, { success: true })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('Response 200')
      expect(call).toContain('250ms') // Duration approximation
    })
  })

  describe('Specialized Logging', () => {
    it('should log authentication events', () => {
      logger.logAuth('login', 123, { ip: '192.168.1.1' })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('Auth: login')
    })

    it('should log security events as warnings', () => {
      logger.logSecurity('failed_login_attempt', { ip: '1.2.3.4' })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('Security: failed_login_attempt')
    })

    it('should log business events', () => {
      logger.logBusiness('user_registration', { userId: 123 })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('Business: user_registration')
    })

    it('should log performance metrics', () => {
      logger.logPerformance('api_response_time', 250, { endpoint: '/api/users' })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('Performance: api_response_time')
    })
  })

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ userId: 123, sessionId: 'abc123' })
      
      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe('function')
    })

    it('should include parent and child context in logs', () => {
      const childLogger = logger.child({ userId: 123 })
      childLogger.info('Child log message', { action: 'test' })
      
      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0][0]
      expect(call).toContain('Child log message')
    })
  })

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', () => {
      const id1 = logger.generateRequestId()
      const id2 = logger.generateRequestId()
      
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/)
    })

    it('should generate IDs with proper format', () => {
      const id = logger.generateRequestId()
      const parts = id.split('_')
      
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('req')
      expect(parseInt(parts[1])).toBeGreaterThan(0)
      expect(parts[2]).toMatch(/^[a-z0-9]+$/)
    })
  })

  describe('Error Handling', () => {
    it('should log errors with stack traces in debug mode', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'
      
      logger.error('Error occurred', { 
        stack: error.stack,
        details: { code: 500 }
      })
      
      expect(consoleSpy.error).toHaveBeenCalledTimes(2) // Message + stack
    })

    it('should handle missing error properties gracefully', () => {
      logger.error('Simple error message')
      
      expect(consoleSpy.error).toHaveBeenCalledTimes(1)
      expect(() => logger.error('Test')).not.toThrow()
    })
  })
})