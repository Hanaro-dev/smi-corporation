/**
 * Tests E2E pour le workflow administrateur
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright'

describe('Admin Workflow E2E', () => {
  let browser: Browser
  let page: Page
  const BASE_URL = 'http://localhost:3000'

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.CI === 'true'
    })
    page = await browser.newPage()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    // Login as admin before each test
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', 'admin@smi-corporation.com')
    await page.fill('input[name="password"]', 'AdminSecure123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/admin`)
  })

  describe('Dashboard Overview', () => {
    it('should display admin dashboard with key metrics', async () => {
      await page.goto(`${BASE_URL}/admin`)
      
      // Check for dashboard widgets
      const statsCards = page.locator('[data-testid="stats-card"]')
      expect(await statsCards.count()).toBeGreaterThan(0)
      
      // Check for user count
      const userCount = page.locator('[data-testid="user-count"]')
      await expect(userCount).toBeVisible()
      
      // Check for page count
      const pageCount = page.locator('[data-testid="page-count"]')
      await expect(pageCount).toBeVisible()
      
      // Check for recent activity
      const recentActivity = page.locator('[data-testid="recent-activity"]')
      await expect(recentActivity).toBeVisible()
    })

    it('should show navigation menu with all admin sections', async () => {
      await page.goto(`${BASE_URL}/admin`)
      
      // Check main navigation items
      const navItems = [
        'dashboard',
        'users',
        'pages',
        'media',
        'settings'
      ]
      
      for (const item of navItems) {
        const navLink = page.locator(`[data-testid="nav-${item}"]`)
        await expect(navLink).toBeVisible()
      }
    })
  })

  describe('User Management', () => {
    it('should list all users with pagination', async () => {
      await page.goto(`${BASE_URL}/admin/users`)
      
      // Check users table
      const usersTable = page.locator('[data-testid="users-table"]')
      await expect(usersTable).toBeVisible()
      
      // Check table headers
      const headers = ['Name', 'Email', 'Role', 'Created', 'Actions']
      for (const header of headers) {
        const headerElement = page.locator(`th:has-text("${header}")`)
        await expect(headerElement).toBeVisible()
      }
      
      // Check pagination if present
      const pagination = page.locator('[data-testid="pagination"]')
      if (await pagination.isVisible()) {
        expect(await page.locator('.pagination-item').count()).toBeGreaterThan(0)
      }
    })

    it('should create new user', async () => {
      await page.goto(`${BASE_URL}/admin/users`)
      
      // Click create user button
      await page.click('[data-testid="create-user-button"]')
      
      // Fill user form
      const timestamp = Date.now()
      await page.fill('input[name="name"]', `Test User ${timestamp}`)
      await page.fill('input[name="email"]', `testuser${timestamp}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.selectOption('select[name="role_id"]', '2') // User role
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
      
      // Should redirect back to users list
      expect(page.url()).toBe(`${BASE_URL}/admin/users`)
      
      // New user should appear in list
      const newUserRow = page.locator(`text=testuser${timestamp}@example.com`)
      await expect(newUserRow).toBeVisible()
    })

    it('should edit existing user', async () => {
      await page.goto(`${BASE_URL}/admin/users`)
      
      // Click edit button for first user (not admin)
      const editButtons = page.locator('[data-testid="edit-user-button"]')
      await editButtons.first().click()
      
      // Update user name
      const nameInput = page.locator('input[name="name"]')
      await nameInput.fill('Updated User Name')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
      
      // Updated name should appear in list
      const updatedName = page.locator('text=Updated User Name')
      await expect(updatedName).toBeVisible()
    })

    it('should delete user with confirmation', async () => {
      // First create a user to delete
      await page.goto(`${BASE_URL}/admin/users`)
      await page.click('[data-testid="create-user-button"]')
      
      const timestamp = Date.now()
      await page.fill('input[name="name"]', `Delete Test ${timestamp}`)
      await page.fill('input[name="email"]', `delete${timestamp}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')
      
      // Now delete the user
      await page.waitForTimeout(1000) // Wait for user to appear
      const deleteButton = page.locator(`[data-testid="delete-user-button"]:near(text="delete${timestamp}@example.com")`)
      await deleteButton.click()
      
      // Confirm deletion
      const confirmButton = page.locator('[data-testid="confirm-delete"]')
      await confirmButton.click()
      
      // User should be removed from list
      const deletedUser = page.locator(`text=delete${timestamp}@example.com`)
      await expect(deletedUser).not.toBeVisible()
    })
  })

  describe('Page Management', () => {
    it('should list all pages with hierarchy', async () => {
      await page.goto(`${BASE_URL}/admin/pages`)
      
      // Check pages table
      const pagesTable = page.locator('[data-testid="pages-table"]')
      await expect(pagesTable).toBeVisible()
      
      // Check for hierarchy indicators
      const hierarchyIndicators = page.locator('[data-testid="page-level-indicator"]')
      if (await hierarchyIndicators.count() > 0) {
        await expect(hierarchyIndicators.first()).toBeVisible()
      }
    })

    it('should create new page', async () => {
      await page.goto(`${BASE_URL}/admin/pages`)
      
      // Click create page button
      await page.click('[data-testid="create-page-button"]')
      
      // Fill page form
      const timestamp = Date.now()
      await page.fill('input[name="title"]', `Test Page ${timestamp}`)
      
      // Use rich text editor
      const contentEditor = page.locator('[data-testid="content-editor"]')
      await contentEditor.fill(`<p>This is test content for page ${timestamp}</p>`)
      
      // Set status
      await page.selectOption('select[name="status"]', 'published')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
      
      // New page should appear in list
      const newPage = page.locator(`text=Test Page ${timestamp}`)
      await expect(newPage).toBeVisible()
    })

    it('should edit page content', async () => {
      await page.goto(`${BASE_URL}/admin/pages`)
      
      // Click edit button for first page
      const editButtons = page.locator('[data-testid="edit-page-button"]')
      await editButtons.first().click()
      
      // Update page title
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Updated Page Title')
      
      // Update content
      const contentEditor = page.locator('[data-testid="content-editor"]')
      await contentEditor.fill('<p>Updated page content</p>')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
    })

    it('should reorder pages using drag and drop', async () => {
      await page.goto(`${BASE_URL}/admin/pages`)
      
      // Get first two page rows
      const firstPage = page.locator('[data-testid="page-row"]').first()
      const secondPage = page.locator('[data-testid="page-row"]').nth(1)
      
      // Get initial order
      const firstPageTitle = await firstPage.locator('[data-testid="page-title"]').textContent()
      const secondPageTitle = await secondPage.locator('[data-testid="page-title"]').textContent()
      
      // Drag first page below second page
      await firstPage.dragTo(secondPage)
      
      // Wait for reorder to complete
      await page.waitForTimeout(1000)
      
      // Verify order has changed
      const newFirstPage = page.locator('[data-testid="page-row"]').first()
      const newFirstPageTitle = await newFirstPage.locator('[data-testid="page-title"]').textContent()
      
      expect(newFirstPageTitle).toBe(secondPageTitle)
    })
  })

  describe('Media Management', () => {
    it('should display media gallery', async () => {
      await page.goto(`${BASE_URL}/admin/media`)
      
      // Check media grid
      const mediaGrid = page.locator('[data-testid="media-grid"]')
      await expect(mediaGrid).toBeVisible()
      
      // Check upload area
      const uploadArea = page.locator('[data-testid="upload-area"]')
      await expect(uploadArea).toBeVisible()
    })

    it('should upload new image', async () => {
      await page.goto(`${BASE_URL}/admin/media`)
      
      // Create a test image file (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      )
      
      // Upload file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: testImageBuffer
      })
      
      // Wait for upload to complete
      const uploadSuccess = page.locator('[data-testid="upload-success"]')
      await expect(uploadSuccess).toBeVisible({ timeout: 10000 })
      
      // New image should appear in grid
      const newImage = page.locator('[data-testid="media-item"]:has-text("test-image.png")')
      await expect(newImage).toBeVisible()
    })

    it('should edit image metadata', async () => {
      await page.goto(`${BASE_URL}/admin/media`)
      
      // Click on first image
      const firstImage = page.locator('[data-testid="media-item"]').first()
      await firstImage.click()
      
      // Should open image details modal
      const imageModal = page.locator('[data-testid="image-modal"]')
      await expect(imageModal).toBeVisible()
      
      // Edit alt text
      const altTextInput = page.locator('input[name="alt_text"]')
      await altTextInput.fill('Updated alt text')
      
      // Save changes
      await page.click('[data-testid="save-image-button"]')
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
    })
  })

  describe('Settings Management', () => {
    it('should display settings sections', async () => {
      await page.goto(`${BASE_URL}/admin/settings`)
      
      // Check settings sections
      const settingsSections = [
        'general',
        'security',
        'email',
        'backup'
      ]
      
      for (const section of settingsSections) {
        const sectionTab = page.locator(`[data-testid="settings-${section}"]`)
        await expect(sectionTab).toBeVisible()
      }
    })

    it('should update general settings', async () => {
      await page.goto(`${BASE_URL}/admin/settings`)
      
      // Update site name
      const siteNameInput = page.locator('input[name="site_name"]')
      await siteNameInput.fill('Updated Site Name')
      
      // Update site description
      const siteDescInput = page.locator('textarea[name="site_description"]')
      await siteDescInput.fill('Updated site description')
      
      // Save settings
      await page.click('[data-testid="save-settings-button"]')
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
    })
  })

  describe('Search and Filtering', () => {
    it('should search users by name or email', async () => {
      await page.goto(`${BASE_URL}/admin/users`)
      
      // Enter search term
      const searchInput = page.locator('[data-testid="search-input"]')
      await searchInput.fill('admin')
      
      // Wait for search results
      await page.waitForTimeout(500)
      
      // Should show filtered results
      const userRows = page.locator('[data-testid="user-row"]')
      const rowCount = await userRows.count()
      
      // Verify all visible rows contain search term
      for (let i = 0; i < rowCount; i++) {
        const rowText = await userRows.nth(i).textContent()
        expect(rowText?.toLowerCase()).toContain('admin')
      }
    })

    it('should filter pages by status', async () => {
      await page.goto(`${BASE_URL}/admin/pages`)
      
      // Select published filter
      const statusFilter = page.locator('[data-testid="status-filter"]')
      await statusFilter.selectOption('published')
      
      // Wait for filter to apply
      await page.waitForTimeout(500)
      
      // All visible pages should be published
      const pageRows = page.locator('[data-testid="page-row"]')
      const rowCount = await pageRows.count()
      
      for (let i = 0; i < rowCount; i++) {
        const statusBadge = pageRows.nth(i).locator('[data-testid="status-badge"]')
        await expect(statusBadge).toContainText('Published')
      }
    })
  })

  describe('Bulk Operations', () => {
    it('should select multiple users for bulk actions', async () => {
      await page.goto(`${BASE_URL}/admin/users`)
      
      // Select multiple users
      const checkboxes = page.locator('[data-testid="user-checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount >= 2) {
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()
        
        // Bulk actions should become available
        const bulkActions = page.locator('[data-testid="bulk-actions"]')
        await expect(bulkActions).toBeVisible()
        
        // Selected count should be displayed
        const selectedCount = page.locator('[data-testid="selected-count"]')
        await expect(selectedCount).toContainText('2 selected')
      }
    })

    it('should bulk delete selected pages', async () => {
      await page.goto(`${BASE_URL}/admin/pages`)
      
      // Create test pages for deletion
      const testPages = ['Bulk Test 1', 'Bulk Test 2']
      
      for (const title of testPages) {
        await page.click('[data-testid="create-page-button"]')
        await page.fill('input[name="title"]', title)
        await page.fill('[data-testid="content-editor"]', '<p>Test content</p>')
        await page.click('button[type="submit"]')
        await page.waitForURL(`${BASE_URL}/admin/pages`)
      }
      
      // Select the test pages
      for (const title of testPages) {
        const pageRow = page.locator(`[data-testid="page-row"]:has-text("${title}")`)
        const checkbox = pageRow.locator('[data-testid="page-checkbox"]')
        await checkbox.check()
      }
      
      // Execute bulk delete
      await page.click('[data-testid="bulk-delete-button"]')
      await page.click('[data-testid="confirm-bulk-delete"]')
      
      // Pages should be removed
      for (const title of testPages) {
        const deletedPage = page.locator(`text=${title}`)
        await expect(deletedPage).not.toBeVisible()
      }
    })
  })

  describe('Real-time Updates', () => {
    it('should show live notifications for system events', async () => {
      await page.goto(`${BASE_URL}/admin`)
      
      // Check for notification area
      const notificationArea = page.locator('[data-testid="notification-area"]')
      
      if (await notificationArea.isVisible()) {
        // Perform an action that should trigger a notification
        await page.goto(`${BASE_URL}/admin/users`)
        await page.click('[data-testid="create-user-button"]')
        
        const timestamp = Date.now()
        await page.fill('input[name="name"]', `Notification Test ${timestamp}`)
        await page.fill('input[name="email"]', `notify${timestamp}@example.com`)
        await page.fill('input[name="password"]', 'SecurePassword123!')
        await page.click('button[type="submit"]')
        
        // Should show notification
        const notification = page.locator('[data-testid="notification"]')
        await expect(notification).toBeVisible({ timeout: 5000 })
      }
    })
  })
})