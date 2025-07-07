/**
 * API Constants - Centralized configuration values
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_MESSAGES = {
  AUTH: {
    TOKEN_REQUIRED: "Token d'authentification requis.",
    INVALID_SESSION: "Session invalide.",
    USER_NOT_FOUND: "Utilisateur non trouvé.",
    INVALID_CREDENTIALS: "Identifiants invalides.",
    ROLE_NOT_FOUND: "Rôle utilisateur non trouvé.",
    PERMISSION_DENIED: "Permission refusée.",
    TOO_MANY_ATTEMPTS: "Trop de tentatives de connexion. Veuillez réessayer dans une minute."
  },
  VALIDATION: {
    INVALID_ID: "ID invalide.",
    REQUIRED_FIELD: "Ce champ est requis.",
    INVALID_FORMAT: "Format invalide.",
    SLUG_EXISTS: "Cette URL est déjà utilisée.",
    TITLE_LENGTH: "Le titre doit contenir entre 3 et 255 caractères.",
    INVALID_STATUS: "Le statut doit être 'draft' ou 'published'."
  },
  DATABASE: {
    CONNECTION_ERROR: "Erreur de connexion à la base de données.",
    SERVICE_UNAVAILABLE: "Service de base de données temporairement indisponible.",
    OPERATION_FAILED: "Erreur lors de l'opération en base de données."
  },
  GENERIC: {
    NOT_FOUND: "Ressource non trouvée.",
    METHOD_NOT_ALLOWED: "Méthode non autorisée.",
    INTERNAL_ERROR: "Erreur interne du serveur."
  },
  PAGES: {
    NOT_FOUND: "Page non trouvée.",
    FETCH_ERROR: "Erreur lors de la récupération des pages.",
    CREATE_ERROR: "Erreur lors de la création de la page.",
    UPDATE_ERROR: "Erreur lors de la mise à jour de la page.",
    DELETE_ERROR: "Erreur lors de la suppression de la page.",
    HAS_CHILDREN: "Cette page a des enfants. Veuillez d'abord supprimer ou déplacer les pages enfants."
  },
  IMAGES: {
    NOT_FOUND: "Image non trouvée.",
    UPLOAD_ERROR: "Erreur lors du téléchargement de l'image.",
    PROCESSING_ERROR: "Erreur lors du traitement de l'image.",
    DELETE_ERROR: "Erreur lors de la suppression de l'image.",
    INVALID_FORMAT: "Format d'image non autorisé.",
    SIZE_EXCEEDED: "La taille de l'image dépasse la limite autorisée."
  },
  USERS: {
    NOT_FOUND: "Utilisateur non trouvé.",
    CREATE_ERROR: "Erreur lors de la création de l'utilisateur.",
    UPDATE_ERROR: "Erreur lors de la mise à jour de l'utilisateur.",
    DELETE_ERROR: "Erreur lors de la suppression de l'utilisateur.",
    CANNOT_DELETE_SELF: "Vous ne pouvez pas supprimer votre propre compte."
  }
};

export const VALIDATION_RULES = {
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255
  },
  PASSWORD: {
    MIN_LENGTH: 8
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000
  },
  EMPLOYEE: {
    MAX_LEVEL: 10
  }
};

export const RATE_LIMIT = {
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 60000
  },
  API: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000
  }
};

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

export const STATUS_VALUES = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
};

export const PERMISSION_NAMES = {
  VIEW: 'view',
  MANAGE_ORGANIGRAMMES: 'manage_organigrammes',
  MANAGE_USERS: 'manage_users',
  MANAGE_PAGES: 'manage_pages',
  MANAGE_IMAGES: 'manage_images'
};

export const ROLE_NAMES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  USER: 'user'
};

export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  ORGANIGRAMME_CREATE: 'organigramme_create',
  ORGANIGRAMME_UPDATE: 'organigramme_update',
  ORGANIGRAMME_DELETE: 'organigramme_delete',
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete'
};