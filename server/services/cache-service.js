/**
 * Cache Service - High-performance caching with multiple strategies
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxSize = 1000; // Maximum number of cached items
    this.cleanupInterval = 60 * 1000; // 1 minute cleanup interval
    
    this.startCleanupTimer();
  }

  /**
   * Get item from cache
   */
  get(key) {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      this.cacheStats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      this.cacheStats.misses++;
      return null;
    }
    
    this.cacheStats.hits++;
    return item.value;
  }

  /**
   * Set item in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      accessedAt: Date.now()
    });
    
    this.cacheStats.sets++;
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.cacheStats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return {
      ...this.cacheStats,
      hitRate: total > 0 ? (this.cacheStats.hits / total * 100).toFixed(2) : 0,
      size: this.memoryCache.size
    };
  }

  /**
   * Cache with function execution
   */
  async cached(key, asyncFn, ttl = this.defaultTTL) {
    let cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    try {
      const result = await asyncFn();
      this.set(key, result, ttl);
      return result;
    } catch (error) {
      console.error(`Cache function execution failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let deleted = 0;
    
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Evict least recently used items
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.accessedAt < oldestTime) {
        oldestTime = item.accessedAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Start cleanup timer to remove expired items
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Remove expired items
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired items`);
    }
  }

  resetStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
}

// Common cache TTL constants
export const CACHE_TTL = {
  SHORT: 60 * 1000,        // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 30 * 60 * 1000,    // 30 minutes
  HOUR: 60 * 60 * 1000,    // 1 hour
  DAY: 24 * 60 * 60 * 1000 // 24 hours
};

// Singleton cache service
export const cacheService = new CacheService();
export default cacheService;