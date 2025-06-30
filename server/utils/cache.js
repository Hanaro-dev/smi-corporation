// Simple in-memory cache for performance optimization
// In production, consider using Redis or a similar caching solution

class MemoryCache {
  constructor(defaultTTL = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.timers = new Map();
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const entry = this.cache.get(key);
    
    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key);
      return null;
    }
    
    // Update access time for LRU
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Set cached value
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
      expires: timeToLive > 0 ? now + timeToLive : null
    };
    
    this.cache.set(key, entry);
    
    // Set expiration timer
    if (timeToLive > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, timeToLive);
      
      this.timers.set(key, timer);
    }
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
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: this.getMemoryUsage()
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.expires && now > entry.expires) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    
    console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
  }

  /**
   * Get approximate memory usage
   * @returns {string} Memory usage description
   */
  getMemoryUsage() {
    const entryCount = this.cache.size;
    const avgEntrySize = 100; // Rough estimate
    const estimatedBytes = entryCount * avgEntrySize;
    
    if (estimatedBytes < 1024) {
      return `${estimatedBytes} bytes`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${(estimatedBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
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