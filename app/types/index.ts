// Types pour l'application SMI Corporation

export interface User {
  id: number
  name: string
  email: string
  username: string
  role: string
  role_id?: number  // Pour les formulaires
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  disabled?: boolean  // Pour les options de formulaire
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: number
  title: string
  slug: string
  content: string
  status: 'draft' | 'published'
  parentId?: number
  authorId: number
  createdAt: string
  updatedAt: string
}

export interface Image {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt?: string
  caption?: string
  createdAt: string
  updatedAt: string
}

export interface Organigramme {
  id: number
  title: string
  slug: string
  description?: string
  structure: OrganigrammeEmployee[]
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface OrganigrammeEmployee {
  id: number
  name: string
  position: string
  email?: string
  phone?: string
  parentId?: number
  children?: OrganigrammeEmployee[]
  level: number
  order: number
}

export interface ValidationErrors {
  [key: string]: string | string[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: ValidationErrors
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}