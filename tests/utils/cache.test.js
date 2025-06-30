import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryCache } from '../../server/utils/cache.js'

describe('MemoryCache', () => {
  let cache

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new MemoryCache(1000) // 1 second TTL for tests
  })

  afterEach(() => {
    if (cache) {
      cache.destroy()
    }
    vi.useRealTimers()
  })

  describe('Basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBe(null)
    })

    it('should check if key exists', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('should delete values', () => {
      cache.set('key1', 'value1')
      cache.delete('key1')
      expect(cache.get('key1')).toBe(null)
      expect(cache.has('key1')).toBe(false)
    })

    it('should clear all values', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.get('key1')).toBe(null)
      expect(cache.get('key2')).toBe(null)
    })
  })

  describe('TTL functionality', () => {
    it('should expire values after TTL', () => {
      cache.set('key1', 'value1', 500) // 500ms TTL
      expect(cache.get('key1')).toBe('value1')
      
      // Fast forward time
      vi.advanceTimersByTime(600)
      expect(cache.get('key1')).toBe(null)
    })

    it('should not expire values before TTL', () => {
      cache.set('key1', 'value1', 1000) // 1000ms TTL
      
      // Fast forward time but not past TTL
      vi.advanceTimersByTime(500)
      expect(cache.get('key1')).toBe('value1')
    })

    it('should use default TTL when none specified', () => {
      cache.set('key1', 'value1') // Uses default 1000ms TTL
      
      vi.advanceTimersByTime(500)
      expect(cache.get('key1')).toBe('value1')
      
      vi.advanceTimersByTime(600)
      expect(cache.get('key1')).toBe(null)
    })

    it('should handle infinite TTL (0)', () => {
      cache.set('key1', 'value1', 0) // 0 means infinite TTL
      
      // Fast forward a long time  
      vi.advanceTimersByTime(10000)
      expect(cache.get('key1')).toBe('value1')
    })
  })

  describe('Statistics', () => {
    it('should return cache stats', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      const stats = cache.stats()
      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('key1')
      expect(stats.keys).toContain('key2')
      expect(stats.memory).toBeDefined()
    })
  })

  describe('getOrSet functionality', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached-value')
      
      const fn = vi.fn().mockResolvedValue('computed-value')
      const result = await cache.getOrSet('key1', fn, 1000)
      
      expect(result).toBe('cached-value')
      expect(fn).not.toHaveBeenCalled()
    })

    it('should compute and cache value if not exists', async () => {
      const fn = vi.fn().mockResolvedValue('computed-value')
      const result = await cache.getOrSet('key1', fn, 1000)
      
      expect(result).toBe('computed-value')
      expect(fn).toHaveBeenCalledOnce()
      expect(cache.get('key1')).toBe('computed-value')
    })

    it('should handle async functions', async () => {
      const fn = vi.fn().mockImplementation(async () => {
        // Use vi.advanceTimersByTime instead of setTimeout for fake timers
        return 'async-value'
      })
      
      const result = await cache.getOrSet('key1', fn, 1000)
      expect(result).toBe('async-value')
    }, 10000)
  })

  describe('Cleanup functionality', () => {
    it('should clean up expired entries', () => {
      cache.set('key1', 'value1', 500)
      cache.set('key2', 'value2', 1500)
      
      // Fast forward past first key's TTL
      vi.advanceTimersByTime(600)
      
      // Trigger cleanup
      cache.cleanup()
      
      expect(cache.get('key1')).toBe(null)
      expect(cache.get('key2')).toBe('value2')
    })

    it('should not affect non-expired entries during cleanup', () => {
      cache.set('key1', 'value1', 1500)
      cache.set('key2', 'value2', 1500)
      
      vi.advanceTimersByTime(500)
      cache.cleanup()
      
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
    })
  })

  describe('Destroy functionality', () => {
    it('should destroy cache and cleanup resources', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      cache.destroy()
      
      expect(cache.get('key1')).toBe(null)
      expect(cache.get('key2')).toBe(null)
      expect(cache.cleanupInterval).toBe(null)
    })
  })

  describe('Memory management', () => {
    it('should handle timer cleanup when overwriting keys', () => {
      cache.set('key1', 'value1', 1000)
      cache.set('key1', 'value2', 1000) // Overwrite
      
      // Should not have memory leaks from uncleaned timers
      expect(cache.timers.size).toBe(1)
    })

    it('should clear timers when deleting keys', () => {
      cache.set('key1', 'value1', 1000)
      expect(cache.timers.has('key1')).toBe(true)
      
      cache.delete('key1')
      expect(cache.timers.has('key1')).toBe(false)
    })
  })
})