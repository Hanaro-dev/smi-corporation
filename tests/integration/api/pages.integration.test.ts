/**
 * Tests d'intégration pour l'API des pages
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { $fetch } from 'ofetch'

describe('Pages API Integration', () => {
  const API_BASE = 'http://localhost:3000/api'
  let testServer: any
  let authCookies: string

  beforeAll(async () => {
    // Start test server if needed
    // testServer = await startTestServer()
    
    // Login to get authentication cookies
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smi-corporation.com',
        password: 'AdminSecure123!'
      })
    })
    
    authCookies = loginResponse.headers.get('set-cookie') || ''
  })
  
  afterAll(async () => {
    // Cleanup test server
    // if (testServer) await testServer.close()
  })

  beforeEach(() => {
    // Reset state before each test
  })

  describe('GET /api/pages', () => {
    it('should list all pages for authenticated users', async () => {
      const response = await fetch(`${API_BASE}/pages`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      
      if (result.data.length > 0) {
        expect(result.data[0]).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          slug: expect.any(String),
          status: expect.stringMatching(/^(draft|published)$/)
        })
      }
    })

    it('should filter pages by status', async () => {
      const response = await fetch(`${API_BASE}/pages?status=published`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      
      // All returned pages should have published status
      result.data.forEach((page: any) => {
        expect(page.status).toBe('published')
      })
    })

    it('should support pagination', async () => {
      const response = await fetch(`${API_BASE}/pages?page=1&limit=5`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      })
      expect(result.data.length).toBeLessThanOrEqual(5)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_BASE}/pages`)
      
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/pages/:id', () => {
    it('should get specific page by ID', async () => {
      // First get a page ID from the list
      const listResponse = await fetch(`${API_BASE}/pages`, {
        headers: { 'Cookie': authCookies }
      })
      const listResult = await listResponse.json()
      
      if (listResult.data.length === 0) {
        // Skip if no pages exist
        return
      }
      
      const pageId = listResult.data[0].id
      
      const response = await fetch(`${API_BASE}/pages/${pageId}`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        id: pageId,
        title: expect.any(String),
        content: expect.any(String),
        slug: expect.any(String),
        status: expect.stringMatching(/^(draft|published)$/)
      })
    })

    it('should return 404 for non-existent page', async () => {
      const response = await fetch(`${API_BASE}/pages/99999`, {
        headers: { 'Cookie': authCookies }
      })
      
      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid page ID', async () => {
      const response = await fetch(`${API_BASE}/pages/invalid`, {
        headers: { 'Cookie': authCookies }
      })
      
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/pages', () => {
    it('should create new page with valid data', async () => {
      const newPage = {
        title: `Test Page ${Date.now()}`,
        content: '<p>This is a test page content</p>',
        status: 'draft'
      }

      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(newPage)
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        id: expect.any(Number),
        title: newPage.title,
        content: newPage.content,
        status: newPage.status,
        slug: expect.any(String)
      })
    })

    it('should auto-generate slug from title', async () => {
      const newPage = {
        title: 'Auto Generated Slug Test',
        content: '<p>Test content</p>',
        status: 'draft'
      }

      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(newPage)
      })

      const result = await response.json()
      expect(result.data.slug).toBe('auto-generated-slug-test')
    })

    it('should validate required fields', async () => {
      const invalidPage = {
        content: '<p>Missing title</p>'
      }

      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(invalidPage)
      })

      expect(response.status).toBe(400)
      
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should prevent duplicate slugs', async () => {
      const page1 = {
        title: 'Duplicate Slug Test',
        content: '<p>First page</p>',
        slug: 'duplicate-test',
        status: 'draft'
      }

      const page2 = {
        title: 'Another Page',
        content: '<p>Second page</p>',
        slug: 'duplicate-test', // Same slug
        status: 'draft'
      }

      // Create first page
      await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(page1)
      })

      // Try to create second page with same slug
      const response2 = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(page2)
      })

      expect(response2.status).toBe(400)
    })

    it('should require authentication', async () => {
      const newPage = {
        title: 'Unauthorized Test',
        content: '<p>Test content</p>'
      }

      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage)
      })
      
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/pages/:id', () => {
    let testPageId: number

    beforeEach(async () => {
      // Create a test page for updating
      const newPage = {
        title: `Update Test Page ${Date.now()}`,
        content: '<p>Original content</p>',
        status: 'draft'
      }

      const createResponse = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(newPage)
      })

      const createResult = await createResponse.json()
      testPageId = createResult.data.id
    })

    it('should update existing page', async () => {
      const updatedData = {
        title: 'Updated Title',
        content: '<p>Updated content</p>',
        status: 'published'
      }

      const response = await fetch(`${API_BASE}/pages/${testPageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(updatedData)
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        id: testPageId,
        title: updatedData.title,
        content: updatedData.content,
        status: updatedData.status
      })
    })

    it('should return 404 for non-existent page', async () => {
      const response = await fetch(`${API_BASE}/pages/99999`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify({ title: 'Not found' })
      })
      
      expect(response.status).toBe(404)
    })

    it('should validate update data', async () => {
      const invalidData = {
        title: '', // Empty title
        status: 'invalid-status'
      }

      const response = await fetch(`${API_BASE}/pages/${testPageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/pages/:id', () => {
    let testPageId: number

    beforeEach(async () => {
      // Create a test page for deletion
      const newPage = {
        title: `Delete Test Page ${Date.now()}`,
        content: '<p>To be deleted</p>',
        status: 'draft'
      }

      const createResponse = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(newPage)
      })

      const createResult = await createResponse.json()
      testPageId = createResult.data.id
    })

    it('should delete existing page', async () => {
      const response = await fetch(`${API_BASE}/pages/${testPageId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      
      // Verify page is deleted
      const getResponse = await fetch(`${API_BASE}/pages/${testPageId}`, {
        headers: { 'Cookie': authCookies }
      })
      
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent page', async () => {
      const response = await fetch(`${API_BASE}/pages/99999`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookies }
      })
      
      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_BASE}/pages/${testPageId}`, {
        method: 'DELETE'
      })
      
      expect(response.status).toBe(401)
    })
  })

  describe('Page Hierarchy', () => {
    it('should handle parent-child relationships', async () => {
      // Create parent page
      const parentPage = {
        title: 'Parent Page',
        content: '<p>Parent content</p>',
        status: 'published'
      }

      const parentResponse = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(parentPage)
      })

      const parentResult = await parentResponse.json()
      const parentId = parentResult.data.id

      // Create child page
      const childPage = {
        title: 'Child Page',
        content: '<p>Child content</p>',
        parentId: parentId,
        status: 'published'
      }

      const childResponse = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify(childPage)
      })

      expect(childResponse.ok).toBe(true)
      
      const childResult = await childResponse.json()
      expect(childResult.data.parentId).toBe(parentId)
      expect(childResult.data.level).toBe(1)
    })

    it('should list pages with hierarchy information', async () => {
      const response = await fetch(`${API_BASE}/pages?includeHierarchy=true`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      
      // Check if hierarchy info is included
      const pagesWithChildren = result.data.filter((page: any) => page.children)
      if (pagesWithChildren.length > 0) {
        expect(pagesWithChildren[0].children).toBeInstanceOf(Array)
      }
    })
  })

  describe('Search and Filtering', () => {
    it('should search pages by title', async () => {
      const searchTerm = 'Search Test'
      
      // Create a page with searchable title
      await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify({
          title: `${searchTerm} Page`,
          content: '<p>Searchable content</p>',
          status: 'published'
        })
      })

      const response = await fetch(`${API_BASE}/pages?search=${encodeURIComponent(searchTerm)}`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      
      // Should find the page we created
      const foundPage = result.data.find((page: any) => 
        page.title.includes(searchTerm)
      )
      expect(foundPage).toBeDefined()
    })

    it('should filter by multiple criteria', async () => {
      const response = await fetch(
        `${API_BASE}/pages?status=published&parentId=null&orderBy=createdAt&order=desc`,
        { headers: { 'Cookie': authCookies } }
      )

      expect(response.ok).toBe(true)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      
      // Verify filtering worked
      if (result.data.length > 0) {
        result.data.forEach((page: any) => {
          expect(page.status).toBe('published')
          expect(page.parentId).toBeNull()
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: 'invalid json'
      })

      expect(response.status).toBe(400)
    })

    it('should return structured error responses', async () => {
      const response = await fetch(`${API_BASE}/pages/invalid-id`, {
        headers: { 'Cookie': authCookies }
      })

      expect(response.status).toBe(400)
      
      const result = await response.json()
      expect(result).toMatchObject({
        success: false,
        message: expect.any(String),
        timestamp: expect.any(String)
      })
    })
  })
})