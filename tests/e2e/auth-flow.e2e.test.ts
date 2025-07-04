/**
 * Tests E2E pour le flux d'authentification
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright'

describe('Authentication Flow E2E', () => {
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

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Wait for login form to load
      await page.waitForSelector('form[data-testid="login-form"]')
      
      // Fill in credentials
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'AdminSecure123!')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard
      await page.waitForURL(`${BASE_URL}/admin`)
      
      // Verify we're logged in
      expect(page.url()).toBe(`${BASE_URL}/admin`)
      
      // Check for user menu or logout button
      const userMenu = await page.locator('[data-testid="user-menu"]')
      await expect(userMenu).toBeVisible()
    })

    it('should show error message for invalid credentials', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      await page.fill('input[name="email"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]')
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toContainText('Invalid credentials')
      
      // Should stay on login page
      expect(page.url()).toContain('/auth/login')
    })

    it('should validate required fields', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      const emailError = page.locator('[data-testid="email-error"]')
      const passwordError = page.locator('[data-testid="password-error"]')
      
      await expect(emailError).toBeVisible()
      await expect(passwordError).toBeVisible()
    })

    it('should handle rate limiting', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        
        // Wait a bit between attempts
        await page.waitForTimeout(500)
      }
      
      // Should show rate limit message
      const rateLimitMessage = page.locator('[data-testid="rate-limit-error"]')
      await expect(rateLimitMessage).toBeVisible()
    })
  })

  describe('Registration Flow', () => {
    it('should successfully register new user', async () => {
      await page.goto(`${BASE_URL}/auth/register`)
      
      const timestamp = Date.now()
      const testEmail = `test${timestamp}@example.com`
      
      // Fill registration form
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', testEmail)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')
      
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard or show success message
      await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 })
      
      expect(page.url()).toBe(`${BASE_URL}/admin`)
    })

    it('should prevent registration with existing email', async () => {
      await page.goto(`${BASE_URL}/auth/register`)
      
      // Try to register with existing email
      await page.fill('input[name="name"]', 'Another User')
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]')
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toContainText('Email already exists')
    })

    it('should validate password strength', async () => {
      await page.goto(`${BASE_URL}/auth/register`)
      
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', '123') // Weak password
      await page.fill('input[name="confirmPassword"]', '123')
      
      await page.click('button[type="submit"]')
      
      // Should show password strength error
      const passwordError = page.locator('[data-testid="password-error"]')
      await expect(passwordError).toBeVisible()
      await expect(passwordError).toContainText('Password must be stronger')
    })

    it('should validate password confirmation', async () => {
      await page.goto(`${BASE_URL}/auth/register`)
      
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
      
      await page.click('button[type="submit"]')
      
      // Should show password mismatch error
      const confirmError = page.locator('[data-testid="confirm-password-error"]')
      await expect(confirmError).toBeVisible()
      await expect(confirmError).toContainText('Passwords do not match')
    })
  })

  describe('Logout Flow', () => {
    it('should successfully logout', async () => {
      // First login
      await page.goto(`${BASE_URL}/auth/login`)
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'AdminSecure123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(`${BASE_URL}/admin`)
      
      // Then logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')
      
      // Should redirect to login page
      await page.waitForURL(`${BASE_URL}/auth/login`)
      expect(page.url()).toContain('/auth/login')
      
      // Should show logout success message
      const successMessage = page.locator('[data-testid="success-message"]')
      await expect(successMessage).toBeVisible()
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', async () => {
      // Try to access protected route without being logged in
      await page.goto(`${BASE_URL}/admin`)
      
      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/auth/login`)
      expect(page.url()).toContain('/auth/login')
      
      // Should show message about login requirement
      const loginMessage = page.locator('[data-testid="login-required-message"]')
      await expect(loginMessage).toBeVisible()
    })

    it('should allow authenticated users to access protected routes', async () => {
      // Login first
      await page.goto(`${BASE_URL}/auth/login`)
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'AdminSecure123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(`${BASE_URL}/admin`)
      
      // Should be able to access admin sections
      await page.goto(`${BASE_URL}/admin/users`)
      expect(page.url()).toBe(`${BASE_URL}/admin/users`)
      
      await page.goto(`${BASE_URL}/admin/pages`)
      expect(page.url()).toBe(`${BASE_URL}/admin/pages`)
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page refreshes', async () => {
      // Login
      await page.goto(`${BASE_URL}/auth/login`)
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'AdminSecure123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(`${BASE_URL}/admin`)
      
      // Refresh page
      await page.reload()
      
      // Should still be logged in
      expect(page.url()).toBe(`${BASE_URL}/admin`)
      const userMenu = await page.locator('[data-testid="user-menu"]')
      await expect(userMenu).toBeVisible()
    })

    it('should handle session expiration', async () => {
      // Login
      await page.goto(`${BASE_URL}/auth/login`)
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'AdminSecure123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(`${BASE_URL}/admin`)
      
      // Mock session expiration by clearing cookies
      await page.context().clearCookies()
      
      // Try to access protected route
      await page.goto(`${BASE_URL}/admin/users`)
      
      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/auth/login`)
      expect(page.url()).toContain('/auth/login')
    })
  })

  describe('Security Features', () => {
    it('should implement CSRF protection', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // The form should have CSRF token
      const csrfToken = await page.locator('input[name="_token"]')
      await expect(csrfToken).toBeAttached()
    })

    it('should implement secure password requirements', async () => {
      await page.goto(`${BASE_URL}/auth/register`)
      
      // Password field should have security attributes
      const passwordInput = page.locator('input[name="password"]')
      expect(await passwordInput.getAttribute('type')).toBe('password')
      expect(await passwordInput.getAttribute('autocomplete')).toBe('new-password')
    })

    it('should handle suspicious activity', async () => {
      // This would test for things like:
      // - IP blocking after multiple failed attempts
      // - Account lockout mechanisms
      // - Security headers
      
      // Check security headers
      const response = await page.goto(`${BASE_URL}/auth/login`)
      const headers = response?.headers()
      
      expect(headers?.['x-content-type-options']).toBe('nosniff')
      expect(headers?.['x-frame-options']).toBe('DENY')
    })
  })

  describe('User Experience', () => {
    it('should show loading states during authentication', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      await page.fill('input[name="email"]', 'admin@smi-corporation.com')
      await page.fill('input[name="password"]', 'AdminSecure123!')
      
      // Click submit and immediately check for loading state
      await page.click('button[type="submit"]')
      
      // Should show loading spinner or disabled button
      const loadingState = page.locator('[data-testid="loading-spinner"]')
      await expect(loadingState).toBeVisible()
    })

    it('should provide clear error messages', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Test various error scenarios
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="password"]', 'short')
      await page.click('button[type="submit"]')
      
      // Should show specific, helpful error messages
      const emailError = page.locator('[data-testid="email-error"]')
      const passwordError = page.locator('[data-testid="password-error"]')
      
      await expect(emailError).toContainText('Please enter a valid email')
      await expect(passwordError).toContainText('Password must be at least')
    })

    it('should support keyboard navigation', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Test tab navigation
      await page.keyboard.press('Tab') // Email field
      expect(await page.locator('input[name="email"]').getAttribute('focused')).toBeDefined()
      
      await page.keyboard.press('Tab') // Password field
      expect(await page.locator('input[name="password"]').getAttribute('focused')).toBeDefined()
      
      await page.keyboard.press('Tab') // Submit button
      expect(await page.locator('button[type="submit"]').getAttribute('focused')).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Check for proper labels
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      
      expect(await emailInput.getAttribute('aria-label')).toBeTruthy()
      expect(await passwordInput.getAttribute('aria-label')).toBeTruthy()
    })

    it('should support screen readers', async () => {
      await page.goto(`${BASE_URL}/auth/login`)
      
      // Check for proper heading structure
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      
      // Check for form labels
      const labels = page.locator('label')
      expect(await labels.count()).toBeGreaterThan(0)
    })
  })
})