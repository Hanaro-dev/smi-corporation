import { Image } from '../../models.js'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params.id
    const body = await readBody(event)
    
    // Récupérer l'image
    const image = await Image.findByPk(id)
    
    // Vérifier si l'image existe
    if (!image) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image non trouvée'
      })
    }
    
    // Valider les données reçues
    const { title, altText, description } = body
    
    // Mettre à jour les métadonnées
    await image.update({
      title: title !== undefined ? title : image.title,
      altText: altText !== undefined ? altText : image.altText,
      description: description !== undefined ? description : image.description
    })
    
    // Récupérer l'image mise à jour pour la retourner
    const updatedImage = await Image.findByPk(id)
    
    return {
      id: updatedImage.id,
      url: updatedImage.path,
      title: updatedImage.title,
      description: updatedImage.description,
      altText: updatedImage.altText,
      originalFilename: updatedImage.originalFilename,
      width: updatedImage.width,
      height: updatedImage.height,
      size: updatedImage.size,
      format: updatedImage.format,
      createdAt: updatedImage.createdAt,
      updatedAt: updatedImage.updatedAt
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'image (ID: ${event.context.params.id}):`, error)
    
    // Si l'erreur est déjà une erreur HTTP, la propager
    if (error.statusCode) {
      throw error
    }
    
    // Sinon, créer une erreur 500
    throw createError({
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors de la mise à jour de l'image"
    })
  }
})