import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Environment
    environment: 'node',
    
    // Global setup
    globalSetup: './tests/setup/global-setup.ts',
    setupFiles: ['./tests/setup/test-setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      all: true,
      include: [
        'server/**/*.{js,ts}',
        'app/**/*.{js,ts,vue}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**'
      ],
      exclude: [
        'tests/**',
        'scripts/**',
        'docs/**',
        '**/*.config.{js,ts}',
        '**/migrations/**',
        '**/mock-db.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific thresholds for critical modules
        'server/services/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'server/api/auth/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Test files patterns
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts}',
      'tests/integration/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**'
    ],
    
    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: [
      'verbose',
      'json',
      'html'
    ],
    outputFile: {
      json: './tests/reports/test-results.json',
      html: './tests/reports/test-results.html'
    },
    
    // Watch mode
    watch: false,
    
    // Mocking
    clearMocks: true,
    restoreMocks: true,
    
    // Retry failed tests
    retry: process.env.CI ? 2 : 0
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '~': resolve(__dirname, './'),
      'tests': resolve(__dirname, './tests')
    }
  },
  
  define: {
    // Test environment variables
    'process.env.NODE_ENV': '"test"',
    'process.env.USE_MOCK_DB': '"true"',
    'process.env.LOG_LEVEL': '"error"'
  }
})