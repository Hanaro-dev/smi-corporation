/**
 * API simplifiée pour les images (compatible mode mock)
 */
import { getCookie, defineEventHandler, createError, getQuery } from 'h3'
import { sessionDb, userDb } from '../utils/mock-db-optimized.js';
import { imageDb } from '../utils/mock-db.js'

export default defineEventHandler(async (event) => {
  try {
    // 1. Authentification basique
    const token = getCookie(event, "auth_token");
    
    if (!token) {
      throw createError({ statusCode: 401, message: "Token d'authentification requis." });
    }
    
    // Rechercher la session
    const session = sessionDb.findByToken(token);
    if (!session) {
      throw createError({ statusCode: 401, message: "Session invalide." });
    }
    
    // 2. Récupérer les images depuis le mock
    const query = getQuery(event);
    const limit = parseInt(query.limit) || 24;
    const offset = parseInt(query.offset) || 0;
    
    const result = await imageDb.findAndCountAll({
      limit,
      offset
    });
    
    // 3. Formater pour le client
    const images = result.rows.map(image => ({
      id: image.id,
      url: image.url,
      filename: image.filename,
      originalName: image.originalName,
      alt: image.alt,
      caption: image.caption,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,
      isPublic: image.isPublic,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    }));
    
    return {
      images,
      total: result.count,
      offset,
      limit
    };
    
  } catch (error) {
    console.error('Erreur API images simple:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors de la récupération des images'
    });
  }
});