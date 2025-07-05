import { defineEventHandler, createError, getRouterParam } from 'h3';
import { pageDb } from '../../../utils/mock-db.js';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug requis'
    });
  }
  
  try {
    // Rechercher la page par slug dans la base de données mock
    const page = pageDb.findOne({ where: { slug } });
    
    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page non trouvée'
      });
    }
    
    // Retourner seulement les pages publiées pour les utilisateurs non connectés
    if (page.status !== 'published') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page non trouvée'
      });
    }
    
    return page;
  } catch (error) {
    console.error('Erreur lors de la récupération de la page:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur'
    });
  }
});