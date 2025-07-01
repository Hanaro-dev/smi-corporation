/**
 * Database query optimization utilities
 */
import { Op } from 'sequelize';

/**
 * Query optimization strategies
 */
export class QueryOptimizer {
  
  /**
   * Add indexes for common query patterns
   * @param {Object} sequelize - Sequelize instance
   * @returns {Promise} Promise resolving when indexes are created
   */
  static async createOptimalIndexes(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      // User table indexes
      await this.safeAddIndex(queryInterface, 'Users', ['email'], {
        unique: true,
        name: 'idx_users_email'
      });
      
      await this.safeAddIndex(queryInterface, 'Users', ['role_id'], {
        name: 'idx_users_role_id'
      });
      
      await this.safeAddIndex(queryInterface, 'Users', ['is_active'], {
        name: 'idx_users_is_active'
      });
      
      // Page table indexes
      await this.safeAddIndex(queryInterface, 'Pages', ['slug'], {
        unique: true,
        name: 'idx_pages_slug'
      });
      
      await this.safeAddIndex(queryInterface, 'Pages', ['status'], {
        name: 'idx_pages_status'
      });
      
      await this.safeAddIndex(queryInterface, 'Pages', ['parent_id'], {
        name: 'idx_pages_parent_id'
      });
      
      await this.safeAddIndex(queryInterface, 'Pages', ['author_id'], {
        name: 'idx_pages_author_id'
      });
      
      await this.safeAddIndex(queryInterface, 'Pages', ['created_at'], {
        name: 'idx_pages_created_at'
      });
      
      // Composite indexes for common queries
      await this.safeAddIndex(queryInterface, 'Pages', ['status', 'parent_id'], {
        name: 'idx_pages_status_parent'
      });
      
      await this.safeAddIndex(queryInterface, 'Pages', ['author_id', 'status'], {
        name: 'idx_pages_author_status'
      });
      
      // Session table indexes
      await this.safeAddIndex(queryInterface, 'Sessions', ['token'], {
        unique: true,
        name: 'idx_sessions_token'
      });
      
      await this.safeAddIndex(queryInterface, 'Sessions', ['user_id'], {
        name: 'idx_sessions_user_id'
      });
      
      await this.safeAddIndex(queryInterface, 'Sessions', ['expires_at'], {
        name: 'idx_sessions_expires_at'
      });
      
      // Audit log indexes
      await this.safeAddIndex(queryInterface, 'AuditLogs', ['user_id'], {
        name: 'idx_audit_user_id'
      });
      
      await this.safeAddIndex(queryInterface, 'AuditLogs', ['action'], {
        name: 'idx_audit_action'
      });
      
      await this.safeAddIndex(queryInterface, 'AuditLogs', ['created_at'], {
        name: 'idx_audit_created_at'
      });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Some indexes may already exist:', error.message);
    }
  }
  
  /**
   * Safely add index, ignoring if it already exists
   */
  static async safeAddIndex(queryInterface, table, fields, options) {
    try {
      await queryInterface.addIndex(table, fields, options);
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
  }
  
  /**
   * Optimize query with eager loading strategy
   * @param {Object} model - Sequelize model
   * @param {Object} options - Query options
   * @returns {Object} Optimized query options
   */
  static optimizeIncludes(model, options = {}) {
    if (!options.include) return options;
    
    return {
      ...options,
      include: options.include.map(include => {
        // Optimize associations
        const optimized = {
          ...include,
          required: false, // Use LEFT JOIN for better performance
        };
        
        // For hasMany associations, use separate queries to avoid cartesian products
        if (include.hasMany) {
          optimized.separate = true;
        }
        
        // Add specific optimizations based on association type
        if (include.model?.name === 'Role') {
          optimized.attributes = ['id', 'name', 'description'];
        }
        
        if (include.model?.name === 'Permission') {
          optimized.attributes = ['id', 'name', 'resource', 'action'];
        }
        
        return optimized;
      })
    };
  }
  
  /**
   * Add efficient pagination
   * @param {Object} options - Query options
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} Options with pagination
   */
  static addPagination(options = {}, page = 1, limit = 10) {
    const sanitizedLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100
    const sanitizedPage = Math.max(1, page);
    const offset = (sanitizedPage - 1) * sanitizedLimit;
    
    return {
      ...options,
      limit: sanitizedLimit,
      offset,
      // Add count for total pages calculation
      distinct: true
    };
  }
  
  /**
   * Add efficient search conditions
   * @param {Object} where - Existing where conditions
   * @param {string} searchTerm - Search term
   * @param {Array} searchFields - Fields to search in
   * @returns {Object} Updated where conditions
   */
  static addSearch(where = {}, searchTerm, searchFields = []) {
    if (!searchTerm || !searchFields.length) return where;
    
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return where;
    
    // Use ILIKE for case-insensitive search (PostgreSQL) or LIKE (MySQL/SQLite)
    const searchOp = process.env.DB_DIALECT === 'postgres' ? Op.iLike : Op.like;
    
    const searchConditions = searchFields.map(field => ({
      [field]: { [searchOp]: `%${trimmedTerm}%` }
    }));
    
    return {
      ...where,
      [Op.and]: [
        ...(where[Op.and] || []),
        { [Op.or]: searchConditions }
      ]
    };
  }
  
  /**
   * Add sorting with fallback
   * @param {Object} options - Query options
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (ASC/DESC)
   * @param {Array} allowedFields - Allowed fields for sorting
   * @returns {Object} Options with sorting
   */
  static addSorting(options = {}, sortBy, sortOrder = 'ASC', allowedFields = []) {
    if (!sortBy || !allowedFields.includes(sortBy)) {
      // Default sorting
      return {
        ...options,
        order: options.order || [['created_at', 'DESC']]
      };
    }
    
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    return {
      ...options,
      order: [[sortBy, direction]]
    };
  }
  
  /**
   * Optimize query for counting
   * @param {Object} options - Query options
   * @returns {Object} Optimized count options
   */
  static optimizeForCount(options = {}) {
    return {
      where: options.where,
      include: options.include?.map(inc => ({
        ...inc,
        attributes: [], // Don't select any attributes for count
        required: inc.required || false
      })),
      distinct: true
    };
  }
  
  /**
   * Create efficient bulk operations
   * @param {Object} model - Sequelize model
   * @param {Array} data - Array of data to insert/update
   * @param {Object} options - Bulk operation options
   * @returns {Object} Optimized bulk options
   */
  static optimizeBulkOperation(model, data, options = {}) {
    return {
      ...options,
      updateOnDuplicate: options.updateOnDuplicate || false,
      ignoreDuplicates: options.ignoreDuplicates || false,
      validate: options.validate !== false, // Enable validation by default
      hooks: options.hooks || false, // Disable hooks for performance
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    };
  }
  
  /**
   * Analyze and suggest query optimizations
   * @param {string} sql - SQL query
   * @param {number} executionTime - Query execution time in ms
   * @returns {Array} Array of optimization suggestions
   */
  static analyzeQuery(sql, executionTime) {
    const suggestions = [];
    
    if (executionTime > 1000) {
      suggestions.push('Query is slow (>1s). Consider adding indexes or optimizing joins.');
    }
    
    if (sql.includes('SELECT *')) {
      suggestions.push('Avoid SELECT *. Specify only needed columns.');
    }
    
    if (sql.includes('ORDER BY') && !sql.includes('LIMIT')) {
      suggestions.push('ORDER BY without LIMIT can be expensive. Consider pagination.');
    }
    
    if (sql.match(/JOIN.*JOIN/g)?.length > 2) {
      suggestions.push('Multiple JOINs detected. Consider using separate queries or include optimization.');
    }
    
    if (sql.includes('LIKE \'%') && sql.includes('%\'')) {
      suggestions.push('Leading wildcard in LIKE prevents index usage. Consider full-text search.');
    }
    
    return suggestions;
  }
}

/**
 * Database connection pool monitoring
 */
export class PoolMonitor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      errors: 0
    };
  }
  
  startMonitoring() {
    if (this.sequelize.connectionManager?.pool) {
      const pool = this.sequelize.connectionManager.pool;
      
      // Monitor pool events if available
      if (typeof pool.on === 'function') {
        pool.on('create', () => {
          this.metrics.totalConnections++;
        });
        
        pool.on('acquire', () => {
          this.metrics.activeConnections++;
        });
        
        pool.on('release', () => {
          this.metrics.activeConnections--;
          this.metrics.idleConnections++;
        });
        
        pool.on('error', (error) => {
          this.metrics.errors++;
          console.error('Pool error:', error);
        });
      }
      
      // Periodic health check
      setInterval(() => {
        this.checkPoolHealth();
      }, 30000); // Every 30 seconds
    }
  }
  
  checkPoolHealth() {
    const pool = this.sequelize.connectionManager?.pool;
    if (!pool) return;
    
    // Log pool statistics
    if (process.env.NODE_ENV === 'development') {
      console.log('Pool Status:', {
        size: pool.size || 0,
        available: pool.available || 0,
        using: pool.using || 0,
        waiting: pool.waiting || 0
      });
    }
    
    // Alert if pool is under stress
    if (pool.waiting > 5) {
      console.warn('⚠️ High connection wait queue:', pool.waiting);
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      poolSize: this.sequelize.connectionManager?.pool?.size || 0,
      poolAvailable: this.sequelize.connectionManager?.pool?.available || 0,
      timestamp: new Date().toISOString()
    };
  }
}