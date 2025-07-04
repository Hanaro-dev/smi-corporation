import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { defineEventHandler, createError, setHeader } from '../../../utils/http-utils.js'

/**
 * Endpoint pour servir les images uploadées localement
 * Remplace la fonctionnalité @nuxt/image pour un hébergement local complet
 */

export default defineEventHandler(async (event) => {
  try {
    const path = event.context.params.path
    
    if (!path || path.includes('..')) {
      throw createError({
        statusCode: 400,
        message: 'Chemin d\'image invalide'
      })
    }
    
    // Chemin vers le dossier d'upload des images
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    const imagePath = join(uploadsDir, path)
    
    // Vérifier que le fichier existe
    if (!existsSync(imagePath)) {
      throw createError({
        statusCode: 404,
        message: 'Image non trouvée'
      })
    }
    
    // Lire le fichier
    const imageBuffer = await readFile(imagePath)
    
    // Définir le type MIME en fonction de l'extension
    const ext = path.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg'
        break
      case 'png':
        mimeType = 'image/png'
        break
      case 'gif':
        mimeType = 'image/gif'
        break
      case 'webp':
        mimeType = 'image/webp'
        break
      case 'svg':
        mimeType = 'image/svg+xml'
        break
    }
    
    // Définir les en-têtes appropriés
    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000') // 1 an
    setHeader(event, 'Content-Length', imageBuffer.length)
    
    return imageBuffer
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Erreur lors du service de l\'image:', error)
    throw createError({
      statusCode: 500,
      message: 'Erreur lors du chargement de l\'image'
    })
  }
})