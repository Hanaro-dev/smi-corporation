import { Image, ImageVariant, User } from '../../models.js'
import { getCookie, defineEventHandler, createError } from '../../utils/http-utils.js'
import { sessionDb, userDb, roleDb } from '../../utils/mock-db.js'
import { checkPermission } from '../../utils/permission-utils.js'

export default defineEventHandler(async (event) => {
  try {
    // 1. Authentification (lecture seule pour les images publiques, mais on vérifie quand même)
    const token = getCookie(event, "auth_token");
    
    // Pour la lecture, on peut permettre l'accès sans authentification pour les images publiques
    // Mais dans un contexte sécurisé, on pourrait exiger l'authentification
    if (token) {
      // Rechercher la session
      const session = sessionDb.findByToken(token);
      if (session) {
        // Rechercher l'utilisateur
        const user = await userDb.findById(session.userId);
        if (user) {
          // Récupérer le rôle de l'utilisateur avec ses permissions
          const role = roleDb.findByPk(user.role_id);
          if (role) {
            // Mettre l'utilisateur dans le contexte
            const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
            delete userWithoutPassword.password;
            
            event.context.user = userWithoutPassword;
            event.context.userRole = role;
            event.context.permissions = role.getPermissions();
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
        statusCode: 404,
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
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors de la récupération de l'image"
    })
  }
})