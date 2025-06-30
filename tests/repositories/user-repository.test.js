import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRepository } from '../../server/repositories/user-repository.js'
import { ConflictError, NotFoundError } from '../../server/utils/error-handler.js'

// Mock the dependencies
vi.mock('../../server/utils/mock-db.js', () => ({
  userDb: {
    findByPk: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
    count: vi.fn(),
    findAndCountAll: vi.fn()
  },
  roleDb: {}
}))

vi.mock('../../server/utils/cache.js', () => ({
  userCache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  },
  cacheKeys: {
    user: (id) => `user:${id}`,
    userByEmail: (email) => `user:email:${email}`,
    userPermissions: (id) => `user:${id}:permissions`
  },
  invalidateUserCache: vi.fn()
}))

describe('UserRepository', () => {
  let userRepository
  let mockUserDb
  let mockUserCache

  beforeEach(async () => {
    userRepository = new UserRepository()
    
    // Get mocked modules
    const { userDb } = await import('../../server/utils/mock-db.js')
    const { userCache } = await import('../../server/utils/cache.js')
    
    mockUserDb = userDb
    mockUserCache = userCache

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('findByEmail', () => {
    it('should return cached user if exists', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test User' }
      mockUserCache.get.mockReturnValue(user)

      const result = await userRepository.findByEmail('test@example.com')

      expect(result).toEqual(user)
      expect(mockUserCache.get).toHaveBeenCalledWith('user:email:test@example.com')
      expect(mockUserDb.findOne).not.toHaveBeenCalled()
    })

    it('should query database and cache result if not cached', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test User' }
      
      mockUserCache.get.mockReturnValue(null)
      mockUserDb.findOne.mockResolvedValue({ toJSON: () => user })

      const result = await userRepository.findByEmail('test@example.com')

      expect(result).toEqual(user)
      expect(mockUserDb.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
      expect(mockUserCache.set).toHaveBeenCalledWith('user:email:test@example.com', user, 600000)
      expect(mockUserCache.set).toHaveBeenCalledWith('user:1', user, 600000)
    })

    it('should return null if user not found', async () => {
      mockUserCache.get.mockReturnValue(null)
      mockUserDb.findOne.mockResolvedValue(null)

      const result = await userRepository.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
      expect(mockUserCache.set).not.toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      }
      const createdUser = { id: 1, ...userData }

      // Mock no existing user
      mockUserDb.findOne.mockResolvedValue(null)
      
      // Mock successful creation
      mockUserDb.create.mockResolvedValue({ toJSON: () => createdUser })

      const result = await userRepository.create(userData)

      expect(result).toEqual(createdUser)
      expect(mockUserDb.create).toHaveBeenCalledWith(userData, {})
      expect(mockUserCache.set).toHaveBeenCalledWith('user:1', createdUser, 600000)
      expect(mockUserCache.set).toHaveBeenCalledWith('user:email:test@example.com', createdUser, 600000)
    })

    it('should throw ConflictError if email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'hashedpassword'
      }

      // Mock existing user
      mockUserDb.findOne.mockResolvedValue({ toJSON: () => ({ id: 1, email: 'existing@example.com' }) })

      await expect(userRepository.create(userData)).rejects.toThrow(ConflictError)
      expect(mockUserDb.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictError if username already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'existinguser',
        password: 'hashedpassword'
      }

      // Mock no existing email but existing username
      mockUserDb.findOne
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce({ toJSON: () => ({ id: 1, username: 'existinguser' }) }) // Username check

      await expect(userRepository.create(userData)).rejects.toThrow(ConflictError)
      expect(mockUserDb.create).not.toHaveBeenCalled()
    })
  })

  describe('updateById', () => {
    it('should update user successfully', async () => {
      const userId = 1
      const updateData = { name: 'Updated Name' }
      const updatedUser = { id: userId, name: 'Updated Name', email: 'test@example.com' }

      // Mock successful update
      mockUserDb.update.mockResolvedValue([1, [{ toJSON: () => updatedUser }]])

      const result = await userRepository.updateById(userId, updateData)

      expect(result).toEqual(updatedUser)
      expect(mockUserDb.update).toHaveBeenCalledWith(updateData, {
        where: { id: userId },
        returning: true
      })
    })

    it('should throw ConflictError if email already exists for another user', async () => {
      const userId = 1
      const updateData = { email: 'existing@example.com' }

      // Mock existing user with different ID
      mockUserDb.findOne.mockResolvedValue({ 
        toJSON: () => ({ id: 2, email: 'existing@example.com' }) 
      })

      await expect(userRepository.updateById(userId, updateData)).rejects.toThrow(ConflictError)
      expect(mockUserDb.update).not.toHaveBeenCalled()
    })
  })

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const roleId = 1
      const users = [
        { id: 1, name: 'User 1', role_id: roleId },
        { id: 2, name: 'User 2', role_id: roleId }
      ]

      mockUserDb.findAll.mockResolvedValue(users.map(u => ({ toJSON: () => u })))

      const result = await userRepository.findByRole(roleId)

      expect(result).toEqual(users)
      expect(mockUserDb.findAll).toHaveBeenCalledWith({
        where: { role_id: roleId }
      })
    })
  })

  describe('getStatistics', () => {
    it('should return user statistics', async () => {
      // Mock different count queries
      mockUserDb.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(85)  // active users
        .mockResolvedValueOnce(5)   // admin users
        .mockResolvedValueOnce(15)  // recent users

      const result = await userRepository.getStatistics()

      expect(result).toEqual({
        total: 100,
        active: 85,
        admins: 5,
        recent: 15
      })

      expect(mockUserDb.count).toHaveBeenCalledTimes(4)
    })
  })

  describe('search', () => {
    it('should search users with pagination', async () => {
      const query = 'john'
      const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com' }
      ]
      const mockResult = {
        count: 1,
        rows: users.map(u => ({ toJSON: () => u }))
      }

      mockUserDb.findAndCountAll.mockResolvedValue(mockResult)

      const result = await userRepository.search(query, 1, 10)

      expect(result.data).toEqual(users)
      expect(result.pagination.total).toBe(1)
      expect(mockUserDb.findAndCountAll).toHaveBeenCalledWith({
        where: {
          $or: [
            { name: { $like: '%john%' } },
            { email: { $like: '%john%' } },
            { username: { $like: '%john%' } }
          ]
        },
        limit: 10,
        offset: 0,
        include: expect.any(Array),
        order: [['name', 'ASC']]
      })
    })
  })
})