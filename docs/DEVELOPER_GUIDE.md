# Developer Guide - SMI Corporation CMS

Complete development guide for contributing to and extending the SMI Corporation Content Management System.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Frontend Development](#frontend-development)
- [Backend Development](#backend-development)
- [Database Management](#database-management)
- [Testing](#testing)
- [Styling Guidelines](#styling-guidelines)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

```bash
# Required software
Node.js >= 18.0.0
npm >= 8.0.0
Git >= 2.25.0

# Recommended tools
VS Code with Vue/Nuxt extensions
Vue DevTools browser extension
Postman or similar API testing tool
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/smi-corporation.git
cd smi-corporation

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file with the following variables:

```bash
# Database Configuration
USE_MOCK_DB=true                    # Use mock database for development
DATABASE_URL=sqlite://./dev.db      # Real database URL (when USE_MOCK_DB=false)

# Authentication
JWT_SECRET=your-super-secret-key-here
CSRF_SECRET=your-csrf-secret-here

# File Upload
MAX_FILE_SIZE=10485760              # 10MB in bytes
UPLOAD_DIR=public/images

# Development
NODE_ENV=development
NUXT_DEV_TOOLS=true
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:watch                  # Watch mode
npm run test:ui                     # Visual test interface

# Code quality
npm run lint                        # Check for linting errors
npm run lint:fix                    # Auto-fix linting errors

# Database operations
npm run migrate                     # Run database migrations
npm run migrate:analyze             # Analyze database performance

# Development utilities
npm run docs                        # View documentation
```

## Project Structure

```
smi-corporation/
├── app/                           # Nuxt application code
│   ├── assets/                    # CSS, images, fonts
│   │   ├── css/main.css          # Global styles
│   │   ├── images/               # Static images
│   │   └── logos/                # Logo assets
│   ├── components/               # Vue components
│   │   ├── BBCodeEditor.vue      # Rich text editor
│   │   ├── BBCodeRenderer.vue    # BBCode renderer
│   │   ├── images/               # Image management components
│   │   ├── pages/                # Page-specific components
│   │   └── ui/                   # UI components
│   ├── composables/              # Vue composables
│   │   ├── useApi.js             # API utilities
│   │   ├── useBBCode.js          # BBCode functionality
│   │   └── useToast.js           # Toast notifications
│   ├── layouts/                  # Application layouts
│   │   ├── default.vue           # Default layout
│   │   └── admin.vue             # Admin layout
│   ├── middleware/               # Route middleware
│   │   ├── auth.js               # Authentication guard
│   │   └── pages.global.js       # Global middleware
│   ├── pages/                    # File-based routing
│   │   ├── admin/                # Admin interface
│   │   ├── auth/                 # Authentication pages
│   │   └── index.vue             # Homepage
│   ├── plugins/                  # Nuxt plugins
│   │   ├── auth.js               # Auth plugin
│   │   └── csrf.client.js        # CSRF protection
│   ├── stores/                   # Pinia stores
│   │   └── auth.js               # Authentication store
│   └── utils/                    # Utility functions
│       └── api.js                # API helpers
├── server/                       # Server-side code
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication APIs
│   │   ├── users/                # User management
│   │   ├── pages/                # Page management
│   │   └── images/               # Image management
│   ├── middleware/               # Server middleware
│   │   ├── auth.js               # Auth middleware
│   │   └── check-permission.js   # Permission checks
│   ├── models.js                 # Database models
│   ├── database.js               # Database configuration
│   ├── services/                 # Business logic
│   ├── utils/                    # Server utilities
│   └── repositories/             # Data access layer
├── public/                       # Static files
│   ├── images/                   # Uploaded images
│   └── favicon/                  # Favicon files
├── tests/                        # Test files
│   ├── api/                      # API tests
│   ├── components/               # Component tests
│   └── utils/                    # Utility tests
├── docs/                         # Documentation
├── nuxt.config.ts                # Nuxt configuration
├── package.json                  # Dependencies
└── README.md                     # Project overview
```

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature description"

# Push and create pull request
git push origin feature/your-feature-name
```

### Commit Message Convention

Follow conventional commit format:

```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Code Review Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run lint` and `npm run test`
4. Create pull request with description
5. Address review feedback
6. Merge after approval

## Frontend Development

### Vue.js Best Practices

```vue
<script setup>
// Use Composition API with <script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

// Define props with TypeScript
interface Props {
  title: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Define emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  update: [value: string]
}>()

// Reactive state
const isLoading = ref(false)
const authStore = useAuthStore()

// Computed properties
const buttonClass = computed(() => ({
  'opacity-50': props.disabled,
  'cursor-not-allowed': props.disabled
}))

// Lifecycle hooks
onMounted(() => {
  // Component initialization
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled"
    @click="handleClick"
  >
    {{ title }}
  </button>
</template>
```

### Component Development Guidelines

```vue
<!-- Use semantic HTML -->
<template>
  <article class="page-content">
    <header>
      <h1>{{ page.title }}</h1>
    </header>
    <main>
      <BBCodeRenderer :content="page.content" />
    </main>
  </article>
</template>

<script setup>
// Import types
import type { Page } from '~/types'

// Props with validation
interface Props {
  page: Page
}

defineProps<Props>()

// Use composables for reusable logic
const { formatDate } = useDateUtils()
const { user } = useAuthStore()
</script>

<style scoped>
/* Use Tailwind CSS classes primarily */
.page-content {
  @apply max-w-4xl mx-auto px-4 py-8;
}

/* Custom CSS only when needed */
.custom-styling {
  /* Specific styles that Tailwind can't handle */
}
</style>
```

### Composables Pattern

```javascript
// composables/useApi.js
export const useApi = () => {
  const { $fetch } = useNuxtApp()

  const fetchWithAuth = async (url, options = {}) => {
    try {
      return await $fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      })
    } catch (error) {
      // Handle errors consistently
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.message || 'API Error'
      })
    }
  }

  const get = (url, options = {}) => 
    fetchWithAuth(url, { method: 'GET', ...options })

  const post = (url, body, options = {}) =>
    fetchWithAuth(url, { method: 'POST', body, ...options })

  const put = (url, body, options = {}) =>
    fetchWithAuth(url, { method: 'PUT', body, ...options })

  const del = (url, options = {}) =>
    fetchWithAuth(url, { method: 'DELETE', ...options })

  return {
    get,
    post,
    put,
    delete: del
  }
}
```

## Backend Development

### API Endpoint Structure

```javascript
// server/api/users/[id].get.js
import { requireAuth, checkPermission } from '~/server/middleware/auth'
import { validateId } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  try {
    // Authentication check
    const user = await requireAuth(event)
    
    // Parameter validation
    const userId = validateId(getRouterParam(event, 'id'))
    
    // Permission check
    if (user.id !== userId) {
      await checkPermission(event, 'manage_users')
    }

    // Business logic
    const targetUser = await User.findByPk(userId, {
      include: [{ model: Role, include: [Permission] }],
      attributes: { exclude: ['password'] }
    })

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Return response
    return {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.Role
    }

  } catch (error) {
    // Error handling
    console.error('Get user error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})
```

### Database Model Patterns

```javascript
// server/models.js - Example model definition
const UserModel = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      // Hash password before saving
      this.setDataValue('password', bcrypt.hashSync(value, 10))
    }
  }
}, {
  // Model options
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Soft delete support
  
  // Instance methods
  instanceMethods: {
    checkPassword(password) {
      return bcrypt.compareSync(password, this.password)
    }
  },
  
  // Class methods
  classMethods: {
    async findByEmail(email) {
      return this.findOne({ where: { email } })
    }
  }
})
```

### Middleware Development

```javascript
// server/middleware/auth.js
export const requireAuth = async (event) => {
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  try {
    const payload = jwt.verify(token, useRuntimeConfig().jwtSecret)
    const user = await User.findByPk(payload.userId, {
      include: [{ model: Role, include: [Permission] }]
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }

    // Add user to event context
    event.context.user = user
    return user

  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token'
    })
  }
}

export const checkPermission = async (event, requiredPermission) => {
  const user = event.context.user || await requireAuth(event)
  
  const hasPermission = user.Role?.Permissions?.some(
    permission => permission.name === requiredPermission
  )

  if (!hasPermission) {
    throw createError({
      statusCode: 403,
      statusMessage: `Permission '${requiredPermission}' required`
    })
  }

  return true
}
```

## Database Management

### Mock Database Development

```javascript
// server/utils/mock-db.js - Development database
export const pageDb = {
  data: [
    {
      id: 1,
      title: 'Welcome',
      slug: 'welcome',
      content: 'Welcome to SMI Corporation',
      status: 'published',
      parentId: null,
      order: 1
    }
  ],

  findAll: async (options = {}) => {
    let result = [...pageDb.data]
    
    // Apply filters
    if (options.where) {
      result = result.filter(item => {
        return Object.entries(options.where).every(([key, value]) => {
          return item[key] === value
        })
      })
    }

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0
      const limit = options.limit || result.length
      result = result.slice(offset, offset + limit)
    }

    return result
  },

  create: async (data) => {
    const newItem = {
      id: Math.max(...pageDb.data.map(p => p.id)) + 1,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    pageDb.data.push(newItem)
    return newItem
  }
}
```

### Production Database Setup

```javascript
// server/database.js
import { Sequelize } from 'sequelize'

const config = useRuntimeConfig()

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'mysql', // or 'sqlite'
  logging: config.public.nodeEnv === 'development' ? console.log : false,
  
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
})

// Test connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
}
```

### Migration Scripts

```javascript
// server/migrations/001-add-database-indexes.js
export const up = async (sequelize) => {
  const queryInterface = sequelize.getQueryInterface()
  
  // Add indexes for performance
  await queryInterface.addIndex('users', ['email'], {
    unique: true,
    name: 'users_email_unique'
  })

  await queryInterface.addIndex('pages', ['slug'], {
    unique: true,
    name: 'pages_slug_unique'
  })

  await queryInterface.addIndex('pages', ['parent_id'], {
    name: 'pages_parent_id_index'
  })

  await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], {
    name: 'audit_logs_entity_index'
  })
}

export const down = async (sequelize) => {
  const queryInterface = sequelize.getQueryInterface()
  
  await queryInterface.removeIndex('users', 'users_email_unique')
  await queryInterface.removeIndex('pages', 'pages_slug_unique')
  await queryInterface.removeIndex('pages', 'pages_parent_id_index')
  await queryInterface.removeIndex('audit_logs', 'audit_logs_entity_index')
}
```

## Testing

### Component Testing

```javascript
// tests/components/BBCodeEditor.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BBCodeEditor from '~/components/BBCodeEditor.vue'

describe('BBCodeEditor', () => {
  it('renders with initial content', () => {
    const wrapper = mount(BBCodeEditor, {
      props: {
        modelValue: '[b]Bold text[/b]'
      }
    })

    expect(wrapper.find('.editor').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bold text')
  })

  it('emits update on content change', async () => {
    const wrapper = mount(BBCodeEditor, {
      props: {
        modelValue: ''
      }
    })

    // Simulate content change
    await wrapper.find('.editor').setValue('[i]Italic text[/i]')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['[i]Italic text[/i]'])
  })
})
```

### API Testing

```javascript
// tests/api/auth.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../setup'

describe('/api/auth', () => {
  let app

  beforeEach(async () => {
    app = await createApp()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
      expect(response.body.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBeDefined()
    })
  })
})
```

### Test Setup

```javascript
// tests/setup.js
import { createNuxtApp } from 'nuxt'
import { vi } from 'vitest'

// Mock dependencies
vi.mock('~/server/database', () => ({
  sequelize: {
    authenticate: vi.fn(),
    sync: vi.fn()
  }
}))

export const createApp = async () => {
  // Setup test environment
  process.env.USE_MOCK_DB = 'true'
  process.env.NODE_ENV = 'test'
  
  const app = await createNuxtApp()
  return app
}
```

## Styling Guidelines

### Tailwind CSS Usage

```vue
<template>
  <!-- Use Tailwind utility classes -->
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Responsive design -->
    <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
      {{ title }}
    </h1>
    
    <!-- Interactive states -->
    <button 
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 
             focus:ring-2 focus:ring-blue-500 focus:outline-none
             text-white rounded-md transition-colors duration-200
             disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="isLoading"
    >
      Submit
    </button>
  </div>
</template>
```

### Component-Specific Styles

```vue
<style scoped>
/* Use scoped styles for component-specific styling */
.custom-editor {
  /* Styles that can't be achieved with Tailwind */
  .ProseMirror {
    outline: none;
    min-height: 200px;
  }
  
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .custom-editor {
    background-color: #1f2937;
    color: #f9fafb;
  }
}
</style>
```

## Security Considerations

### Input Validation

```javascript
// server/utils/validators.js
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and numbers'
  )
})

export const validateUser = (data) => {
  try {
    return userSchema.parse(data)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: error.errors
    })
  }
}
```

### Content Sanitization

```javascript
// server/utils/security.js
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('').window
const purify = DOMPurify(window)

export const sanitizeHTML = (html) => {
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class']
  })
}

export const sanitizeBBCode = (bbcode) => {
  // Remove potentially dangerous BBCode tags
  return bbcode.replace(/\[script\].*?\[\/script\]/gi, '')
                .replace(/\[iframe\].*?\[\/iframe\]/gi, '')
}
```

### Rate Limiting

```javascript
// server/utils/rate-limit.js
const rateLimitStore = new Map()

export const rateLimit = (key, limit = 5, windowMs = 60000) => {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean old entries
  const requests = rateLimitStore.get(key) || []
  const validRequests = requests.filter(time => time > windowStart)
  
  if (validRequests.length >= limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests'
    })
  }
  
  validRequests.push(now)
  rateLimitStore.set(key, validRequests)
  
  return true
}
```

## Performance Optimization

### Image Optimization

```javascript
// server/utils/image-processing.js
import sharp from 'sharp'

export const generateImageVariants = async (inputPath, outputDir) => {
  const variants = [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 400, height: 300 },
    { name: 'medium', width: 800, height: 600 },
    { name: 'large', width: 1200, height: 900 }
  ]

  const results = []

  for (const variant of variants) {
    const outputPath = `${outputDir}/${variant.name}.webp`
    
    await sharp(inputPath)
      .resize(variant.width, variant.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(outputPath)
    
    results.push({
      type: variant.name,
      path: outputPath,
      width: variant.width,
      height: variant.height
    })
  }

  return results
}
```

### Database Optimization

```javascript
// server/utils/query-optimizer.js
export const optimizePageQuery = (options = {}) => {
  const baseQuery = {
    attributes: {
      exclude: ['content'] // Exclude heavy fields unless needed
    },
    include: [
      {
        model: User,
        attributes: ['id', 'name'] // Only include necessary fields
      }
    ]
  }

  // Add pagination
  if (options.page && options.limit) {
    baseQuery.offset = (options.page - 1) * options.limit
    baseQuery.limit = parseInt(options.limit)
  }

  // Add search
  if (options.search) {
    baseQuery.where = {
      title: {
        [Op.iLike]: `%${options.search}%`
      }
    }
  }

  return baseQuery
}
```

## Deployment

### Development Deployment

```bash
# Start development server
npm run dev

# Enable debug mode
DEBUG=nuxt:* npm run dev

# Use specific port
PORT=4000 npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm run preview

# With PM2 process manager
pm2 start ecosystem.config.js
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "preview"]
```

### Environment Variables

```bash
# Production environment variables
NODE_ENV=production
USE_MOCK_DB=false
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-production-jwt-secret
CSRF_SECRET=your-production-csrf-secret
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```javascript
// Check database connection
import { testConnection } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    await testConnection()
    return { status: 'Database connected' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { status: 'Database connection failed', error: error.message }
  }
})
```

#### Authentication Problems

```javascript
// Debug authentication
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  console.log('Auth token:', token ? 'Present' : 'Missing')
  
  if (token) {
    try {
      const payload = jwt.verify(token, useRuntimeConfig().jwtSecret)
      console.log('Token payload:', payload)
    } catch (error) {
      console.log('Token verification failed:', error.message)
    }
  }
})
```

#### File Upload Issues

```javascript
// Debug file uploads
export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    console.log('Form data fields:', formData?.map(field => ({
      name: field.name,
      type: field.type,
      size: field.data?.length
    })))
  } catch (error) {
    console.error('Form data parsing failed:', error)
  }
})
```

### Performance Issues

```javascript
// Monitor API performance
export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  try {
    // Your API logic here
    const result = await someExpensiveOperation()
    
    const duration = Date.now() - startTime
    console.log(`API call took ${duration}ms`)
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(`Failed API call took ${duration}ms:`, error.message)
    throw error
  }
})
```

### Debugging Tools

```javascript
// Enable detailed logging
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Request URL:', getRequestURL(event))
    console.log('Request method:', getMethod(event))
    console.log('Request headers:', getHeaders(event))
    console.log('Query parameters:', getQuery(event))
  }
})
```

This developer guide provides comprehensive information for working with the SMI Corporation CMS. For specific API details, refer to the [API Reference](API_REFERENCE.md), and for system architecture, see [Architecture Documentation](ARCHITECTURE.md).