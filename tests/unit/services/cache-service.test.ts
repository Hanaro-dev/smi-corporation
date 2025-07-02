/**
 * Tests unitaires pour CacheService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheService } from '../../../server/services/cache-service.js'

describe('CacheService', () => {
  let cache: CacheService
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
    }
    
    cache = new CacheService({ maxSize: 100, defaultTTL: 1000 })
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cache.clear()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Basic Cache Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1')
      
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('should check if key exists', () => {
      cache.set('key1', 'value1')
      
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('should delete keys', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      
      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })

    it('should clear all cache', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      cache.clear()
      
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
      expect(cache.size()).toBe(0)
    })
  })

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', () => {
      cache.set('key1', 'value1', 500) // 500ms TTL
      
      expect(cache.get('key1')).toBe('value1')
      
      // Advance time by 600ms
      vi.advanceTimersByTime(600)
      
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.has('key1')).toBe(false)
    })

    it('should use default TTL when not specified', () => {
      cache.set('key1', 'value1') // Uses default TTL of 1000ms
      
      expect(cache.get('key1')).toBe('value1')
      
      // Advance time by 1100ms
      vi.advanceTimersByTime(1100)
      
      expect(cache.get('key1')).toBeUndefined()
    })

    it('should not expire when TTL is 0', () => {
      cache.set('key1', 'value1', 0) // No expiration
      
      // Advance time significantly
      vi.advanceTimersByTime(10000)
      
      expect(cache.get('key1')).toBe('value1')
    })

    it('should refresh TTL on access', () => {
      const refreshingCache = new CacheService({ 
        maxSize: 100, 
        defaultTTL: 1000,
        refreshOnAccess: true 
      })
      
      refreshingCache.set('key1', 'value1', 1000)
      
      // Access after 800ms
      vi.advanceTimersByTime(800)
      expect(refreshingCache.get('key1')).toBe('value1')
      
      // Wait another 800ms (total 1600ms, but TTL was refreshed)
      vi.advanceTimersByTime(800)
      expect(refreshingCache.get('key1')).toBe('value1')
    })
  })

  describe('LRU Eviction', () => {
    it('should evict least recently used items when max size reached', () => {
      const smallCache = new CacheService({ maxSize: 3, defaultTTL: 0 })
      
      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')
      
      expect(smallCache.size()).toBe(3)
      
      // Adding 4th item should evict key1 (least recently used)
      smallCache.set('key4', 'value4')
      
      expect(smallCache.size()).toBe(3)
      expect(smallCache.has('key1')).toBe(false)
      expect(smallCache.has('key2')).toBe(true)
      expect(smallCache.has('key3')).toBe(true)
      expect(smallCache.has('key4')).toBe(true)
    })

    it('should update LRU order on access', () => {
      const smallCache = new CacheService({ maxSize: 3, defaultTTL: 0 })
      
      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')
      
      // Access key1 to make it recently used
      smallCache.get('key1')
      
      // Adding 4th item should now evict key2 (now least recently used)
      smallCache.set('key4', 'value4')
      
      expect(smallCache.has('key1')).toBe(true) // Was accessed, so kept
      expect(smallCache.has('key2')).toBe(false) // Evicted
      expect(smallCache.has('key3')).toBe(true)
      expect(smallCache.has('key4')).toBe(true)
    })
  })

  describe('Cache Statistics', () => {
    it('should track hit and miss statistics', () => {
      cache.set('key1', 'value1')
      
      // Generate hits
      cache.get('key1')
      cache.get('key1')
      
      // Generate misses
      cache.get('nonexistent1')
      cache.get('nonexistent2')
      
      const stats = cache.getStats()
      
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBeCloseTo(50, 1)
      expect(stats.totalRequests).toBe(4)
    })

    it('should track cache size and memory usage', () => {
      cache.set('key1', 'value1')
      cache.set('key2', { data: 'complex object' })
      
      const stats = cache.getStats()
      
      expect(stats.size).toBe(2)
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })

    it('should reset statistics', () => {
      cache.set('key1', 'value1')
      cache.get('key1')
      cache.get('nonexistent')
      
      cache.resetStats()
      
      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.hitRate).toBe(0)
    })
  })

  describe('Batch Operations', () => {
    it('should set multiple values at once', () => {
      const entries = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      }
      
      cache.mset(entries)
      
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
    })

    it('should get multiple values at once', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      const values = cache.mget(['key1', 'key2', 'nonexistent'])
      
      expect(values).toEqual({
        key1: 'value1',
        key2: 'value2',
        nonexistent: undefined
      })
    })

    it('should delete multiple keys at once', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      cache.mdel(['key1', 'key3'])
      
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
      expect(cache.has('key3')).toBe(false)
    })
  })

  describe('Cache Events', () => {
    it('should emit events on cache operations', () => {
      const setListener = vi.fn()
      const getListener = vi.fn()
      const deleteListener = vi.fn()
      const expireListener = vi.fn()
      
      cache.on('set', setListener)
      cache.on('get', getListener)
      cache.on('delete', deleteListener)
      cache.on('expire', expireListener)
      
      cache.set('key1', 'value1')
      cache.get('key1')
      cache.delete('key1')
      
      expect(setListener).toHaveBeenCalledWith('key1', 'value1')
      expect(getListener).toHaveBeenCalledWith('key1', 'value1')
      expect(deleteListener).toHaveBeenCalledWith('key1')
    })

    it('should emit expire events when items expire', () => {
      const expireListener = vi.fn()
      cache.on('expire', expireListener)
      
      cache.set('key1', 'value1', 500)
      
      vi.advanceTimersByTime(600)
      
      // Trigger cleanup by accessing
      cache.get('key1')
      
      expect(expireListener).toHaveBeenCalledWith('key1', 'value1')
    })
  })

  describe('Memory Management', () => {
    it('should estimate memory usage', () => {
      const initialMemory = cache.getMemoryUsage()
      
      cache.set('key1', 'a'.repeat(1000))
      cache.set('key2', { data: 'b'.repeat(1000) })
      
      const finalMemory = cache.getMemoryUsage()
      
      expect(finalMemory).toBeGreaterThan(initialMemory)
    })

    it('should warn about high memory usage', () => {
      // Fill cache with large objects to trigger memory warning
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, 'x'.repeat(10000))
      }
      
      // Memory warning should be logged
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('High cache memory usage'),
        expect.any(Object)
      )
    })
  })

  describe('Cleanup and Maintenance', () => {
    it('should clean up expired entries periodically', () => {
      cache.set('key1', 'value1', 500)
      cache.set('key2', 'value2', 1500)
      
      expect(cache.size()).toBe(2)
      
      // Advance time to expire first key
      vi.advanceTimersByTime(600)
      
      // Trigger cleanup
      cache.cleanup()
      
      expect(cache.size()).toBe(1)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
    })

    it('should start and stop automatic cleanup', () => {
      cache.startAutoCleanup(1000)
      
      expect(cache.isAutoCleanupRunning()).toBe(true)
      
      cache.stopAutoCleanup()
      
      expect(cache.isAutoCleanupRunning()).toBe(false)
    })
  })

  describe('Serialization', () => {
    it('should handle complex objects', () => {
      const complexObj = {
        id: 1,
        name: 'Test',
        nested: {
          array: [1, 2, 3],
          date: new Date('2025-01-01')
        }
      }
      
      cache.set('complex', complexObj)
      
      const retrieved = cache.get('complex')
      expect(retrieved).toEqual(complexObj)
      expect(retrieved.nested.array).toEqual([1, 2, 3])
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' }
      obj.self = obj // Circular reference
      
      expect(() => {
        cache.set('circular', obj)
      }).not.toThrow()
    })
  })

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customCache = new CacheService({
        maxSize: 50,
        defaultTTL: 2000,
        refreshOnAccess: true,
        cleanupInterval: 5000
      })
      
      const config = customCache.getConfig()
      
      expect(config.maxSize).toBe(50)
      expect(config.defaultTTL).toBe(2000)
      expect(config.refreshOnAccess).toBe(true)
      expect(config.cleanupInterval).toBe(5000)
    })

    it('should validate configuration parameters', () => {
      expect(() => {
        new CacheService({ maxSize: -1 })
      }).toThrow('Invalid configuration')
      
      expect(() => {
        new CacheService({ defaultTTL: -100 })
      }).toThrow('Invalid configuration')
    })
  })
})