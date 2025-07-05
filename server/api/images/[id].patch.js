import { Image } from '../../models.js'
import { getCookie, getHeader, defineEventHandler, createError, getRequestIP, readBody } from 'h3'
import { sessionDb, userDb, roleDb, auditDb } from '../../utils/mock-db.js'
import { checkPermission } from '../../utils/permission-utils.js'
import DOMPurify from 'dompurify'

export default defineEventHandler(async (event) => {
  try {
    // 1. Authentification et vérification des permissions
    const token = getCookie(event, "auth_token");
    
    if (!token) {
      throw createError({ statusCode: 401, message: "Token d'authentification requis." });
    }
    
    // Rechercher la session
    const session = sessionDb.findByToken(token);
    if (!session) {
      throw createError({ statusCode: 401, message: "Session invalide." });
    }
    
    // Rechercher l'utilisateur
    const user = await userDb.findById(session.userId);
    if (!user) {
      throw createError({ statusCode: 401, message: "Utilisateur non trouvé." });
    }

    // Récupérer le rôle de l'utilisateur avec ses permissions
    const role = roleDb.findByPk(user.role_id);
    if (!role) {
      throw createError({
        statusCode: 500,
        message: "Rôle utilisateur non trouvé."
      });
    }

    // Mettre l'utilisateur dans le contexte
    const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;
    
    event.context.user = userWithoutPassword;
    event.context.userRole = role;
    event.context.permissions = role.getPermissions();

    // Vérifier les permissions
    await checkPermission(event, "manage_media");
    
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
    
    // Valider et sanitiser les données reçues
    const { title, altText, description } = body
    
    // Sanitiser les entrées pour éviter les attaques XSS
    const sanitizedTitle = title !== undefined ? DOMPurify.sanitize(title.toString().trim()) : image.title;
    const sanitizedAltText = altText !== undefined ? DOMPurify.sanitize(altText.toString().trim()) : image.altText;
    const sanitizedDescription = description !== undefined ? DOMPurify.sanitize(description.toString().trim()) : image.description;
    
    // Mettre à jour les métadonnées
    await image.update({
      title: sanitizedTitle,
      altText: sanitizedAltText,
      description: sanitizedDescription
    })
    
    // Enregistrer l'activité dans les logs d'audit
    await auditDb.create({
      userId: event.context.user.id,
      action: 'image_update',
      details: `Métadonnées d'image mises à jour: ${sanitizedTitle || image.originalFilename} (ID: ${id})`,
      ipAddress: getRequestIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    });
    
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