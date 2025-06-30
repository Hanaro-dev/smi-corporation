// User repository with user-specific operations
import { BaseRepository } from './base-repository.js'
import { userDb, roleDb } from '../utils/mock-db.js'
import { ConflictError } from '../utils/error-handler.js'
import { userCache, cacheKeys, invalidateUserCache } from '../utils/cache.js'

export class UserRepository extends BaseRepository {
  constructor() {
    super(userDb, 'User')
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email, options = {}) {
    // Check cache first
    const cacheKey = cacheKeys.userByEmail(email)
    const cached = userCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const user = await this.findOne({ email }, options)
    
    // Cache the result
    if (user) {
      userCache.set(cacheKey, user, 600000) // 10 minutes
      userCache.set(cacheKeys.user(user.id), user, 600000)
    }

    return user
  }

  /**
   * Find user with role information
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User with role
   */
  async findWithRole(userId) {
    const user = await this.findById(userId, {
      include: [{
        model: roleDb,
        as: 'role'
      }]
    })

    return user
  }

  /**
   * Create new user with unique email validation
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email)
    if (existingUser) {
      throw new ConflictError('Email already exists')
    }

    // Check if username already exists (if provided)
    if (userData.username) {
      const existingUsername = await this.findOne({ username: userData.username })
      if (existingUsername) {
        throw new ConflictError('Username already exists')
      }
    }

    const user = await super.create(userData)

    // Cache the new user
    userCache.set(cacheKeys.user(user.id), user, 600000)
    userCache.set(cacheKeys.userByEmail(user.email), user, 600000)

    return user
  }

  /**
   * Update user and invalidate cache
   * @param {number} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateById(userId, updateData) {
    // Check for email/username conflicts if being updated
    if (updateData.email) {
      const existing = await this.findByEmail(updateData.email)
      if (existing && existing.id !== userId) {
        throw new ConflictError('Email already exists')
      }
    }

    if (updateData.username) {
      const existing = await this.findOne({ username: updateData.username })
      if (existing && existing.id !== userId) {
        throw new ConflictError('Username already exists')
      }
    }

    const updatedUser = await super.updateById(userId, updateData)

    // Invalidate cache
    invalidateUserCache(userId)

    return updatedUser
  }

  /**
   * Delete user and invalidate cache
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success
   */
  async deleteById(userId) {
    const result = await super.deleteById(userId)

    // Invalidate cache
    invalidateUserCache(userId)

    return result
  }

  /**
   * Find users by role
   * @param {number} roleId - Role ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Users with specified role
   */
  async findByRole(roleId, options = {}) {
    return await this.findAll({ role_id: roleId }, options)
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStatistics() {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers
    ] = await Promise.all([
      this.count(),
      this.count({ status: 'active' }),
      this.count({ role_id: 1 }), // Assuming role 1 is admin
      this.count({
        created_at: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      })
    ])

    return {
      total: totalUsers,
      active: activeUsers,
      admins: adminUsers,
      recent: recentUsers
    }
  }

  /**
   * Search users by name or email
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Search results with pagination
   */
  async search(query, page = 1, limit = 10) {
    const searchWhere = {
      $or: [
        { name: { $like: `%${query}%` } },
        { email: { $like: `%${query}%` } },
        { username: { $like: `%${query}%` } }
      ]
    }

    return await this.paginate(searchWhere, page, limit, {
      include: [{
        model: roleDb,
        as: 'role'
      }],
      order: [['name', 'ASC']]
    })
  }

  /**
   * Update user last login
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    await this.updateById(userId, {
      last_login: new Date()
    })
  }

  /**
   * Find users with specific permissions
   * @param {string} permission - Permission name
   * @returns {Promise<Array>} Users with permission
   */
  async findWithPermission(permission) {
    // This would be implemented with proper joins
    // For now, simplified implementation
    const users = await this.findAll({}, {
      include: [{
        model: roleDb,
        as: 'role',
        include: ['permissions']
      }]
    })

    return users.filter(user => 
      user.role && 
      user.role.permissions && 
      user.role.permissions.some(p => p.name === permission)
    )
  }
}