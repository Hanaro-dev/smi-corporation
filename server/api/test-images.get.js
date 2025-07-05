/**
 * Test endpoint pour diagnostiquer les images sans authentification
 */
import { defineEventHandler } from 'h3'
import { imageDb } from '../utils/mock-db.js'

export default defineEventHandler(async (event) => {
  try {
    // Test simple : récupérer toutes les images
    const images = await imageDb.findAll();
    
    return {
      success: true,
      count: images.length,
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        url: img.url,
        alt: img.alt
      }))
    };
    
  } catch (error) {
    console.error('Erreur test images:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});