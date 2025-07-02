/**
 * Test Setup - Configuration pour chaque fichier de test
 */
import { beforeEach, afterEach, vi } from 'vitest'

// Setup avant chaque test
beforeEach(async () => {
  // Reset des mocks
  vi.clearAllMocks()
  
  // Reset de l'état global si nécessaire
  // Reset des services, caches, etc.
  
  // Configuration spécifique au test
  process.env.NODE_ENV = 'test'
  process.env.USE_MOCK_DB = 'true'
})

// Cleanup après chaque test
afterEach(async () => {
  // Nettoyage des mocks
  vi.restoreAllMocks()
  
  // Nettoyage des timers
  vi.useRealTimers()
  
  // Nettoyage des modules mockés
  vi.resetModules()
})

// Utilitaires de test globaux
declare global {
  var testUtils: {
    createMockUser: () => any
    createMockPage: () => any
    createMockRequest: () => any
    createMockResponse: () => any
    waitFor: (condition: () => boolean, timeout?: number) => Promise<void>
    sleep: (ms: number) => Promise<void>
  }
}

global.testUtils = {
  createMockUser: () => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role_id: 2,
    Role: {
      id: 2,
      name: 'user',
      Permissions: [
        { id: 3, name: 'view' }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  createMockPage: () => ({
    id: 1,
    title: 'Test Page',
    content: '<p>Test content</p>',
    slug: 'test-page',
    status: 'published',
    parentId: null,
    order: 0,
    level: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  createMockRequest: () => ({
    method: 'GET',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent'
    },
    body: null
  }),

  createMockResponse: () => {
    const res = {
      statusCode: 200,
      headers: {},
      body: null,
      json: vi.fn().mockResolvedValue({}),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis()
    }
    return res
  },

  waitFor: async (condition: () => boolean, timeout = 5000): Promise<void> => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (condition()) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  },

  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export pour les types TypeScript
export type TestUtils = typeof global.testUtils