# API Reference - SMI Corporation CMS

Complete API documentation for the SMI Corporation Content Management System.

## Overview

The SMI Corporation CMS provides a comprehensive REST API for managing users, content, media, and system administration. The API follows RESTful conventions and uses JSON for data exchange.

**Base URL:** `/api`  
**Authentication:** JWT-based with httpOnly cookies  
**Content-Type:** `application/json` (except file uploads)  
**CSRF Protection:** Configurable token-based protection  

## Table of Contents

- [Authentication & Security](#authentication--security)
- [User Management](#user-management)  
- [Roles & Permissions](#roles--permissions)
- [Content Management](#content-management)
- [Media Management](#media-management)
- [System & Audit](#system--audit)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication & Security

### Login
**POST** `/api/auth/login`

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "redirect": "/admin" // optional, default: "/"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": {
      "id": 1,
      "name": "admin"
    }
  },
  "token": "jwt.token.here",
  "expiresIn": 3600,
  "redirect": "/admin"
}
```

**Security Features:**
- Rate limiting: 5 attempts per minute per IP
- Input validation and sanitization
- Audit logging
- Secure password verification

**Error Responses:**
- `400` - Validation errors
- `401` - Invalid credentials
- `429` - Rate limit exceeded

### Enhanced Login
**POST** `/api/auth/login-improved`

Enhanced login with AuthService integration and better tracking.

Same request/response format as standard login with additional security features:
- Enhanced client IP detection
- User agent tracking
- Improved audit logging

### Logout
**POST** `/api/auth/logout`

Terminate user session.

**Request:** No body required

**Response (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Actions Performed:**
- Deletes server session
- Removes authentication cookie
- Clears user context
- Logs logout event

### User Registration
**POST** `/api/auth/register`

Register new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "username": "newusername"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Utilisateur enregistré avec succès",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "username": "newusername"
  }
}
```

**Validation:**
- Email uniqueness check
- Required field validation
- Password strength (production TODO)

### Session Validation
**GET** `/api/_auth/session`

Validate current session and retrieve user information.

**Headers:** Requires authentication cookie

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": {
      "id": 1,
      "name": "admin",
      "permissions": ["manage_users", "manage_pages"]
    }
  }
}
```

**Response (401):**
```json
{
  "user": null
}
```

### CSRF Token
**GET** `/api/csrf-token`

Initialize CSRF protection token.

**Response (200):**
```json
{
  "success": true,
  "message": "CSRF token initialized",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## User Management

All user management endpoints require authentication and appropriate permissions.

### List Users
**GET** `/api/users`

Retrieve paginated list of users.

**Required Permission:** `manage_users`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `role_id` (number, optional) - Filter by role ID

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": {
        "id": 1,
        "name": "admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Create User
**POST** `/api/users`

Create new user account.

**Required Permission:** `manage_users`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "password": "securepassword",
  "role_id": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 3,
    "name": "Jane Smith",
    "username": "janesmith",
    "email": "jane@example.com",
    "role_id": 2
  }
}
```

**Validation:**
- Email uniqueness
- Role existence
- Required fields

### Get User
**GET** `/api/users/:id`

Retrieve specific user information.

**Access Control:** Own profile OR `manage_users` permission

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "role": {
    "id": 1,
    "name": "admin",
    "permissions": ["manage_users", "manage_pages"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Update User
**PUT** `/api/users/:id`

Update user information.

**Access Control:** Own profile OR `manage_users` permission

**Request Body:** (all fields optional)
```json
{
  "name": "John Updated",
  "username": "johnupdated",
  "email": "johnupdated@example.com",
  "password": "newpassword",
  "role_id": 2
}
```

**Special Rules:**
- Role changes require `manage_users` permission
- Email uniqueness validation
- Session invalidation on role change
- Complete audit trail

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur mis à jour avec succès",
  "user": {
    "id": 1,
    "name": "John Updated"
  }
}
```

### Delete User
**DELETE** `/api/users/:id`

Delete user account.

**Required Permission:** `manage_users`

**Restrictions:** Cannot delete own account

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

**Actions:**
- Cleans up user sessions
- Removes user from database
- Audit logging

### Bulk Delete User
**DELETE** `/api/users`

Delete user by query parameter.

**Required Permission:** `manage_users`

**Query Parameters:**
- `id` (number, required) - User ID to delete

**Same response and restrictions as individual delete**

---

## Roles & Permissions

Role-based access control system with granular permissions.

### List Roles
**GET** `/api/roles`

Retrieve all roles with their permissions.

**Required:** Authentication

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "admin",
    "permissions": [
      {
        "id": 1,
        "name": "manage_users"
      },
      {
        "id": 2,
        "name": "manage_pages"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Role
**POST** `/api/roles`

Create new role.

**Required Permission:** `manage_roles`

**Request Body:**
```json
{
  "name": "editor"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Rôle créé avec succès",
  "role": {
    "id": 3,
    "name": "editor"
  }
}
```

**Validation:** Name uniqueness

### Get Role
**GET** `/api/roles/:id`

Retrieve specific role with permissions.

**Required:** Authentication

**Response (200):**
```json
{
  "id": 1,
  "name": "admin",
  "permissions": [
    {
      "id": 1,
      "name": "manage_users"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Role
**PUT** `/api/roles/:id`

Update role name.

**Required Permission:** `manage_roles`

**Request Body:**
```json
{
  "name": "super_admin"
}
```

**Validation:** Name uniqueness

### Delete Role
**DELETE** `/api/roles/:id`

Delete role.

**Required Permission:** `manage_roles`

**Restrictions:** Cannot delete role assigned to users

**Response (200):**
```json
{
  "success": true,
  "message": "Rôle supprimé avec succès"
}
```

### Role Permissions
**GET** `/api/roles/:id/permissions`

Get all permissions for specific role.

**Required:** Authentication

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "manage_users",
    "description": "Gérer les utilisateurs"
  }
]
```

### Assign Permission to Role
**POST** `/api/roles/:id/permissions`

Assign permission to role.

**Required Permission:** `manage_permissions`

**Request Body:**
```json
{
  "permissionId": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permission assignée avec succès"
}
```

**Validation:**
- Role existence
- Permission existence
- Duplicate assignment check

### Remove Permission from Role
**DELETE** `/api/roles/:id/permissions`

Remove permission from role.

**Required Permission:** `manage_permissions`

**Query Parameters:**
- `permissionId` (number, required) - Permission ID to remove

**Response (200):**
```json
{
  "success": true,
  "message": "Permission retirée avec succès"
}
```

### List Permissions
**GET** `/api/permissions`

Retrieve all permissions.

**Required:** Authentication

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "manage_users",
    "description": "Gérer les utilisateurs",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Permission
**POST** `/api/permissions`

Create new permission.

**Required Permission:** `manage_permissions`

**Request Body:**
```json
{
  "name": "manage_content",
  "description": "Gérer le contenu"
}
```

**Validation:** Name uniqueness

### Update Permission
**PUT** `/api/permissions/:id`

Update permission.

**Required Permission:** `manage_permissions`

**Request Body:**
```json
{
  "name": "manage_content_advanced",
  "description": "Gérer le contenu avancé"
}
```

### Delete Permission
**DELETE** `/api/permissions/:id`

Delete permission.

**Required Permission:** `manage_permissions`

**Restrictions:** Cannot delete permission assigned to roles

---

## Content Management

Dynamic page management system with hierarchical structure.

### List Pages
**GET** `/api/pages`

Retrieve paginated list of pages.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `search` (string, optional) - Search in titles

**Response (200):**
```json
{
  "pages": [
    {
      "id": 1,
      "title": "Welcome Page",
      "slug": "welcome",
      "content": "<p>Welcome to our site</p>",
      "status": "published",
      "parentId": null,
      "order": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### List Published Pages
**GET** `/api/pages/published`

Retrieve only published pages.

**Same parameters and response format as List Pages**

**Filter:** `status: 'published'`

### Get Page Tree
**GET** `/api/pages/tree`

Retrieve hierarchical page structure.

**Response (200):**
```json
{
  "tree": [
    {
      "id": 1,
      "title": "Home",
      "slug": "home",
      "children": [
        {
          "id": 2,
          "title": "About",
          "slug": "about",
          "children": []
        }
      ]
    }
  ]
}
```

**Features:**
- Full hierarchy support
- Compatible with both mock and real database

### Get Page by Slug
**GET** `/api/pages/by-slug/:slug`

Retrieve page by slug identifier.

**Response (200):**
```json
{
  "id": 1,
  "title": "Welcome Page",
  "slug": "welcome",
  "content": "<p>Welcome content</p>",
  "status": "published",
  "parentId": null,
  "order": 1
}
```

**Response (404):**
```json
{
  "error": "Page not found"
}
```

### Get Page by ID
**GET** `/api/pages/:id`

Retrieve specific page by ID.

**Same response format as Get Page by Slug**

### Create Page
**POST** `/api/pages`

Create new page.

**Required:** Authentication

**Request Body:**
```json
{
  "title": "New Page",
  "content": "<p>Page content here</p>",
  "slug": "new-page", // optional, auto-generated if not provided
  "status": "draft", // optional, default: "draft"
  "parentId": 1 // optional, for hierarchy
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Page créée avec succès",
  "page": {
    "id": 3,
    "title": "New Page",
    "slug": "new-page",
    "content": "<p>Page content here</p>",
    "status": "draft",
    "parentId": 1,
    "order": 1
  }
}
```

**Features:**
- Auto-slug generation from title
- Content sanitization with DOMPurify
- Hierarchy validation (max 3 levels deep)
- Slug uniqueness validation

**Validation Errors:**
- Slug already exists
- Parent doesn't exist
- Maximum hierarchy depth exceeded

### Update Page
**PUT** `/api/pages/:id`

Update existing page.

**Required:** Authentication

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Page Title",
  "content": "<p>Updated content</p>",
  "slug": "updated-slug",
  "status": "published",
  "parentId": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Page mise à jour avec succès",
  "page": {
    "id": 3,
    "title": "Updated Page Title"
  }
}
```

**Special Validation:**
- Prevents circular parent relationships
- Hierarchy depth validation for parent changes
- Slug uniqueness (excluding current page)

### Update Page Status
**PATCH** `/api/pages/:id/status`

Update only the page status.

**Required:** Authentication

**Request Body:**
```json
{
  "status": "published" // or "draft"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Statut de la page mis à jour",
  "page": {
    "id": 3,
    "status": "published"
  }
}
```

### Reorder Pages
**PATCH** `/api/pages/:id/order`

Change page order within same parent.

**Required:** Authentication

**Request Body:**
```json
{
  "order": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ordre de la page mis à jour"
}
```

**Features:**
- Atomic reordering with database transactions
- Automatic adjustment of other page orders

### Delete Page
**DELETE** `/api/pages/:id`

Delete page.

**Required:** Authentication

**Restrictions:** Cannot delete pages with children

**Response (200):**
```json
{
  "success": true,
  "message": "Page supprimée avec succès"
}
```

**Actions:**
- Reorders remaining sibling pages
- Validates no child pages exist

---

## Media Management

Comprehensive image upload, processing, and management system.

### Upload Image
**POST** `/api/images`

Upload and process new image.

**Required:** Authentication

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `image` (file, required) - Image file to upload
- `title` (string, optional) - Image title
- `description` (string, optional) - Image description
- `altText` (string, optional) - Alt text for accessibility

**File Validation:**
- **Max Size:** 10MB
- **Allowed Types:** JPEG, PNG, GIF, WebP, SVG
- **Magic Number Validation:** File type verification beyond extension

**Response (201):**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "image": {
    "id": 15,
    "filename": "vacation-photo.jpg",
    "originalName": "IMG_2024.jpg",
    "url": "/images/2024-01/vacation-photo.jpg",
    "width": 1920,
    "height": 1080,
    "size": 245760,
    "format": "jpeg",
    "title": "Vacation Photo",
    "description": "Summer vacation 2024",
    "altText": "Beach sunset view",
    "md5Hash": "d41d8cd98f00b204e9800998ecf8427e",
    "variants": [
      {
        "type": "thumbnail",
        "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
        "width": 150,
        "height": 84
      },
      {
        "type": "small",
        "url": "/images/2024-01/vacation-photo-small.jpg",
        "width": 400,
        "height": 225
      },
      {
        "type": "medium",
        "url": "/images/2024-01/vacation-photo-medium.jpg",
        "width": 800,
        "height": 450
      },
      {
        "type": "large",
        "url": "/images/2024-01/vacation-photo-large.jpg",
        "width": 1200,
        "height": 675
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Processing Features:**
- **Duplicate Detection:** MD5 hash comparison prevents duplicate uploads
- **Automatic Variants:** Generates thumbnail, small, medium, large sizes
- **Sharp Processing:** High-quality image resizing and optimization
- **Organized Storage:** Files organized by date (YYYY-MM format)
- **Metadata Extraction:** Width, height, format detection

**Error Examples:**
```json
// File too large
{
  "error": "File too large. Maximum size is 10MB",
  "code": "FILE_TOO_LARGE"
}

// Invalid file type
{
  "error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG",
  "code": "INVALID_FILE_TYPE"
}

// Duplicate file
{
  "error": "Cette image existe déjà",
  "code": "DUPLICATE_FILE",
  "existingImage": {
    "id": 12,
    "url": "/images/2024-01/existing-photo.jpg"
  }
}
```

### List Images
**GET** `/api/images`

Retrieve images with filtering and pagination.

**Query Parameters:**
- `limit` (number, default: 24) - Images per page
- `offset` (number, default: 0) - Skip images
- `search` (string, optional) - Search in title, filename, description
- `format` (string, optional) - Filter by format (jpeg, png, gif, webp, svg)
- `date` (string, optional) - Date filter: 'today', 'week', 'month', 'year'

**Response (200):**
```json
{
  "images": [
    {
      "id": 15,
      "filename": "vacation-photo.jpg",
      "originalName": "IMG_2024.jpg",
      "url": "/images/2024-01/vacation-photo.jpg",
      "width": 1920,
      "height": 1080,
      "size": 245760,
      "format": "jpeg",
      "title": "Vacation Photo",
      "description": "Summer vacation 2024",
      "altText": "Beach sunset view",
      "variants": [
        {
          "type": "thumbnail",
          "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
          "width": 150,
          "height": 84
        }
      ],
      "user": {
        "id": 1,
        "name": "John Doe"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 156,
  "totalSize": 52428800,
  "offset": 0,
  "limit": 24
}
```

**Search Features:**
- Full-text search across title, filename, description
- Format filtering
- Date-based filtering
- Pagination support

### Get Image
**GET** `/api/images/:id`

Retrieve specific image with all variants.

**Response (200):**
```json
{
  "id": 15,
  "filename": "vacation-photo.jpg",
  "originalName": "IMG_2024.jpg",
  "url": "/images/2024-01/vacation-photo.jpg",
  "width": 1920,
  "height": 1080,
  "size": 245760,
  "format": "jpeg",
  "title": "Vacation Photo",
  "description": "Summer vacation 2024",
  "altText": "Beach sunset view",
  "md5Hash": "d41d8cd98f00b204e9800998ecf8427e",
  "variants": [
    {
      "type": "thumbnail",
      "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
      "width": 150,
      "height": 84
    },
    {
      "type": "small",
      "url": "/images/2024-01/vacation-photo-small.jpg",
      "width": 400,
      "height": 225
    },
    {
      "type": "medium",
      "url": "/images/2024-01/vacation-photo-medium.jpg",
      "width": 800,
      "height": 450
    },
    {
      "type": "large",
      "url": "/images/2024-01/vacation-photo-large.jpg",
      "width": 1200,
      "height": 675
    }
  ],
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Update Image Metadata
**PATCH** `/api/images/:id`

Update image title, description, and alt text.

**Request Body:**
```json
{
  "title": "Updated Image Title",
  "description": "Updated description",
  "altText": "Updated alt text"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image mise à jour avec succès",
  "image": {
    "id": 15,
    "title": "Updated Image Title",
    "description": "Updated description",
    "altText": "Updated alt text"
  }
}
```

### Crop Image
**POST** `/api/images/:id/crop`

Crop image and regenerate all variants.

**Request Body:**
```json
{
  "coordinates": {
    "left": 100,
    "top": 50,
    "width": 800,
    "height": 600
  },
  "aspectRatio": 1.33 // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image recadrée avec succès",
  "image": {
    "id": 15,
    "url": "/images/2024-01/vacation-photo.jpg",
    "width": 800,
    "height": 600,
    "variants": [
      {
        "type": "thumbnail",
        "url": "/images/2024-01/vacation-photo-thumbnail.jpg",
        "width": 150,
        "height": 113
      }
    ]
  }
}
```

**Processing:**
- Crops original image using Sharp
- Regenerates all variant sizes
- Updates database with new dimensions
- Cleans up old variant files
- Maintains aspect ratio if specified

### Get Image Statistics
**GET** `/api/images/stats`

Retrieve image statistics and storage information.

**Response (200):**
```json
{
  "totalImages": 156,
  "totalSize": 52428800, // bytes
  "formats": [
    {
      "format": "jpeg",
      "count": 89,
      "size": 35651200
    },
    {
      "format": "png",
      "count": 45,
      "size": 12582400
    },
    {
      "format": "gif",
      "count": 15,
      "size": 3145728
    },
    {
      "format": "webp",
      "count": 7,
      "size": 1049600
    }
  ]
}
```

### Delete Image
**DELETE** `/api/images`

Delete image and all its variants.

**Request Body:**
```json
{
  "id": 15
}
```

**Alternative Request Body:**
```json
{
  "url": "/images/2024-01/vacation-photo.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "id": 15,
  "message": "Image supprimée avec succès",
  "errors": null // or array of file deletion errors
}
```

**Actions:**
- Deletes original image file
- Deletes all variant files
- Removes database entries
- Returns any file system errors

**Error Response with Partial Failure:**
```json
{
  "success": true,
  "id": 15,
  "message": "Image supprimée avec succès",
  "errors": [
    "Failed to delete /images/2024-01/vacation-photo-medium.jpg: File not found"
  ]
}
```

---

## System & Audit

System administration and audit logging capabilities.

### Get Audit Logs
**GET** `/api/audit/logs`

Retrieve system audit logs with filtering.

**Required Permission:** `admin` role OR `manage_audit` permission

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Logs per page
- `entity_type` (string, optional) - Filter by entity type (User, Page, Role, etc.)
- `action` (string, optional) - Filter by action (CREATE, UPDATE, DELETE)
- `entity_id` (number, optional) - Filter by specific entity ID
- `user_id` (number, optional) - Filter by user who performed action

**Response (200):**
```json
{
  "logs": [
    {
      "id": 123,
      "entity_type": "User",
      "entity_id": 5,
      "action": "UPDATE",
      "changes": {
        "before": {
          "name": "Old Name",
          "email": "old@example.com"
        },
        "after": {
          "name": "New Name",
          "email": "new@example.com"
        }
      },
      "user": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1543,
  "page": 1,
  "limit": 20,
  "totalPages": 78
}
```

**Log Types:**
- User management (CREATE, UPDATE, DELETE)
- Role and permission changes
- Page content modifications
- Login/logout events
- System configuration changes

### CSRF Test Endpoint
**POST** `/api/test/csrf`

Test CSRF protection functionality (development only).

**Response (200):**
```json
{
  "success": true,
  "message": "CSRF test endpoint",
  "csrf": {
    "token": "csrf-token-value",
    "valid": true
  },
  "request": {
    "method": "POST",
    "headers": {},
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Error Handling

The API uses consistent error response formats across all endpoints.

### Standard Error Response

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE", // optional
  "details": {}, // optional additional context
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, constraint violations |
| 422 | Unprocessable Entity | Validation errors with details |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Server-side errors |

### Common Error Examples

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

**Authentication Required (401):**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Permission Denied (403):**
```json
{
  "error": "Permission denied",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": "manage_users"
}
```

**Resource Not Found (404):**
```json
{
  "error": "User not found",
  "code": "RESOURCE_NOT_FOUND",
  "resource": "User",
  "id": 999
}
```

**Duplicate Resource (409):**
```json
{
  "error": "Email already exists",
  "code": "DUPLICATE_RESOURCE",
  "field": "email",
  "value": "existing@example.com"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 5,
  "window": "1 minute"
}
```

---

## Rate Limiting

Rate limiting is implemented on authentication endpoints to prevent abuse.

### Login Rate Limiting

**Endpoint:** `/api/auth/login`, `/api/auth/login-improved`

**Limits:**
- 5 attempts per minute per IP address
- Counter resets after successful authentication
- Applies to all login attempts regardless of success/failure

**Headers in Response:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1705317000
```

**Rate Limit Exceeded Response (429):**
```json
{
  "error": "Too many login attempts",
  "code": "RATE_LIMIT_EXCEEDED", 
  "retryAfter": 45,
  "message": "Please try again in 45 seconds"
}
```

### Future Rate Limiting

Plans for additional rate limiting include:
- API endpoints: 100 requests per minute per user
- File uploads: 10 uploads per minute per user
- User registration: 3 registrations per hour per IP

---

## Authentication Headers

### Required Headers

**For authenticated requests:**
```
Cookie: auth_token=jwt.token.here
```

**For CSRF-protected requests:**
```
X-XSRF-TOKEN: csrf-token-value
Cookie: XSRF-TOKEN=csrf-token-value
```

**For file uploads:**
```
Content-Type: multipart/form-data
Cookie: auth_token=jwt.token.here
```

### Optional Headers

**API versioning (future):**
```
Accept: application/json; version=1
```

**Request tracking:**
```
X-Request-ID: unique-request-identifier
```

---

## Database Modes

The API supports dual database modes for development and production.

### Mock Database Mode

**Environment:** `USE_MOCK_DB=true`

**Features:**
- In-memory data storage
- Predefined sample data
- Fast development setup
- Page management with full functionality
- Limited user/role functionality

**Limitations:**
- Data resets on server restart
- No persistence across sessions
- Simplified relationship handling

### Production Database Mode

**Environment:** `USE_MOCK_DB=false` or unset

**Features:**
- Full MySQL/SQLite database
- Complete relationship integrity
- Transaction support
- Full audit logging
- Production-ready performance

**Setup:** Requires database configuration in environment variables

---

This API reference provides complete documentation for integrating with the SMI Corporation CMS. For implementation examples and advanced usage patterns, refer to the [Developer Guide](DEVELOPER_GUIDE.md).