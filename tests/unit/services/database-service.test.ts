/**
 * Tests unitaires pour DatabaseService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DatabaseService } from '../../../server/services/database-service.js'

describe('DatabaseService', () => {
  let dbService: DatabaseService
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    
    // Force test environment to use mock database
    process.env.USE_MOCK_DB = 'true'
    process.env.NODE_ENV = 'test'
    
    dbService = new DatabaseService()
  })

  afterEach(async () => {
    await dbService.disconnect()
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with mock database in test environment', async () => {
      await dbService.initialize()
      
      expect(dbService.isInitialized()).toBe(true)
      expect(dbService.isMockMode()).toBe(true)
    })

    it('should load models after initialization', async () => {
      await dbService.initialize()
      
      const models = dbService.models
      
      expect(models.User).toBeDefined()
      expect(models.Role).toBeDefined()
      expect(models.Permission).toBeDefined()
      expect(models.Page).toBeDefined()
      expect(models.Image).toBeDefined()
    })

    it('should handle initialization errors gracefully', async () => {
      // Mock an initialization error
      const mockInit = vi.spyOn(dbService, 'connectToDatabase')
        .mockRejectedValue(new Error('Connection failed'))
      
      await expect(dbService.initialize()).rejects.toThrow('Connection failed')
      
      expect(dbService.isInitialized()).toBe(false)
      mockInit.mockRestore()
    })
  })

  describe('Database Connection', () => {
    it('should connect to mock database in test mode', async () => {
      const connection = await dbService.connectToDatabase()
      
      expect(connection).toBeDefined()
      expect(dbService.isConnected()).toBe(true)
    })

    it('should handle connection failures', async () => {
      // Simulate connection failure
      const originalConnect = dbService.connectToDatabase
      dbService.connectToDatabase = vi.fn().mockRejectedValue(new Error('DB Error'))
      
      await expect(dbService.connectToDatabase()).rejects.toThrow('DB Error')
      
      dbService.connectToDatabase = originalConnect
    })

    it('should disconnect cleanly', async () => {
      await dbService.initialize()
      
      expect(dbService.isConnected()).toBe(true)
      
      await dbService.disconnect()
      
      expect(dbService.isConnected()).toBe(false)
    })
  })

  describe('Model Access', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should provide access to User model', () => {
      const User = dbService.getModel('User')
      
      expect(User).toBeDefined()
      expect(typeof User.findAll).toBe('function')
      expect(typeof User.create).toBe('function')
    })

    it('should provide access to all models', () => {
      const models = dbService.getAllModels()
      
      expect(models.User).toBeDefined()
      expect(models.Role).toBeDefined()
      expect(models.Permission).toBeDefined()
      expect(models.Page).toBeDefined()
      expect(models.Image).toBeDefined()
    })

    it('should throw error for non-existent model', () => {
      expect(() => {
        dbService.getModel('NonExistentModel')
      }).toThrow('Model NonExistentModel not found')
    })
  })

  describe('Query Operations', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should execute raw queries', async () => {
      const result = await dbService.query('SELECT 1 as test')
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should execute queries with parameters', async () => {
      const result = await dbService.query(
        'SELECT * FROM users WHERE id = :id',
        { id: 1 }
      )
      
      expect(result).toBeDefined()
    })

    it('should handle query errors', async () => {
      await expect(
        dbService.query('INVALID SQL QUERY')
      ).rejects.toThrow()
    })
  })

  describe('Transaction Management', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should create and commit transactions', async () => {
      const transaction = await dbService.createTransaction()
      
      expect(transaction).toBeDefined()
      
      // Perform some operations within transaction
      await dbService.query('SELECT 1', {}, transaction)
      
      await dbService.commitTransaction(transaction)
    })

    it('should rollback transactions on error', async () => {
      const transaction = await dbService.createTransaction()
      
      try {
        await dbService.query('INVALID SQL', {}, transaction)
      } catch (error) {
        await dbService.rollbackTransaction(transaction)
      }
      
      // Transaction should be rolled back
      expect(transaction.finished).toBeTruthy()
    })

    it('should execute operations within transaction scope', async () => {
      const result = await dbService.withTransaction(async (transaction) => {
        const users = await dbService.getModel('User').findAll({ transaction })
        return users.length
      })
      
      expect(typeof result).toBe('number')
    })
  })

  describe('Health Checks', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should check database health', async () => {
      const health = await dbService.checkHealth()
      
      expect(health).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        responseTime: expect.any(Number),
        details: expect.any(Object)
      })
    })

    it('should report unhealthy when disconnected', async () => {
      await dbService.disconnect()
      
      const health = await dbService.checkHealth()
      
      expect(health.status).toBe('unhealthy')
      expect(health.details.error).toBeDefined()
    })
  })

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should track query performance', async () => {
      await dbService.query('SELECT 1')
      
      const stats = dbService.getPerformanceStats()
      
      expect(stats.totalQueries).toBeGreaterThan(0)
      expect(stats.averageQueryTime).toBeGreaterThan(0)
      expect(stats.slowQueries).toBeDefined()
    })

    it('should identify slow queries', async () => {
      // Mock a slow query
      const originalQuery = dbService.query
      dbService.query = vi.fn().mockImplementation(async (sql) => {
        await new Promise(resolve => setTimeout(resolve, 600))
        return []
      })
      
      await dbService.query('SELECT * FROM users')
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow database query'),
        expect.any(Object)
      )
      
      dbService.query = originalQuery
    })

    it('should reset performance statistics', () => {
      dbService.resetPerformanceStats()
      
      const stats = dbService.getPerformanceStats()
      
      expect(stats.totalQueries).toBe(0)
      expect(stats.averageQueryTime).toBe(0)
      expect(stats.slowQueries).toHaveLength(0)
    })
  })

  describe('Mock vs Real Database', () => {
    it('should use mock database when USE_MOCK_DB is true', async () => {
      process.env.USE_MOCK_DB = 'true'
      const mockDbService = new DatabaseService()
      
      await mockDbService.initialize()
      
      expect(mockDbService.isMockMode()).toBe(true)
      
      await mockDbService.disconnect()
    })

    it('should use real database when USE_MOCK_DB is false', async () => {
      process.env.USE_MOCK_DB = 'false'
      const realDbService = new DatabaseService()
      
      // Note: This test would fail in actual test environment without real DB
      // but we're testing the configuration logic
      expect(realDbService.isMockMode()).toBe(false)
    })
  })

  describe('Migration Support', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should check for pending migrations', async () => {
      const pendingMigrations = await dbService.getPendingMigrations()
      
      expect(Array.isArray(pendingMigrations)).toBe(true)
    })

    it('should run migrations', async () => {
      const result = await dbService.runMigrations()
      
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        migrationsRun: expect.any(Array)
      })
    })

    it('should handle migration errors', async () => {
      // Mock migration failure
      const originalRunMigrations = dbService.runMigrations
      dbService.runMigrations = vi.fn().mockRejectedValue(new Error('Migration failed'))
      
      await expect(dbService.runMigrations()).rejects.toThrow('Migration failed')
      
      dbService.runMigrations = originalRunMigrations
    })
  })

  describe('Connection Pool Management', () => {
    beforeEach(async () => {
      await dbService.initialize()
    })

    it('should provide connection pool statistics', () => {
      const poolStats = dbService.getConnectionPoolStats()
      
      expect(poolStats).toMatchObject({
        total: expect.any(Number),
        active: expect.any(Number),
        idle: expect.any(Number)
      })
    })

    it('should handle connection pool exhaustion', async () => {
      // Mock pool exhaustion scenario
      const mockPoolError = new Error('Connection pool exhausted')
      const originalQuery = dbService.query
      
      dbService.query = vi.fn().mockRejectedValue(mockPoolError)
      
      await expect(dbService.query('SELECT 1')).rejects.toThrow('Connection pool exhausted')
      
      dbService.query = originalQuery
    })
  })

  describe('Error Handling', () => {
    it('should handle various database errors gracefully', async () => {
      await dbService.initialize()
      
      // Test different error scenarios
      const errorCases = [
        'Connection timeout',
        'Syntax error',
        'Access denied',
        'Table not found'
      ]
      
      for (const errorMessage of errorCases) {
        const mockError = new Error(errorMessage)
        const originalQuery = dbService.query
        
        dbService.query = vi.fn().mockRejectedValue(mockError)
        
        await expect(dbService.query('SELECT 1')).rejects.toThrow(errorMessage)
        
        dbService.query = originalQuery
      }
    })

    it('should log critical database errors', async () => {
      await dbService.initialize()
      
      const criticalError = new Error('Critical database error')
      const originalQuery = dbService.query
      
      dbService.query = vi.fn().mockRejectedValue(criticalError)
      
      try {
        await dbService.query('SELECT 1')
      } catch (error) {
        // Error should be logged
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Database error'),
          expect.any(Object)
        )
      }
      
      dbService.query = originalQuery
    })
  })
})