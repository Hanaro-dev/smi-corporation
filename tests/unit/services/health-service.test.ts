/**
 * Tests unitaires pour HealthService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HealthService } from '../../../server/services/health-service.js'

describe('HealthService', () => {
  let health: HealthService
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    
    health = new HealthService()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    health.stop()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Health Check Status', () => {
    it('should return healthy status when all checks pass', async () => {
      const status = await health.getHealthStatus()
      
      expect(status.status).toBe('healthy')
      expect(status.uptime).toBeGreaterThan(0)
      expect(status.timestamp).toBeTypeOf('string')
      expect(status.version).toBeTypeOf('string')
      expect(status.environment).toBe('test')
    })

    it('should include system information', async () => {
      const status = await health.getHealthStatus()
      
      expect(status.system).toMatchObject({
        memory: expect.objectContaining({
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        }),
        cpu: expect.objectContaining({
          usage: expect.any(Number)
        }),
        disk: expect.objectContaining({
          usage: expect.any(Number),
          available: expect.any(Number)
        })
      })
    })

    it('should check database connectivity', async () => {
      const status = await health.getHealthStatus()
      
      expect(status.checks.database).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        responseTime: expect.any(Number)
      })
    })

    it('should check external dependencies', async () => {
      const status = await health.getHealthStatus()
      
      expect(status.checks.external).toBeInstanceOf(Array)
      if (status.checks.external.length > 0) {
        expect(status.checks.external[0]).toMatchObject({
          name: expect.any(String),
          status: expect.stringMatching(/^(healthy|unhealthy)$/),
          responseTime: expect.any(Number)
        })
      }
    })
  })

  describe('Individual Health Checks', () => {
    it('should check database health', async () => {
      const dbHealth = await health.checkDatabase()
      
      expect(dbHealth).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        responseTime: expect.any(Number),
        details: expect.any(Object)
      })
    })

    it('should check memory usage', () => {
      const memoryCheck = health.checkMemory()
      
      expect(memoryCheck).toMatchObject({
        status: expect.stringMatching(/^(healthy|warning|critical)$/),
        used: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number)
      })
      
      expect(memoryCheck.percentage).toBeLessThanOrEqual(100)
      expect(memoryCheck.percentage).toBeGreaterThanOrEqual(0)
    })

    it('should check disk usage', async () => {
      const diskCheck = await health.checkDisk()
      
      expect(diskCheck).toMatchObject({
        status: expect.stringMatching(/^(healthy|warning|critical)$/),
        usage: expect.any(Number),
        available: expect.any(Number),
        percentage: expect.any(Number)
      })
    })

    it('should check CPU usage', async () => {
      const cpuCheck = await health.checkCPU()
      
      expect(cpuCheck).toMatchObject({
        status: expect.stringMatching(/^(healthy|warning|critical)$/),
        usage: expect.any(Number)
      })
      
      expect(cpuCheck.usage).toBeLessThanOrEqual(100)
      expect(cpuCheck.usage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Health Thresholds', () => {
    it('should report warning when memory usage is high', () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 85 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 100 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      })
      
      const memoryCheck = health.checkMemory()
      expect(memoryCheck.status).toBe('warning')
      
      process.memoryUsage = originalMemoryUsage
    })

    it('should report critical when memory usage is very high', () => {
      // Mock critical memory usage
      const originalMemoryUsage = process.memoryUsage
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 95 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 100 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      })
      
      const memoryCheck = health.checkMemory()
      expect(memoryCheck.status).toBe('critical')
      
      process.memoryUsage = originalMemoryUsage
    })
  })

  describe('Monitoring and Alerts', () => {
    it('should start monitoring with specified interval', () => {
      health.startMonitoring(5000)
      
      // Verify monitoring is active
      expect(health.isMonitoring()).toBe(true)
    })

    it('should stop monitoring', () => {
      health.startMonitoring(5000)
      health.stop()
      
      expect(health.isMonitoring()).toBe(false)
    })

    it('should trigger alerts for critical issues', async () => {
      health.startMonitoring(1000)
      
      // Mock critical memory usage
      const originalMemoryUsage = process.memoryUsage
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 95 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 100 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      })
      
      // Advance timer to trigger monitoring check
      vi.advanceTimersByTime(1500)
      
      // Should have logged a warning
      expect(consoleSpy.warn).toHaveBeenCalled()
      
      process.memoryUsage = originalMemoryUsage
    })
  })

  describe('Readiness and Liveness', () => {
    it('should check readiness', async () => {
      const readiness = await health.checkReadiness()
      
      expect(readiness).toMatchObject({
        ready: expect.any(Boolean),
        checks: expect.any(Object)
      })
    })

    it('should check liveness', async () => {
      const liveness = await health.checkLiveness()
      
      expect(liveness).toMatchObject({
        alive: expect.any(Boolean),
        uptime: expect.any(Number)
      })
    })

    it('should report not ready when database is down', async () => {
      // Mock database failure
      vi.spyOn(health, 'checkDatabase').mockResolvedValue({
        status: 'unhealthy',
        responseTime: 0,
        details: { error: 'Connection failed' }
      })
      
      const readiness = await health.checkReadiness()
      expect(readiness.ready).toBe(false)
    })
  })

  describe('Performance Tracking', () => {
    it('should track health check performance', async () => {
      const status = await health.getHealthStatus()
      
      expect(status.performance).toMatchObject({
        totalTime: expect.any(Number),
        checks: expect.any(Object)
      })
    })

    it('should warn about slow health checks', async () => {
      // Mock slow database check
      vi.spyOn(health, 'checkDatabase').mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            status: 'healthy',
            responseTime: 2000,
            details: {}
          }), 2000)
        })
      })
      
      await health.getHealthStatus()
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow health check'),
        expect.objectContaining({
          check: 'database',
          duration: expect.any(Number)
        })
      )
    })
  })

  describe('Configuration', () => {
    it('should use custom thresholds', () => {
      const customHealth = new HealthService({
        memoryWarningThreshold: 60,
        memoryCriticalThreshold: 85,
        diskWarningThreshold: 70,
        diskCriticalThreshold: 90
      })
      
      expect(customHealth.getConfiguration()).toMatchObject({
        memoryWarningThreshold: 60,
        memoryCriticalThreshold: 85,
        diskWarningThreshold: 70,
        diskCriticalThreshold: 90
      })
    })

    it('should validate configuration parameters', () => {
      expect(() => {
        new HealthService({
          memoryWarningThreshold: 120 // Invalid percentage
        })
      }).toThrow('Invalid threshold')
    })
  })

  describe('Error Handling', () => {
    it('should handle check failures gracefully', async () => {
      // Mock a failing check
      vi.spyOn(health, 'checkDatabase').mockRejectedValue(new Error('Database error'))
      
      const status = await health.getHealthStatus()
      
      expect(status.checks.database.status).toBe('unhealthy')
      expect(status.checks.database.error).toContain('Database error')
    })

    it('should continue monitoring despite check failures', async () => {
      health.startMonitoring(1000)
      
      // Mock failing checks
      vi.spyOn(health, 'checkDatabase').mockRejectedValue(new Error('DB Error'))
      
      // Advance timer multiple times
      vi.advanceTimersByTime(3000)
      
      // Should still be monitoring
      expect(health.isMonitoring()).toBe(true)
    })
  })
})