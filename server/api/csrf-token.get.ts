/**
 * Endpoint pour obtenir/initialiser le token CSRF
 */
import { defineEventHandler } from 'h3';

import type { AuthenticatedEvent, ApiResponse, User } from '../../types/index.js';

export default defineEventHandler(async (event: AuthenticatedEvent) => {
  // Retourner simplement un message de succès
  // Le middleware nuxt-csurf va automatiquement créer le cookie
  return { 
    success: true, 
    message: 'CSRF token initialized',
    timestamp: new Date().toISOString()
  };
});