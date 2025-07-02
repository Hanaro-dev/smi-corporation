/**
 * Page Service - Business logic layer for page operations
 */
import { PageRepositoryEnhanced } from '../repositories/page-repository-enhanced.js';
import { databaseService } from './database-service.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/error-handler.js';
import { PasswordStrengthValidator } from '../utils/password-strength.js';
import DOMPurify from 'dompurify';

export class PageService {
  constructor() {
    this.pageRepository = new PageRepositoryEnhanced(
      databaseService.models.Page,
      databaseService.sequelize
    );
  }

  /**
   * Get all pages with optional filtering and pagination
   */
  async getPages(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      parentId,
      level,
      search,
      includeHierarchy = false
    } = options;

    try {
      if (search) {
        return await this.pageRepository.searchPages(search, limit);
      }

      if (includeHierarchy) {
        return await this.pageRepository.findWithHierarchy({
          where: this.buildWhereClause({ status, parentId, level })
        });
      }

      const offset = (page - 1) * limit;
      return await this.pageRepository.findPublished(limit, offset);
    } catch (error) {
      throw new Error(`Failed to retrieve pages: ${error.message}`);
    }
  }

  /**
   * Get page by slug with validation
   */
  async getPageBySlug(slug, includeChildren = false) {
    if (!slug || typeof slug !== 'string') {
      throw new ValidationError('Slug is required and must be a string');
    }

    const page = await this.pageRepository.findBySlug(slug, includeChildren);
    
    if (!page) {
      throw new NotFoundError(`Page with slug '${slug}' not found`);
    }

    return this.sanitizePageContent(page);
  }

  /**
   * Create new page with validation
   */
  async createPage(pageData, userId) {
    // Validate required fields
    this.validatePageData(pageData);
    
    // Sanitize content
    const sanitizedData = this.sanitizePageData(pageData);
    
    // Add audit information
    sanitizedData.createdBy = userId;
    
    try {
      // Check for slug conflicts
      if (sanitizedData.slug) {
        const existing = await this.pageRepository.findBySlug(sanitizedData.slug);
        if (existing) {
          throw new ConflictError(`Page with slug '${sanitizedData.slug}' already exists`);
        }
      }

      // Validate parent relationship
      if (sanitizedData.parentId) {
        await this.validateParentRelationship(sanitizedData.parentId, sanitizedData.level);
      }

      const page = await this.pageRepository.createWithSlug(sanitizedData);
      
      return this.sanitizePageContent(page);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to create page: ${error.message}`);
    }
  }

  /**
   * Update existing page
   */
  async updatePage(id, updateData, userId) {
    if (!id || isNaN(parseInt(id))) {
      throw new ValidationError('Valid page ID is required');
    }

    // Get existing page
    const existingPage = await this.pageRepository.findById(id);
    if (!existingPage) {
      throw new NotFoundError(`Page with ID ${id} not found`);
    }

    // Validate update data
    this.validatePageData(updateData, false); // partial validation for updates
    
    // Sanitize content
    const sanitizedData = this.sanitizePageData(updateData);
    
    // Add audit information
    sanitizedData.updatedBy = userId;

    try {
      // Check for slug conflicts (excluding current page)
      if (sanitizedData.slug && sanitizedData.slug !== existingPage.slug) {
        const existing = await this.pageRepository.findBySlug(sanitizedData.slug);
        if (existing && existing.id !== id) {
          throw new ConflictError(`Page with slug '${sanitizedData.slug}' already exists`);
        }
      }

      // Validate parent relationship changes
      if (sanitizedData.parentId !== undefined) {
        await this.validateParentRelationship(sanitizedData.parentId, sanitizedData.level || existingPage.level, id);
      }

      const updatedPage = await this.pageRepository.updateAndInvalidateCache(id, sanitizedData);
      
      return this.sanitizePageContent(updatedPage);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to update page: ${error.message}`);
    }
  }

  /**
   * Delete page with validation
   */
  async deletePage(id, userId) {
    if (!id || isNaN(parseInt(id))) {
      throw new ValidationError('Valid page ID is required');
    }

    const page = await this.pageRepository.findById(id);
    if (!page) {
      throw new NotFoundError(`Page with ID ${id} not found`);
    }

    // Check if page has children
    const children = await this.pageRepository.findByParentId(id);
    if (children.length > 0) {
      throw new ConflictError('Cannot delete page with child pages. Delete or move children first.');
    }

    try {
      await this.pageRepository.deleteWithCleanup(id);
      
      // Log deletion for audit
      console.log(`Page ${id} deleted by user ${userId} at ${new Date().toISOString()}`);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete page: ${error.message}`);
    }
  }

  /**
   * Get navigation menu
   */
  async getNavigationMenu() {
    try {
      const pages = await this.pageRepository.getNavigationMenu();
      return this.buildNavigationTree(pages);
    } catch (error) {
      throw new Error(`Failed to retrieve navigation menu: ${error.message}`);
    }
  }

  /**
   * Get page statistics
   */
  async getPageStatistics() {
    try {
      return await this.pageRepository.getPageStats();
    } catch (error) {
      throw new Error(`Failed to retrieve page statistics: ${error.message}`);
    }
  }

  /**
   * Reorder pages
   */
  async reorderPages(pageOrderMap, userId) {
    if (!pageOrderMap || typeof pageOrderMap !== 'object') {
      throw new ValidationError('Page order map is required');
    }

    try {
      await this.pageRepository.updatePageOrder(pageOrderMap);
      
      // Log reordering for audit
      console.log(`Pages reordered by user ${userId} at ${new Date().toISOString()}`);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to reorder pages: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Validate page data
   */
  validatePageData(data, requireAll = true) {
    if (requireAll) {
      if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
        throw new ValidationError('Title is required and must be at least 3 characters long');
      }
    }

    if (data.title && (typeof data.title !== 'string' || data.title.length > 255)) {
      throw new ValidationError('Title must be a string and cannot exceed 255 characters');
    }

    if (data.slug && !/^[a-z0-9-]+$/i.test(data.slug)) {
      throw new ValidationError('Slug can only contain letters, numbers, and hyphens');
    }

    if (data.status && !['draft', 'published'].includes(data.status)) {
      throw new ValidationError('Status must be either "draft" or "published"');
    }

    if (data.level !== undefined && (data.level < 0 || data.level > 2)) {
      throw new ValidationError('Level must be between 0 and 2');
    }
  }

  /**
   * Sanitize page data
   */
  sanitizePageData(data) {
    const sanitized = { ...data };

    // Sanitize HTML content
    if (sanitized.content) {
      sanitized.content = DOMPurify.sanitize(sanitized.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
      });
    }

    // Trim string fields
    if (sanitized.title) sanitized.title = sanitized.title.trim();
    if (sanitized.slug) sanitized.slug = sanitized.slug.trim().toLowerCase();

    return sanitized;
  }

  /**
   * Sanitize page content for output
   */
  sanitizePageContent(page) {
    if (!page) return page;

    const sanitized = page.toJSON ? page.toJSON() : { ...page };
    
    // Remove sensitive fields
    delete sanitized.createdBy;
    delete sanitized.updatedBy;
    
    return sanitized;
  }

  /**
   * Validate parent relationship
   */
  async validateParentRelationship(parentId, level, excludeId = null) {
    if (!parentId) return; // No parent is valid

    const parent = await this.pageRepository.findById(parentId);
    if (!parent) {
      throw new ValidationError('Parent page does not exist');
    }

    // Check level constraints
    if (level !== undefined && parent.level + 1 !== level) {
      throw new ValidationError('Page level must be exactly one level deeper than parent');
    }

    // Prevent circular references
    if (excludeId && parentId === excludeId) {
      throw new ValidationError('Page cannot be its own parent');
    }
  }

  /**
   * Build navigation tree from flat array
   */
  buildNavigationTree(pages) {
    const pageMap = new Map();
    const tree = [];

    // Create map for quick lookup
    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    // Build tree structure
    pages.forEach(page => {
      const pageNode = pageMap.get(page.id);
      
      if (page.parentId && pageMap.has(page.parentId)) {
        pageMap.get(page.parentId).children.push(pageNode);
      } else {
        tree.push(pageNode);
      }
    });

    return tree;
  }

  /**
   * Build where clause for filtering
   */
  buildWhereClause(filters) {
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    if (filters.level !== undefined) {
      where.level = filters.level;
    }

    return where;
  }
}

export default PageService;