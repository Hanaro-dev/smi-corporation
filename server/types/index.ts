/**
 * Types centralisés pour le serveur SMI Corporation
 * Définitions de base pour l'API, l'authentification et les modèles
 */

import type { H3Event } from 'h3';
import type { Sequelize, Model, ModelStatic } from 'sequelize';

// ========================================
// Types de base pour l'API
// ========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationErrors;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationErrors {
  [field: string]: string | string[];
}

// ========================================
// Types d'authentification
// ========================================

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  password?: string; // Optionnel car supprimé dans les réponses
  role_id: number;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
  getPermissions(): Permission[];
  hasPermission(permissionName: string): boolean;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Session {
  id: string;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  id: number;
  email: string;
  role_id: number;
  role: string;
  iat?: number;
  exp?: number;
}

// ========================================
// Types d'événements H3 étendus
// ========================================

export interface AuthenticatedEvent extends H3Event {
  context: H3Event['context'] & {
    user?: User;
    userRole?: Role;
    permissions?: Permission[];
  };
}

// ========================================
// Types de modèles métier
// ========================================

export interface Page {
  id: number;
  title: string;
  content: string;
  slug: string;
  status: 'draft' | 'published';
  parentId?: number;
  level: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: number;
  filename: string;
  originalFilename: string;
  path: string;
  size: number;
  width: number;
  height: number;
  format: string;
  mimeType: string;
  title?: string;
  description?: string;
  altText?: string;
  hash: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageVariant {
  id: number;
  filename: string;
  path: string;
  size: number;
  width: number;
  height: number;
  format: string;
  type: string;
  imageId: number;
}

export interface Organigramme {
  id: number;
  title: string;
  description?: string;
  slug: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  level: number;
  parentId?: number;
  orderIndex: number;
  isActive: boolean;
  organigrammeId: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Types de base de données
// ========================================

export interface DatabaseModels {
  User: ModelStatic<Model>;
  Role: ModelStatic<Model>;
  Permission: ModelStatic<Model>;
  RolePermission: ModelStatic<Model>;
  Page: ModelStatic<Model>;
  Image: ModelStatic<Model>;
  ImageVariant: ModelStatic<Model>;
  Organigramme: ModelStatic<Model>;
  Employee: ModelStatic<Model>;
  AuditLog: ModelStatic<Model>;
}

export interface DatabaseService {
  models: DatabaseModels;
  sequelize?: Sequelize;
  initialize(): Promise<void>;
  isConnected(): boolean;
  close(): Promise<void>;
}

export interface MockDatabaseOperations<T = any> {
  findAll(options?: any): T[];
  findByPk(id: number | string): T | null;
  findOne(options: any): T | null;
  findAndCountAll(options?: any): { rows: T[]; count: number };
  create(data: Partial<T>): T;
  update(instance: T): T;
  destroy(id: number | string): boolean;
  findByEmail?(email: string): T | null;
  verifyPassword?(password: string, hash: string): boolean;
}

// ========================================
// Types d'audit et logging
// ========================================

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogInput {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ========================================
// Types de validation
// ========================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface ValidatorOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// ========================================
// Types de configuration
// ========================================

export interface DatabaseConfig {
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  storage?: string; // Pour SQLite
  logging?: boolean | ((sql: string) => void);
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

export interface AppConfig {
  database: DatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  session: {
    maxAge: number;
    cookieMaxAge: number;
  };
  uploads: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
}

// ========================================
// Types utilitaires
// ========================================

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = { [P in keyof T]?: T[P] };
export type Required<T> = { [P in keyof T]-?: T[P] };

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreatePageInput = Omit<Page, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePageInput = Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateOrganigrammeInput = Omit<Organigramme, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrganigrammeInput = Partial<Omit<Organigramme, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateEmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEmployeeInput = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>;