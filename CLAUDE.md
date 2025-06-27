# CLAUDE.md - SMI Corporation Project

## Project Overview

SMI Corporation is a comprehensive Content Management System (CMS) built with Nuxt.js, featuring user authentication, role-based access control, dynamic page management, and media handling. The application is designed with a mock database system for development and can be migrated to a real database for production.

## Technology Stack

### Frontend
- **Framework**: Nuxt.js 3.17.4 (Vue.js 3.5.16)
- **CSS**: Tailwind CSS via @nuxt/ui 3.1.3
- **State Management**: Pinia 3.0.2
- **Router**: Vue Router 4.5.1
- **Rich Text Editor**: TipTap 2.14.0
- **File Upload**: FilePond 4.32.8 with Vue integration
- **Image Processing**: Vue Advanced Cropper 2.8.9
- **Icons**: @nuxt/icon 1.13.0 + FontAwesome 6.7.2
- **Validation**: Vee-Validate 4.15.1 + Yup 1.6.1 + Zod 3.25.67

### Backend
- **Runtime**: Nuxt.js Server API (Nitro)
- **Database ORM**: Sequelize 6.37.7
- **Database**: MySQL2 3.14.1 (with SQLite3 5.1.7 for development)
- **Authentication**: Custom JWT-based system with nuxt-auth-utils 0.5.20
- **Security**: bcryptjs 3.0.2, CSRF protection (nuxt-csurf), DOMPurify 3.2.6
- **Image Processing**: Sharp 0.34.2

### Development Tools
- **TypeScript**: 5.8.3
- **ESLint**: 9.29.0 with @nuxt/eslint 1.4.1
- **Commitizen**: cz-customizable 7.4.0
- **Commitlint**: @commitlint/config-conventional
- **Husky**: 9.1.7 (pre-commit hooks)

## Project Structure

```
/mnt/Seagate2T/Projets Web/Code/smi-corporation/
├── app/                          # Nuxt application code
│   ├── assets/                   # Static assets (CSS, images, logos)
│   ├── components/               # Vue components
│   │   ├── images/               # Image management components
│   │   └── pages/                # Page rendering components
│   ├── composables/              # Vue composables
│   ├── layouts/                  # Application layouts (default, admin)
│   ├── middleware/               # Route middleware (auth, pages routing)
│   ├── pages/                    # Application pages
│   │   ├── admin/                # Admin interface pages
│   │   └── auth/                 # Authentication pages
│   ├── plugins/                  # Nuxt plugins
│   └── stores/                   # Pinia stores
├── server/                       # Server-side code
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── images/               # Image management API
│   │   ├── permissions/          # Permission management API
│   │   ├── roles/                # Role management API
│   │   └── users/                # User management API
│   ├── middleware/               # Server middleware
│   ├── models.js                 # Database models (Sequelize)
│   ├── database.js               # Database configuration
│   ├── services/                 # Business logic services
│   └── utils/                    # Server utilities
├── public/                       # Public static files
├── content.config.ts             # Nuxt Content configuration
├── nuxt.config.ts                # Nuxt configuration
└── package.json                  # Dependencies and scripts
```

## Key Features

### Authentication & Authorization
- User registration and login system
- JWT-based session management
- Role-based access control (RBAC)
- Permission system with granular control
- Protected routes and API endpoints

### Content Management
- Dynamic page creation and management
- Hierarchical page structure (parent/child relationships)
- Rich text editor with BBCode support
- Draft/Published status system
- SEO-friendly slug generation

### Media Management
- Image upload and storage
- Image cropping and editing capabilities
- File validation and processing
- Gallery management interface

### Administration
- Complete admin interface at `/admin`
- User management (CRUD operations)
- Role and permission management
- Page content management
- Image gallery management
- Audit logging system

## Development Configuration

### Environment Setup
The project uses a mock database system for development:
- Set `USE_MOCK_DB=true` in environment variables
- Mock data is defined in `/server/utils/mock-db.js`
- Real database configuration in `/server/database.js`

### Scripts
```json
{
  "dev": "nuxt dev",           # Development server
  "build": "nuxt build",       # Production build
  "preview": "nuxt preview",   # Preview production build
  "lint": "eslint .",          # Code linting
  "lint:fix": "eslint . --fix", # Auto-fix linting issues
  "commit": "cz"               # Commitizen commit helper
}
```

### Code Quality
- ESLint configuration with Nuxt standards
- Commitlint for conventional commit messages
- Husky pre-commit hooks (currently in bak.husky/)
- TypeScript support throughout the project

## Database Schema

### Core Models
- **User**: Authentication and user data
- **Role**: Role definitions
- **Permission**: Permission definitions
- **RolePermission**: Many-to-many relationship
- **Page**: Dynamic page content
- **Image**: Media file management
- **AuditLog**: System activity tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/_auth/session` - Session validation

### Pages
- `GET /api/pages` - List all pages
- `POST /api/pages` - Create new page
- `GET /api/pages/:id` - Get specific page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page

### Users & Roles
- `GET /api/users` - List users
- `GET /api/roles` - List roles
- `GET /api/permissions` - List permissions

### Images
- `POST /api/images` - Upload image
- `GET /api/images` - List images
- `PATCH /api/images/:id` - Update image
- `DELETE /api/images` - Delete image

## Security Features
- CSRF protection (configurable)
- Input validation and sanitization
- Password hashing with bcrypt
- JWT token management
- XSS protection with DOMPurify
- File upload validation

## Deployment Notes
- Nuxt.js static generation support
- Environment-based configuration
- Database migration utilities available
- Production-ready build system

## Development Workflow
1. Use mock database for development (`USE_MOCK_DB=true`)
2. Follow conventional commit standards
3. Run linting before commits
4. Test in both mock and real database modes
5. Use the admin interface for content management

## Important Files to Understand
- `/nuxt.config.ts` - Main Nuxt configuration
- `/server/models.js` - Database models and mock system
- `/server/database.js` - Database connection setup
- `/app/stores/auth.js` - Authentication state management
- `/server/api/` - All API endpoints
- `/app/middleware/auth.js` - Route protection
- `/app/middleware/pages.global.js` - Dynamic routing

## Migration Path
The project includes utilities for migrating from mock database to real MySQL/SQLite database. See `/server/utils/db-setup.js` and related documentation files for migration procedures.