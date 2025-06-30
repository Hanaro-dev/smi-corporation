// Base repository with common database operations
import { AppError, NotFoundError } from '../utils/error-handler.js'
import { errorLogger } from '../utils/error-handler.js'

export class BaseRepository {
  constructor(model, modelName = 'Record') {
    this.model = model
    this.modelName = modelName
  }

  /**
   * Find record by primary key
   * @param {number|string} id - Primary key
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found record or null
   */
  async findById(id, options = {}) {
    try {
      const record = await this.model.findByPk(id, options)
      return record ? record.toJSON() : null
    } catch (error) {
      errorLogger.log(error, { operation: 'findById', model: this.modelName, id })
      throw new AppError(`Failed to find ${this.modelName} by ID`, 500)
    }
  }

  /**
   * Find record by primary key or throw error
   * @param {number|string} id - Primary key
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found record
   * @throws {NotFoundError} If record not found
   */
  async findByIdOrFail(id, options = {}) {
    const record = await this.findById(id, options)
    if (!record) {
      throw new NotFoundError(`${this.modelName} with ID ${id} not found`)
    }
    return record
  }

  /**
   * Find all records with optional filtering
   * @param {Object} where - Where conditions
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  async findAll(where = {}, options = {}) {
    try {
      const records = await this.model.findAll({
        where,
        ...options
      })
      return records.map(record => record.toJSON())
    } catch (error) {
      errorLogger.log(error, { operation: 'findAll', model: this.modelName, where })
      throw new AppError(`Failed to fetch ${this.modelName} records`, 500)
    }
  }

  /**
   * Find single record by criteria
   * @param {Object} where - Where conditions
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found record or null
   */
  async findOne(where, options = {}) {
    try {
      const record = await this.model.findOne({
        where,
        ...options
      })
      return record ? record.toJSON() : null
    } catch (error) {
      errorLogger.log(error, { operation: 'findOne', model: this.modelName, where })
      throw new AppError(`Failed to find ${this.modelName}`, 500)
    }
  }

  /**
   * Find single record by criteria or throw error
   * @param {Object} where - Where conditions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Found record
   * @throws {NotFoundError} If record not found
   */
  async findOneOrFail(where, options = {}) {
    const record = await this.findOne(where, options)
    if (!record) {
      throw new NotFoundError(`${this.modelName} not found`)
    }
    return record
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    try {
      const record = await this.model.create(data, options)
      return record.toJSON()
    } catch (error) {
      errorLogger.log(error, { operation: 'create', model: this.modelName, data })
      
      if (error.name === 'SequelizeValidationError') {
        throw new AppError(`Validation failed for ${this.modelName}`, 400)
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError(`${this.modelName} already exists`, 409)
      }
      
      throw new AppError(`Failed to create ${this.modelName}`, 500)
    }
  }

  /**
   * Update record by ID
   * @param {number|string} id - Primary key
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async updateById(id, data, options = {}) {
    try {
      const [updatedCount, updatedRecords] = await this.model.update(data, {
        where: { id },
        returning: true,
        ...options
      })

      if (updatedCount === 0) {
        throw new NotFoundError(`${this.modelName} with ID ${id} not found`)
      }

      return updatedRecords[0].toJSON()
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }

      errorLogger.log(error, { operation: 'updateById', model: this.modelName, id, data })
      
      if (error.name === 'SequelizeValidationError') {
        throw new AppError(`Validation failed for ${this.modelName}`, 400)
      }
      
      throw new AppError(`Failed to update ${this.modelName}`, 500)
    }
  }

  /**
   * Delete record by ID
   * @param {number|string} id - Primary key
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id, options = {}) {
    try {
      const deletedCount = await this.model.destroy({
        where: { id },
        ...options
      })

      if (deletedCount === 0) {
        throw new NotFoundError(`${this.modelName} with ID ${id} not found`)
      }

      return true
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }

      errorLogger.log(error, { operation: 'deleteById', model: this.modelName, id })
      throw new AppError(`Failed to delete ${this.modelName}`, 500)
    }
  }

  /**
   * Count records with optional filtering
   * @param {Object} where - Where conditions
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count of records
   */
  async count(where = {}, options = {}) {
    try {
      return await this.model.count({
        where,
        ...options
      })
    } catch (error) {
      errorLogger.log(error, { operation: 'count', model: this.modelName, where })
      throw new AppError(`Failed to count ${this.modelName} records`, 500)
    }
  }

  /**
   * Check if record exists
   * @param {Object} where - Where conditions
   * @returns {Promise<boolean>} True if exists
   */
  async exists(where) {
    const count = await this.count(where)
    return count > 0
  }

  /**
   * Find records with pagination
   * @param {Object} where - Where conditions
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Records per page
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async paginate(where = {}, page = 1, limit = 10, options = {}) {
    try {
      const offset = (page - 1) * limit
      
      const { count, rows } = await this.model.findAndCountAll({
        where,
        limit,
        offset,
        ...options
      })

      return {
        data: rows.map(record => record.toJSON()),
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
          hasNext: page * limit < count,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      errorLogger.log(error, { operation: 'paginate', model: this.modelName, where, page, limit })
      throw new AppError(`Failed to paginate ${this.modelName} records`, 500)
    }
  }

  /**
   * Bulk create records
   * @param {Array} dataArray - Array of record data
   * @param {Object} options - Creation options
   * @returns {Promise<Array>} Created records
   */
  async bulkCreate(dataArray, options = {}) {
    try {
      const records = await this.model.bulkCreate(dataArray, {
        returning: true,
        ...options
      })
      return records.map(record => record.toJSON())
    } catch (error) {
      errorLogger.log(error, { operation: 'bulkCreate', model: this.modelName, count: dataArray.length })
      throw new AppError(`Failed to bulk create ${this.modelName} records`, 500)
    }
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<*>} Transaction result
   */
  async transaction(callback) {
    const sequelize = this.model.sequelize
    return await sequelize.transaction(callback)
  }
}