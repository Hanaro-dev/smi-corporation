import { Image, sequelize } from '../../models.js'
import { Sequelize } from 'sequelize'
import { getCookie, defineEventHandler, createError } from 'h3'
import { sessionDb, userDb, roleDb } from '../../utils/mock-db.js'
import { checkPermission } from '../../utils/permission-utils.js'

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

    // Vérifier les permissions (view pour les statistiques)
    await checkPermission(event, "view");
    
    // 2. Obtenir le nombre total d'images
    const totalImages = await Image.count()
    
    // Calculer l'espace total utilisé (somme des tailles de toutes les images)
    const sizeResult = await Image.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('size')), 'totalSize']
      ],
      raw: true
    })
    
    const totalSize = sizeResult?.totalSize || 0
    
    // Obtenir le nombre d'images par format
    const formatCounts = await Image.findAll({
      attributes: [
        'format',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['format'],
      raw: true
    })
    
    // Formater les résultats
    const formats = formatCounts.map(item => ({
      name: item.format,
      count: parseInt(item.count)
    }))
    
    return {
      totalImages,
      totalSize,
      formats
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des statistiques'
    })
  }
})