import { unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { Image, ImageVariant } from '../models.js'
import { getCookie, getHeader, defineEventHandler, createError } from '../utils/http-utils.js'
import { getClientIP } from '../utils/ip-utils.js'
import { sessionDb, userDb, roleDb, auditDb } from '../utils/mock-db.js'
import { checkPermission } from '../utils/permission-utils.js'
import { checkRateLimit, imageDeletionRateLimit } from '../utils/rate-limiter.js'

export default defineEventHandler(async (event) => {
  try {
    // 1. Vérification du rate limiting
    const clientIP = getClientIP(event) || 'unknown';
    const rateLimitResult = checkRateLimit(clientIP, imageDeletionRateLimit);
    
    if (!rateLimitResult.allowed) {
      const errorMessage = rateLimitResult.blocked 
        ? `Trop de tentatives de suppression. Réessayez dans ${Math.ceil(rateLimitResult.timeUntilUnblock / 1000 / 60)} minutes.`
        : 'Limite de suppression atteinte. Réessayez plus tard.';
      
      throw createError({
        statusCode: 429,
        statusMessage: errorMessage
      });
    }
    
    // 2. Authentification et vérification des permissions
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
    
    const body = await readBody(event)
    
    // Vérifier si un ID ou une URL a été fourni
    if (!body.id && !body.url) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID ou URL de l'image requis pour la suppression.",
      })
    }
    
    // Rechercher l'image dans la base de données
    let image
    if (body.id) {
      image = await Image.findByPk(body.id)
    } else if (body.url) {
      image = await Image.findOne({ where: { path: body.url } })
    }
    
    if (!image) {
      throw createError({
        statusCode: 404,
        statusMessage: "Image non trouvée.",
      })
    }
    
    // Récupérer toutes les variantes de l'image
    const variants = await ImageVariant.findAll({
      where: { imageId: image.id }
    })
    
    // Supprimer les fichiers physiques
    const errors = []
    
    // Chemin de base vers le dossier public
    const basePath = join(process.cwd(), 'public')
    
    // Supprimer le fichier original
    try {
      const originalPath = join(basePath, image.path)
      await unlink(originalPath)
    } catch (error) {
      console.error(`Erreur lors de la suppression du fichier original: ${error.message}`)
      errors.push(`Fichier original: ${error.message}`)
    }
    
    // Supprimer tous les fichiers de variantes
    for (const variant of variants) {
      try {
        const variantPath = join(basePath, variant.path)
        await unlink(variantPath)
      } catch (error) {
        console.error(`Erreur lors de la suppression de la variante ${variant.type}: ${error.message}`)
        errors.push(`Variante ${variant.type}: ${error.message}`)
      }
    }
    
    // Supprimer les entrées de la base de données (d'abord les variantes, puis l'image)
    await ImageVariant.destroy({
      where: { imageId: image.id }
    })
    
    await Image.destroy({
      where: { id: image.id }
    })
    
    // Enregistrer l'activité dans les logs d'audit
    await auditDb.create({
      userId: event.context.user.id,
      action: 'image_delete',
      details: `Image supprimée: ${image.originalFilename || image.filename} (ID: ${image.id})`,
      ipAddress: getClientIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    });
    
    // Retourner le résultat avec les éventuelles erreurs
    return {
      success: true,
      id: image.id,
      message: "Image et variantes supprimées avec succès.",
      errors: errors.length > 0 ? errors : null
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'image:", error)
    
    // Si l'erreur est déjà une erreur HTTP, la propager
    if (error.statusCode) {
      throw error
    }
    
    // Sinon, créer une erreur 500
    throw createError({
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors de la suppression de l'image.",
    })
  }
})