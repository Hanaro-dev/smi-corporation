import { Image, ImageVariant, User } from '../../models.js'
import { getCookie, defineEventHandler, createError } from 'h3'
import { sessionDb, userDb, roleDb } from '../../utils/mock-db.js'
import { checkPermission } from '../../utils/permission-utils.js'

export default defineEventHandler(async (event) => {
  try {
    // 1. Authentification (lecture seule pour les images publiques, mais on vérifie quand même)
    await authenticateUser(event);
          }
        }
      }
    }
    
    const id = event.context.params.id
    
    // Récupérer l'image avec ses variantes et l'utilisateur associé
    const image = await Image.findByPk(id, {
      include: [
        {
          model: ImageVariant,
          as: 'variants',
          attributes: ['id', 'path', 'width', 'height', 'type', 'format', 'size']
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        }
      ]
    })
    
    // Vérifier si l'image existe
    if (!image) {
      throw createError({
        statusCode: HTTP_STATUS.NOT_FOUND,
        statusMessage: 'Image non trouvée'
      })
    }
    
    // Formater la réponse
    const jsonImage = image.toJSON()
    
    // Transformer les variantes en un format plus simple
    if (jsonImage.variants) {
      jsonImage.variants = jsonImage.variants.map(variant => ({
        id: variant.id,
        type: variant.type,
        url: variant.path,
        width: variant.width,
        height: variant.height,
        format: variant.format,
        size: variant.size
      }))
    }
    
    return {
      id: jsonImage.id,
      url: jsonImage.path,
      title: jsonImage.title,
      description: jsonImage.description,
      altText: jsonImage.altText,
      originalFilename: jsonImage.originalFilename,
      filename: jsonImage.filename,
      width: jsonImage.width,
      height: jsonImage.height,
      size: jsonImage.size,
      format: jsonImage.format,
      mimeType: jsonImage.mimeType,
      createdAt: jsonImage.createdAt,
      updatedAt: jsonImage.updatedAt,
      user: jsonImage.User,
      variants: jsonImage.variants
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'image (ID: ${event.context.params.id}):`, error)
    
    // Si l'erreur est déjà une erreur HTTP, la propager
    if (error.statusCode) {
      throw error
    }
    
    // Sinon, créer une erreur 500
    throw createError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      statusMessage: "Une erreur est survenue lors de la récupération de l'image"
    })
  }
})