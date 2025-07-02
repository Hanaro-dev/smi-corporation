/**
 * Enhanced Page Repository - Advanced database operations with caching
 */
import { BaseRepository } from './base-repository.js';
import { cacheService, CACHE_TTL } from '../services/cache-service.js';
import { QueryOptimizationService } from '../services/query-optimization-service.js';

export class PageRepositoryEnhanced extends BaseRepository {
  constructor(model, sequelize) {
    super(model);
    this.queryOptimizer = new QueryOptimizationService(sequelize);
  }

  /**
   * Find pages with hierarchical structure and caching
   */
  async findWithHierarchy(options = {}) {
    const cacheKey = `pages:hierarchy:${JSON.stringify(options)}`;
    
    return await this.queryOptimizer.cachedQuery(
      this.model,
      'findAll',
      {
        where: options.where || {},
        include: [
          {
            model: this.model,
            as: 'children',
            required: false,
            include: [
              {
                model: this.model,
                as: 'children',
                required: false
              }
            ]
          },
          {
            model: this.model,
            as: 'parent',
            required: false
          }
        ],
        order: [
          ['level', 'ASC'],
          ['order', 'ASC'],
          ['title', 'ASC']
        ]
      },
      cacheKey,
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * Find published pages with SEO optimization
   */
  async findPublished(limit = 50, offset = 0) {
    const cacheKey = `pages:published:${limit}:${offset}`;
    
    return await this.queryOptimizer.cachedQuery(
      this.model,
      'findAndCountAll',
      {
        where: { status: 'published' },
        attributes: ['id', 'title', 'slug', 'content', 'level', 'order', 'createdAt'],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      },
      cacheKey,
      CACHE_TTL.LONG
    );
  }

  /**
   * Find page by slug with caching
   */
  async findBySlug(slug, includeChildren = false) {
    const cacheKey = `pages:slug:${slug}:${includeChildren}`;
    
    const include = includeChildren ? [
      {
        model: this.model,
        as: 'children',
        where: { status: 'published' },
        required: false,
        order: [['order', 'ASC']]
      }
    ] : [];

    return await this.queryOptimizer.cachedQuery(
      this.model,
      'findOne',
      {
        where: { slug, status: 'published' },
        include
      },
      cacheKey,
      CACHE_TTL.LONG
    );
  }

  /**
   * Get navigation menu structure
   */
  async getNavigationMenu() {
    const cacheKey = 'pages:navigation:menu';
    
    return await this.queryOptimizer.cachedQuery(
      this.model,
      'findAll',
      {
        where: { 
          status: 'published',
          level: { [this.model.sequelize.Op.lte]: 1 } // Only top 2 levels for menu
        },
        attributes: ['id', 'title', 'slug', 'parentId', 'level', 'order'],
        order: [
          ['level', 'ASC'],
          ['order', 'ASC'],
          ['title', 'ASC']
        ]
      },
      cacheKey,
      CACHE_TTL.HOUR
    );
  }

  /**
   * Search pages with full-text search
   */
  async searchPages(query, limit = 20) {
    const searchTerms = query.trim().split(' ').filter(term => term.length > 2);
    
    if (searchTerms.length === 0) {
      return { count: 0, rows: [] };
    }

    const whereConditions = {
      status: 'published',
      [this.model.sequelize.Op.or]: [
        ...searchTerms.map(term => ({
          title: { [this.model.sequelize.Op.like]: `%${term}%` }
        })),
        ...searchTerms.map(term => ({
          content: { [this.model.sequelize.Op.like]: `%${term}%` }
        }))
      ]
    };

    return await this.model.findAndCountAll({
      where: whereConditions,
      attributes: ['id', 'title', 'slug', 'content', 'createdAt'],
      limit,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get page statistics
   */
  async getPageStats() {
    const cacheKey = 'pages:stats';
    
    return await cacheService.cached(cacheKey, async () => {
      const [totalPages, publishedPages, draftPages, pagesByLevel] = await Promise.all([
        this.model.count(),
        this.model.count({ where: { status: 'published' } }),
        this.model.count({ where: { status: 'draft' } }),
        this.model.findAll({
          attributes: [
            'level',
            [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id')), 'count']
          ],
          group: ['level'],
          raw: true
        })
      ]);

      return {
        total: totalPages,
        published: publishedPages,
        draft: draftPages,
        byLevel: pagesByLevel.reduce((acc, item) => {
          acc[`level${item.level}`] = parseInt(item.count);
          return acc;
        }, {})
      };
    }, CACHE_TTL.MEDIUM);
  }

  /**
   * Bulk update page order
   */
  async updatePageOrder(pageOrderMap) {
    const transaction = await this.model.sequelize.transaction();
    
    try {
      const promises = Object.entries(pageOrderMap).map(([pageId, order]) =>
        this.model.update(
          { order },
          { where: { id: pageId }, transaction }
        )
      );
      
      await Promise.all(promises);
      await transaction.commit();
      
      // Invalidate relevant caches
      this.queryOptimizer.invalidateModelCache('Page');
      
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create page with automatic slug generation
   */
  async createWithSlug(pageData) {
    // Generate unique slug if not provided
    if (!pageData.slug && pageData.title) {
      pageData.slug = await this.generateUniqueSlug(pageData.title);
    }

    const page = await this.model.create(pageData);
    
    // Invalidate caches
    this.queryOptimizer.invalidateModelCache('Page');
    
    return page;
  }

  /**
   * Generate unique slug for page
   */
  async generateUniqueSlug(title, attempt = 0) {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    if (attempt > 0) {
      slug += `-${attempt}`;
    }
    
    const existing = await this.model.findOne({ where: { slug } });
    
    if (existing) {
      return this.generateUniqueSlug(title, attempt + 1);
    }
    
    return slug;
  }

  /**
   * Update page and invalidate related caches
   */
  async updateAndInvalidateCache(id, updateData) {
    const page = await this.model.update(updateData, { where: { id } });
    
    // Invalidate specific caches
    this.queryOptimizer.invalidateModelCache('Page');
    cacheService.delete(`pages:slug:${updateData.slug}`);
    
    return page;
  }

  /**
   * Delete page with cascade and cache cleanup
   */
  async deleteWithCleanup(id) {
    const transaction = await this.model.sequelize.transaction();
    
    try {
      // Update children to have no parent
      await this.model.update(
        { parentId: null },
        { where: { parentId: id }, transaction }
      );
      
      // Delete the page
      const result = await this.model.destroy({ where: { id }, transaction });
      
      await transaction.commit();
      
      // Cleanup caches
      this.queryOptimizer.invalidateModelCache('Page');
      
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default PageRepositoryEnhanced;