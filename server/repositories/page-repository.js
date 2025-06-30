// Page repository with page-specific operations
import { BaseRepository } from './base-repository.js'
import { pageDb } from '../utils/mock-db.js'
import { ConflictError } from '../utils/error-handler.js'
import { pageCache, cacheKeys, invalidatePageCache } from '../utils/cache.js'

export class PageRepository extends BaseRepository {
  constructor() {
    super(pageDb, 'Page')
  }

  /**
   * Find page by slug
   * @param {string} slug - Page slug
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Page or null
   */
  async findBySlug(slug, options = {}) {
    const cacheKey = `page:slug:${slug}`
    const cached = pageCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const page = await this.findOne({ slug }, options)
    
    if (page) {
      pageCache.set(cacheKey, page, 900000) // 15 minutes
      pageCache.set(cacheKeys.page(page.id), page, 900000)
    }

    return page
  }

  /**
   * Find published pages
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Published pages
   */
  async findPublished(options = {}) {
    const cacheKey = cacheKeys.pagesByStatus('published')
    const cached = pageCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const pages = await this.findAll({ status: 'published' }, {
      order: [['updated_at', 'DESC']],
      ...options
    })

    pageCache.set(cacheKey, pages, 900000) // 15 minutes

    return pages
  }

  /**
   * Find pages by parent ID
   * @param {number|null} parentId - Parent page ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Child pages
   */
  async findByParent(parentId, options = {}) {
    const cacheKey = cacheKeys.pagesByParent(parentId)
    const cached = pageCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const pages = await this.findAll({ parent_id: parentId }, {
      order: [['title', 'ASC']],
      ...options
    })

    pageCache.set(cacheKey, pages, 900000) // 15 minutes

    return pages
  }

  /**
   * Get navigation tree
   * @returns {Promise<Array>} Hierarchical page structure
   */
  async getNavigationTree() {
    const cacheKey = cacheKeys.navigationTree()
    const cached = pageCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const pages = await this.findPublished()
    const tree = this.buildTree(pages)

    pageCache.set(cacheKey, tree, 1800000) // 30 minutes

    return tree
  }

  /**
   * Build hierarchical tree from flat page array
   * @param {Array} pages - Flat array of pages
   * @param {number|null} parentId - Parent ID to build from
   * @returns {Array} Tree structure
   */
  buildTree(pages, parentId = null) {
    const children = pages.filter(page => page.parent_id === parentId)
    
    return children.map(page => ({
      ...page,
      children: this.buildTree(pages, page.id)
    }))
  }

  /**
   * Create page with unique slug validation
   * @param {Object} pageData - Page data
   * @returns {Promise<Object>} Created page
   */
  async create(pageData) {
    // Check if slug already exists
    if (pageData.slug) {
      const existingPage = await this.findBySlug(pageData.slug)
      if (existingPage) {
        throw new ConflictError('Slug already exists')
      }
    }

    // Validate parent exists if specified
    if (pageData.parent_id) {
      const parent = await this.findById(pageData.parent_id)
      if (!parent) {
        throw new ConflictError('Parent page does not exist')
      }
    }

    const page = await super.create(pageData)

    // Invalidate related cache
    this.invalidateNavigationCache()
    if (pageData.parent_id) {
      invalidatePageCache(null, pageData.parent_id)
    }

    return page
  }

  /**
   * Update page and invalidate cache
   * @param {number} pageId - Page ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated page
   */
  async updateById(pageId, updateData) {
    // Get current page for cache invalidation
    const currentPage = await this.findById(pageId)
    if (!currentPage) {
      throw new NotFoundError('Page not found')
    }

    // Check slug uniqueness if being updated
    if (updateData.slug && updateData.slug !== currentPage.slug) {
      const existing = await this.findBySlug(updateData.slug)
      if (existing && existing.id !== pageId) {
        throw new ConflictError('Slug already exists')
      }
    }

    // Validate parent exists if being updated
    if (updateData.parent_id && updateData.parent_id !== currentPage.parent_id) {
      const parent = await this.findById(updateData.parent_id)
      if (!parent) {
        throw new ConflictError('Parent page does not exist')
      }
    }

    const updatedPage = await super.updateById(pageId, updateData)

    // Invalidate cache
    invalidatePageCache(pageId, currentPage.parent_id)
    if (updateData.parent_id && updateData.parent_id !== currentPage.parent_id) {
      invalidatePageCache(null, updateData.parent_id)
    }
    this.invalidateNavigationCache()

    return updatedPage
  }

  /**
   * Delete page and invalidate cache
   * @param {number} pageId - Page ID
   * @returns {Promise<boolean>} Success
   */
  async deleteById(pageId) {
    const page = await this.findById(pageId)
    if (!page) {
      throw new NotFoundError('Page not found')
    }

    // Check for child pages
    const children = await this.findByParent(pageId)
    if (children.length > 0) {
      throw new ConflictError('Cannot delete page with child pages')
    }

    const result = await super.deleteById(pageId)

    // Invalidate cache
    invalidatePageCache(pageId, page.parent_id)
    this.invalidateNavigationCache()

    return result
  }

  /**
   * Search pages by title and content
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Search results with pagination
   */
  async search(query, page = 1, limit = 10) {
    const searchWhere = {
      $or: [
        { title: { $like: `%${query}%` } },
        { content: { $like: `%${query}%` } },
        { slug: { $like: `%${query}%` } }
      ]
    }

    return await this.paginate(searchWhere, page, limit, {
      order: [['updated_at', 'DESC']]
    })
  }

  /**
   * Get page statistics
   * @returns {Promise<Object>} Page statistics
   */
  async getStatistics() {
    const [
      totalPages,
      publishedPages,
      draftPages,
      topLevelPages
    ] = await Promise.all([
      this.count(),
      this.count({ status: 'published' }),
      this.count({ status: 'draft' }),
      this.count({ parent_id: null })
    ])

    return {
      total: totalPages,
      published: publishedPages,
      drafts: draftPages,
      topLevel: topLevelPages
    }
  }

  /**
   * Get pages by status with pagination
   * @param {string} status - Page status
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Paginated results
   */
  async findByStatus(status, page = 1, limit = 10) {
    return await this.paginate({ status }, page, limit, {
      order: [['updated_at', 'DESC']]
    })
  }

  /**
   * Invalidate navigation cache
   * @private
   */
  invalidateNavigationCache() {
    pageCache.delete(cacheKeys.navigationTree())
    pageCache.delete(cacheKeys.pagesByStatus('published'))
  }

  /**
   * Duplicate page
   * @param {number} pageId - Source page ID
   * @param {Object} overrides - Fields to override
   * @returns {Promise<Object>} Duplicated page
   */
  async duplicate(pageId, overrides = {}) {
    const sourcePage = await this.findByIdOrFail(pageId)
    
    // Remove ID and create new slug
    const { id, created_at, updated_at, ...pageData } = sourcePage
    
    const newPageData = {
      ...pageData,
      title: `${pageData.title} (Copy)`,
      slug: `${pageData.slug}-copy-${Date.now()}`,
      status: 'draft',
      ...overrides
    }

    return await this.create(newPageData)
  }
}