import { vi } from 'vitest'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.USE_MOCK_DB = 'true'
process.env.NODE_ENV = 'test'

// Mock global functions
global.defineEventHandler = vi.fn()
global.getQuery = vi.fn()
global.readBody = vi.fn()
global.getCookie = vi.fn()
global.setCookie = vi.fn()
global.getHeader = vi.fn()
global.setHeader = vi.fn()
global.createError = vi.fn()

// Suppress console.log in tests
console.log = vi.fn()
console.error = vi.fn()