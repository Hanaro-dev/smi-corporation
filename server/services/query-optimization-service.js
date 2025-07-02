/**
 * Query Optimization Service - Database performance enhancements
 */
import { cacheService, CACHE_TTL } from './cache-service.js';

export class QueryOptimizationService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.queryStats = {
      totalQueries: 0,
      cachedQueries: 0,
      averageTime: 0,
      slowQueries: []
    };
  }

  /**
   * Execute cached query with automatic optimization
   */
  async cachedQuery(model, method, options = {}, cacheKey = null, ttl = CACHE_TTL.MEDIUM) {
    const startTime = Date.now();
    
    // Generate cache key if not provided
    if (!cacheKey) {
      cacheKey = this.generateCacheKey(model.name, method, options);
    }

    try {
      const result = await cacheService.cached(cacheKey, async () => {
        return await this.executeOptimizedQuery(model, method, options);
      }, ttl);

      this.recordQueryStats(startTime, true);
      return result;
    } catch (error) {
      this.recordQueryStats(startTime, false);
      throw error;
    }
  }

  /**
   * Execute optimized query with performance monitoring
   */
  async executeOptimizedQuery(model, method, options) {
    // Apply query optimizations
    const optimizedOptions = this.optimizeQueryOptions(options);
    
    // Add query logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Query] ${model.name}.${method}`, optimizedOptions);
    }

    return await model[method](optimizedOptions);
  }

  /**
   * Optimize query options for better performance
   */
  optimizeQueryOptions(options) {
    const optimized = { ...options };

    // Limit results if no limit specified
    if (!optimized.limit && !optimized.offset) {
      optimized.limit = 100; // Prevent unbounded queries
    }

    // Add indexes hint for common queries
    if (optimized.where) {
      // Add any specific optimization hints here
      optimized.benchmark = true;
    }

    // Optimize includes to prevent N+1 queries
    if (optimized.include) {
      optimized.include = this.optimizeIncludes(optimized.include);
    }

    return optimized;
  }

  /**
   * Optimize include statements to prevent N+1 queries
   */
  optimizeIncludes(includes) {
    if (!Array.isArray(includes)) {
      includes = [includes];
    }

    return includes.map(include => {
      if (typeof include === 'object' && include.model) {
        // Add separate: false to prevent additional queries
        return {
          ...include,
          separate: false,
          // Add required: false to make it LEFT JOIN instead of INNER JOIN
          required: include.required !== undefined ? include.required : false
        };
      }
      return include;
    });
  }

  /**
   * Generate consistent cache key
   */
  generateCacheKey(modelName, method, options) {
    const keyComponents = [
      'query',
      modelName.toLowerCase(),
      method,
      JSON.stringify(this.serializeOptions(options))
    ];
    
    return keyComponents.join(':');
  }

  /**
   * Serialize options for consistent cache keys
   */
  serializeOptions(options) {
    // Remove function values and sort keys for consistent serialization
    const cleaned = {};
    
    Object.keys(options || {}).sort().forEach(key => {
      const value = options[key];
      if (typeof value !== 'function') {
        cleaned[key] = value;
      }
    });
    
    return cleaned;
  }

  /**
   * Record query performance statistics
   */
  recordQueryStats(startTime, fromCache) {
    const executionTime = Date.now() - startTime;
    
    this.queryStats.totalQueries++;
    if (fromCache) {
      this.queryStats.cachedQueries++;
    }
    
    // Update average time
    this.queryStats.averageTime = 
      (this.queryStats.averageTime * (this.queryStats.totalQueries - 1) + executionTime) / 
      this.queryStats.totalQueries;
    
    // Track slow queries (>500ms)
    if (executionTime > 500) {
      this.queryStats.slowQueries.push({
        timestamp: new Date().toISOString(),
        executionTime,
        fromCache
      });
      
      // Keep only last 10 slow queries
      if (this.queryStats.slowQueries.length > 10) {
        this.queryStats.slowQueries.shift();
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const cacheHitRate = this.queryStats.totalQueries > 0 
      ? (this.queryStats.cachedQueries / this.queryStats.totalQueries * 100).toFixed(2)
      : 0;

    return {
      ...this.queryStats,
      cacheHitRate,
      cacheStats: cacheService.getStats()
    };
  }

  /**
   * Invalidate cache for model
   */
  invalidateModelCache(modelName) {
    const pattern = `query:${modelName.toLowerCase()}:`;
    return cacheService.invalidatePattern(pattern);
  }

  /**
   * Preload commonly accessed data
   */
  async preloadCache(preloadConfig) {
    console.log('Starting cache preload...');
    
    for (const config of preloadConfig) {
      try {
        await this.cachedQuery(
          config.model, 
          config.method, 
          config.options, 
          config.cacheKey, 
          config.ttl
        );
        console.log(`Preloaded: ${config.cacheKey}`);
      } catch (error) {
        console.error(`Failed to preload ${config.cacheKey}:`, error);
      }
    }
    
    console.log('Cache preload completed');
  }
}

/**
 * Common query patterns with optimization
 */
export const QueryPatterns = {
  // Find with pagination
  findWithPagination: (model, page = 1, pageSize = 20, where = {}) => ({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']]
  }),

  // Find with full relations
  findWithRelations: (model, include = []) => ({
    include: include.map(rel => ({
      model: rel,
      required: false
    }))
  }),

  // Count query optimization
  countOptimized: (where = {}) => ({
    where,
    attributes: [], // Don't select any columns for count
    distinct: true
  })
};

export default QueryOptimizationService;