// Database query optimization helpers
import { userCache, pageCache, roleCache, cacheKeys } from './cache.js';

/**
 * Optimized user queries with caching
 */
class UserQueries {
  constructor(userModel) {
    this.User = userModel;
  }

  /**
   * Find user by ID with caching
   * @param {number} id - User ID
   * @returns {Object|null} User object or null
   */
  async findById(id) {
    return await userCache.getOrSet(
      cacheKeys.user(id),
      async () => {
        const user = await this.User.findByPk(id, {
          include: [{ association: 'Role' }]
        });
        return user ? user.toJSON() : null;
      },
      600000 // 10 minutes
    );
  }

  /**
   * Find user by email with caching
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  async findByEmail(email) {
    return await userCache.getOrSet(
      cacheKeys.userByEmail(email),
      async () => {
        const user = await this.User.findOne({
          where: { email },
          include: [{ association: 'Role' }]
        });
        return user ? user.toJSON() : null;
      },
      600000 // 10 minutes
    );
  }

  /**
   * Get user permissions with caching
   * @param {number} userId - User ID
   * @returns {Array} Array of permission names
   */
  async getUserPermissions(userId) {
    return await userCache.getOrSet(
      cacheKeys.userPermissions(userId),
      async () => {
        const user = await this.findById(userId);
        if (!user || !user.Role) return [];
        
        // Get role permissions
        const rolePermissions = await this.getRolePermissions(user.Role.id);
        return rolePermissions;
      },
      600000 // 10 minutes
    );
  }

  /**
   * Get role permissions with caching
   * @param {number} roleId - Role ID
   * @returns {Array} Array of permission names
   */
  async getRolePermissions(roleId) {
    return await roleCache.getOrSet(
      cacheKeys.rolePermissions(roleId),
      async () => {
        // This would normally query the database
        // For now, return mock permissions based on role
        const rolePermissionsMap = {
          1: ['admin', 'edit', 'view', 'manage_users', 'manage_roles', 'manage_permissions'], // admin
          2: ['edit', 'view'], // editor
          3: ['view'] // user
        };
        
        return rolePermissionsMap[roleId] || [];
      },
      1800000 // 30 minutes
    );
  }
}

/**
 * Optimized page queries with caching
 */
class PageQueries {
  constructor(pageModel) {
    this.Page = pageModel;
  }

  /**
   * Find page by ID with caching
   * @param {number} id - Page ID
   * @returns {Object|null} Page object or null
   */
  async findById(id) {
    return await pageCache.getOrSet(
      cacheKeys.page(id),
      async () => {
        const page = await this.Page.findByPk(id);
        return page ? page.toJSON() : null;
      },
      900000 // 15 minutes
    );
  }

  /**
   * Get pages by parent ID with caching
   * @param {number|null} parentId - Parent page ID
   * @returns {Array} Array of child pages
   */
  async findByParent(parentId = null) {
    return await pageCache.getOrSet(
      cacheKeys.pagesByParent(parentId),
      async () => {
        const pages = await this.Page.findAll({
          where: { parentId },
          order: [['order', 'ASC'], ['title', 'ASC']]
        });
        return pages.map(page => page.toJSON());
      },
      900000 // 15 minutes
    );
  }

  /**
   * Get pages by status with caching
   * @param {string} status - Page status
   * @returns {Array} Array of pages
   */
  async findByStatus(status) {
    return await pageCache.getOrSet(
      cacheKeys.pagesByStatus(status),
      async () => {
        const pages = await this.Page.findAll({
          where: { status },
          order: [['updatedAt', 'DESC']]
        });
        return pages.map(page => page.toJSON());
      },
      600000 // 10 minutes
    );
  }

  /**
   * Get navigation tree with caching
   * @returns {Array} Hierarchical page structure
   */
  async getNavigationTree() {
    return await pageCache.getOrSet(
      cacheKeys.navigationTree(),
      async () => {
        // Get all published pages
        const pages = await this.Page.findAll({
          where: { status: 'published' },
          order: [['level', 'ASC'], ['order', 'ASC'], ['title', 'ASC']]
        });
        
        // Build hierarchical structure
        const pageMap = new Map();
        const tree = [];
        
        // Convert to plain objects and create map
        const plainPages = pages.map(page => {
          const plainPage = page.toJSON();
          pageMap.set(plainPage.id, { ...plainPage, children: [] });
          return plainPage;
        });
        
        // Build tree structure
        for (const page of plainPages) {
          if (page.parentId === null) {
            tree.push(pageMap.get(page.id));
          } else {
            const parent = pageMap.get(page.parentId);
            if (parent) {
              parent.children.push(pageMap.get(page.id));
            }
          }
        }
        
        return tree;
      },
      1800000 // 30 minutes
    );
  }
}

/**
 * Connection pool configuration for better performance
 */
const poolConfig = {
  max: 5,          // Maximum connections in pool
  min: 0,          // Minimum connections in pool
  acquire: 30000,  // Maximum time to wait for connection (30 seconds)
  idle: 10000,     // Maximum idle time before releasing connection (10 seconds)
  evict: 1000,     // Check for idle connections every second
  handleDisconnects: true
};

/**
 * Query optimization helpers
 */
const queryHelpers = {
  /**
   * Add pagination to queries
   * @param {Object} options - Query options
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} Updated options with pagination
   */
  paginate(options = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return {
      ...options,
      offset,
      limit: Math.min(limit, 100) // Cap at 100 items
    };
  },

  /**
   * Add search conditions
   * @param {Object} where - Existing where conditions
   * @param {string} searchTerm - Search term
   * @param {Array} fields - Fields to search in
   * @returns {Object} Updated where conditions
   */
  addSearch(where = {}, searchTerm, fields = []) {
    if (!searchTerm || !fields.length) return where;
    
    const searchConditions = fields.map(field => ({
      [field]: { [Op.like]: `%${searchTerm}%` }
    }));
    
    return {
      ...where,
      [Op.or]: searchConditions
    };
  },

  /**
   * Optimize include for associations
   * @param {Array} includes - Association includes
   * @returns {Array} Optimized includes
   */
  optimizeIncludes(includes = []) {
    return includes.map(include => ({
      ...include,
      required: false, // Use LEFT JOIN instead of INNER JOIN for better performance
      separate: include.hasMany || false // Use separate queries for hasMany to avoid N+1
    }));
  }
};

/**
 * Database health monitoring
 */
class DatabaseHealthMonitor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.stats = {
      queries: 0,
      slowQueries: 0,
      errors: 0,
      connections: 0
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitor query execution
    this.sequelize.addHook('beforeQuery', (options) => {
      options.startTime = Date.now();
      this.stats.queries++;
    });

    this.sequelize.addHook('afterQuery', (options) => {
      const duration = Date.now() - options.startTime;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, options.sql);
        this.stats.slowQueries++;
      }
    });

    // Monitor connection pool
    if (this.sequelize.connectionManager && this.sequelize.connectionManager.pool) {
      const pool = this.sequelize.connectionManager.pool;
      
      pool.on('acquire', () => {
        this.stats.connections++;
      });
      
      pool.on('error', (error) => {
        console.error('Database pool error:', error);
        this.stats.errors++;
      });
    }
  }

  getStats() {
    return {
      ...this.stats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }
}

export {
  UserQueries,
  PageQueries,
  poolConfig,
  queryHelpers,
  DatabaseHealthMonitor
};