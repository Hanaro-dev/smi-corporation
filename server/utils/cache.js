// Simple in-memory cache for performance optimization
// In production, consider using Redis or a similar caching solution

class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes default TTL
    this.maxSize = options.maxSize || 1000; // Maximum number of entries
    this.maxMemory = options.maxMemory || 50 * 1024 * 1024; // 50MB max memory
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0
    };
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    
    // Graceful shutdown cleanup
    process.on('exit', () => this.destroy());
    process.on('SIGTERM', () => this.destroy());
    process.on('SIGINT', () => this.destroy());
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    const entry = this.cache.get(key);
    
    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access time for LRU
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  /**
   * Set cached value with improved memory management
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = null) {
    const now = Date.now();
    const timeToLive = ttl !== null ? ttl : this.defaultTTL;
    
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    const entry = {
      value,
      created: now,
      lastAccessed: now,
      accessCount: 0,
      expires: timeToLive > 0 ? now + timeToLive : null
    };
    
    // Remove existing entry to update position (LRU)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    this.cache.set(key, entry);
    
    // Enforce size and memory limits
    this._enforceLimits();
    
    // Set expiration timer
    if (timeToLive > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, timeToLive);
      
      this.timers.set(key, timer);
    }
    
    // Update memory usage estimate
    this._updateMemoryStats();
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and not expired
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const entry = this.cache.get(key);
    
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   */
  delete(key) {
    // Clear timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Destroy cache and cleanup all resources
   */
  destroy() {
    // Clear all timers
    this.clear();
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this._calculateMemorySize(),
      maxMemory: this.maxMemory,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Clean up expired entries and enforce limits
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    // Find expired entries
    for (const [key, entry] of this.cache) {
      if (entry.expires && now > entry.expires) {
        keysToDelete.push(key);
      }
    }
    
    // Remove expired entries
    keysToDelete.forEach(key => this.delete(key));
    
    // Enforce limits after cleanup
    this._enforceLimits();
    
    // Update memory stats
    this._updateMemoryStats();
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Enforce size and memory limits using LRU eviction
   * @private
   */
  _enforceLimits() {
    // Enforce size limit
    while (this.cache.size > this.maxSize) {
      this._evictLRU();
    }
    
    // Enforce memory limit
    while (this._calculateMemorySize() > this.maxMemory && this.cache.size > 0) {
      this._evictLRU();
    }
  }
  
  /**
   * Evict least recently used item
   * @private
   */
  _evictLRU() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
      this.stats.evictions++;
    }
  }
  
  /**
   * Calculate approximate memory usage
   * @private
   * @returns {number} Memory usage in bytes
   */
  _calculateMemorySize() {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      // Estimate size: key + value + metadata
      totalSize += this._estimateObjectSize(key) + this._estimateObjectSize(entry);
    }
    
    return totalSize;
  }
  
  /**
   * Estimate object size in bytes
   * @private
   * @param {*} obj - Object to estimate
   * @returns {number} Estimated size in bytes
   */
  _estimateObjectSize(obj) {
    if (obj === null || obj === undefined) return 8;
    
    const type = typeof obj;
    switch (type) {
      case 'boolean': return 4;
      case 'number': return 8;
      case 'string': return obj.length * 2; // Unicode characters
      case 'object':
        if (obj instanceof Date) return 24;
        if (Array.isArray(obj)) {
          return obj.reduce((size, item) => size + this._estimateObjectSize(item), 24);
        }
        // For objects, estimate based on JSON serialization
        try {
          return JSON.stringify(obj).length * 2 + 24;
        } catch {
          return 100; // Fallback estimate
        }
      default:
        return 50; // Default estimate for unknown types
    }
  }
  
  /**
   * Update memory usage statistics
   * @private
   */
  _updateMemoryStats() {
    this.stats.memoryUsage = this._calculateMemorySize();
  }
  
  /**
   * Get formatted memory usage
   * @returns {string} Memory usage description
   */
  getMemoryUsage() {
    const bytes = this._calculateMemorySize();
    
    if (bytes < 1024) {
      return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Get or set cached value with function
   * @param {string} key - Cache key
   * @param {Function} fn - Function to call if cache miss
   * @param {number} ttl - Time to live in milliseconds
   * @returns {*} Cached or computed value
   */
  async getOrSet(key, fn, ttl = null) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
}

// Create global cache instances
const defaultCache = new MemoryCache(300000); // 5 minutes
const userCache = new MemoryCache(600000);    // 10 minutes
const pageCache = new MemoryCache(900000);    // 15 minutes
const roleCache = new MemoryCache(1800000);   // 30 minutes (roles change less frequently)

// Cache key generators
const cacheKeys = {
  user: (id) => `user:${id}`,
  userByEmail: (email) => `user:email:${email}`,
  role: (id) => `role:${id}`,
  rolePermissions: (roleId) => `role:${roleId}:permissions`,
  page: (id) => `page:${id}`,
  pagesByParent: (parentId) => `pages:parent:${parentId}`,
  pagesByStatus: (status) => `pages:status:${status}`,
  userPermissions: (userId) => `user:${userId}:permissions`,
  navigationTree: () => 'navigation:tree',
  imageStats: () => 'images:stats'
};

// Helper function to invalidate related caches
function invalidateUserCache(userId) {
  userCache.delete(cacheKeys.user(userId));
  
  // Also invalidate user permissions cache
  defaultCache.delete(cacheKeys.userPermissions(userId));
}

function invalidatePageCache(pageId, parentId = null) {
  pageCache.delete(cacheKeys.page(pageId));
  
  if (parentId) {
    pageCache.delete(cacheKeys.pagesByParent(parentId));
  }
  
  // Invalidate navigation tree as it might be affected
  pageCache.delete(cacheKeys.navigationTree());
}

function invalidateRoleCache(roleId) {
  roleCache.delete(cacheKeys.role(roleId));
  roleCache.delete(cacheKeys.rolePermissions(roleId));
  
  // Role changes affect all users with that role
  userCache.clear(); // Simple approach - clear all user cache
}

// Cleanup on process exit to prevent memory leaks
function cleanupCaches() {
  console.log('Cleaning up caches...');
  defaultCache.destroy();
  userCache.destroy();
  pageCache.destroy();
  roleCache.destroy();
}

// Register cleanup handlers
process.on('SIGINT', cleanupCaches);
process.on('SIGTERM', cleanupCaches);
process.on('exit', cleanupCaches);

export {
  MemoryCache,
  defaultCache,
  userCache,
  pageCache,
  roleCache,
  cacheKeys,
  invalidateUserCache,
  invalidatePageCache,
  invalidateRoleCache
};