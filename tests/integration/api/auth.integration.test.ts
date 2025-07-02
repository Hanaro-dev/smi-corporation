/**
 * Tests d'intégration pour l'API d'authentification
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { $fetch } from 'ofetch'

describe('Authentication API Integration', () => {
  const API_BASE = 'http://localhost:3000/api'
  let testServer: any
  
  beforeAll(async () => {
    // Start test server if needed
    // testServer = await startTestServer()
  })
  
  afterAll(async () => {
    // Cleanup test server
    // if (testServer) await testServer.close()
  })

  beforeEach(() => {
    // Reset state before each test
  })

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await $fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: {
          email: 'admin@smi-corporation.com',
          password: 'AdminSecure123!'
        }
      })

      expect(response).toMatchObject({
        success: true,
        user: expect.objectContaining({
          email: 'admin@smi-corporation.com',
          name: expect.any(String)
        }),
        token: expect.any(String)
      })
      
      expect(response.user.password).toBeUndefined() // Password should not be in response
    })

    it('should reject invalid credentials', async () => {
      await expect($fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: {
          email: 'admin@smi-corporation.com',
          password: 'wrongpassword'
        }
      })).rejects.toThrow()
    })

    it('should reject malformed requests', async () => {
      await expect($fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: {
          email: 'not-an-email',
          password: 'short'
        }
      })).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      const attempts = Array(6).fill(null).map(() => 
        $fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        }).catch(e => e)
      )

      const results = await Promise.allSettled(attempts)
      
      // Should have some rate limit errors
      const rateLimitErrors = results.filter(result => 
        result.status === 'rejected' && 
        result.reason?.response?.status === 429
      )
      
      expect(rateLimitErrors.length).toBeGreaterThan(0)
    })

    it('should set secure cookies on successful login', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smi-corporation.com',
          password: 'AdminSecure123!'
        })
      })

      expect(response.ok).toBe(true)
      
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('auth_token=')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('SameSite=Strict')
    })
  })

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'SecurePassword123!'
      }

      const response = await $fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: userData
      })

      expect(response).toMatchObject({
        success: true,
        user: expect.objectContaining({
          name: userData.name,
          email: userData.email
        })
      })
    })

    it('should reject duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'admin@smi-corporation.com', // Already exists
        password: 'SecurePassword123!'
      }

      await expect($fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: userData
      })).rejects.toThrow()
    })

    it('should validate password strength', async () => {
      const userData = {
        name: 'Test User',
        email: `weak_${Date.now()}@example.com`,
        password: '123' // Too weak
      }

      await expect($fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: userData
      })).rejects.toThrow()
    })

    it('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'not-an-email',
        password: 'SecurePassword123!'
      }

      await expect($fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: userData
      })).rejects.toThrow()
    })
  })

  describe('POST /auth/logout', () => {
    it('should successfully logout authenticated user', async () => {
      // First login to get a valid session
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smi-corporation.com',
          password: 'AdminSecure123!'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')
      
      // Then logout with the session cookie
      const logoutResponse = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        }
      })

      expect(logoutResponse.ok).toBe(true)
      
      const result = await logoutResponse.json()
      expect(result).toMatchObject({
        success: true,
        message: expect.any(String)
      })
    })

    it('should handle logout without valid session', async () => {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      // Should still return success for logout
      expect(response.ok).toBe(true)
    })
  })

  describe('GET /_auth/session', () => {
    it('should return session data for authenticated user', async () => {
      // Login first
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smi-corporation.com',
          password: 'AdminSecure123!'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')
      
      // Check session
      const sessionResponse = await fetch(`${API_BASE}/_auth/session`, {
        headers: { 'Cookie': cookies || '' }
      })

      expect(sessionResponse.ok).toBe(true)
      
      const session = await sessionResponse.json()
      expect(session).toMatchObject({
        success: true,
        data: {
          user: expect.objectContaining({
            email: 'admin@smi-corporation.com'
          })
        }
      })
    })

    it('should return error for unauthenticated request', async () => {
      const response = await fetch(`${API_BASE}/_auth/session`)
      
      expect(response.status).toBe(401)
    })

    it('should return error for invalid/expired token', async () => {
      const response = await fetch(`${API_BASE}/_auth/session`, {
        headers: { 'Cookie': 'auth_token=invalid_token' }
      })
      
      expect(response.status).toBe(401)
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication cycle', async () => {
      // 1. Register new user
      const userData = {
        name: 'Integration Test User',
        email: `integration_${Date.now()}@example.com`,
        password: 'IntegrationTest123!'
      }

      const registerResponse = await $fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: userData
      })

      expect(registerResponse.success).toBe(true)

      // 2. Login with new user
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password
        })
      })

      expect(loginResponse.ok).toBe(true)
      const cookies = loginResponse.headers.get('set-cookie')

      // 3. Verify session
      const sessionResponse = await fetch(`${API_BASE}/_auth/session`, {
        headers: { 'Cookie': cookies || '' }
      })

      expect(sessionResponse.ok).toBe(true)
      const session = await sessionResponse.json()
      expect(session.data.user.email).toBe(userData.email)

      // 4. Logout
      const logoutResponse = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Cookie': cookies || '' }
      })

      expect(logoutResponse.ok).toBe(true)

      // 5. Verify session is invalid after logout
      const postLogoutSession = await fetch(`${API_BASE}/_auth/session`, {
        headers: { 'Cookie': cookies || '' }
      })

      expect(postLogoutSession.status).toBe(401)
    })
  })

  describe('Security Features', () => {
    it('should enforce HTTPS in production', async () => {
      // This test would need environment setup for production mode
      // Skip in test environment
    })

    it('should include security headers', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smi-corporation.com',
          password: 'AdminSecure123!'
        })
      })

      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('DENY')
    })

    it('should handle concurrent login attempts gracefully', async () => {
      const concurrentLogins = Array(10).fill(null).map(() =>
        $fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: {
            email: 'admin@smi-corporation.com',
            password: 'AdminSecure123!'
          }
        })
      )

      const results = await Promise.allSettled(concurrentLogins)
      
      // All should succeed (or fail due to rate limiting, not race conditions)
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.success).toBe(true)
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should return structured error responses', async () => {
      try {
        await $fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: {
            email: 'invalid@example.com',
            password: 'wrongpassword'
          }
        })
      } catch (error: any) {
        expect(error.response?.status).toBe(401)
        expect(error.data).toMatchObject({
          success: false,
          message: expect.any(String),
          timestamp: expect.any(String)
        })
      }
    })

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      try {
        await $fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: {
            email: 'test@example.com'
            // Missing password
          }
        })
      } catch (error: any) {
        expect(error.response?.status).toBe(400)
      }
    })
  })
})