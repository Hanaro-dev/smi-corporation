import { Image, ImageVariant, User, sequelize } from '../../models.js'
import { Op } from 'sequelize'
import { defineEventHandler, createError, getQuery } from 'h3'
import { checkPermission } from '../../utils/permission-utils.js'
import { authenticateUser, handleDatabaseError } from '../../services/auth-middleware.js'
import { HTTP_STATUS, ERROR_MESSAGES } from '../../constants/api-constants.js'

export default defineEventHandler(async (event) => {
  try {
    // 1. Authentification centralisée et vérification des permissions
    await authenticateUser(event);
    await checkPermission(event, "view");
    
    const query = getQuery(event)
    
    // Paramètres de pagination
    const limit = parseInt(query.limit) || 24
    const offset = parseInt(query.offset) || 0
    
    // Préparer les filtres
    const whereClause = {}
    
    // Filtre de recherche (titre, nom de fichier original, etc.)
    if (query.search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${query.search}%` } },
        { originalFilename: { [Op.like]: `%${query.search}%` } },
        { description: { [Op.like]: `%${query.search}%` } },
        { altText: { [Op.like]: `%${query.search}%` } }
      ]
    }
    
    // Filtre par format
    if (query.format) {
      whereClause.format = query.format
    }
    
    // Filtre par date
    if (query.date) {
      const now = new Date()
      let startDate
      
      switch (query.date) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate = new Date(now)
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate = new Date(now)
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      if (startDate) {
        whereClause.createdAt = { [Op.gte]: startDate }
      }
    }
    
    // Effectuer la requête pour récupérer les images avec pagination
    const { count, rows } = await Image.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ImageVariant,
          as: 'variants',
          attributes: ['id', 'path', 'width', 'height', 'type']
        },
        {
          model: User,
          attributes: ['id', 'name', 'username']
        }
      ]
    })
    
    // Calculer la taille totale de toutes les images (avec les mêmes filtres)
    const sizeResult = await Image.findOne({
      where: whereClause,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
      ],
      raw: true
    })
    
    const totalSize = sizeResult?.totalSize || 0
    
    // Formater les résultats pour le client
    const images = rows.map(image => {
      const jsonImage = image.toJSON()
      
      // Transformer les variantes en un format plus simple
      if (jsonImage.variants) {
        jsonImage.variants = jsonImage.variants.map(variant => ({
          id: variant.id,
          type: variant.type,
          url: variant.path,
          width: variant.width,
          height: variant.height
        }))
      }
      
      return {
        id: jsonImage.id,
        url: jsonImage.path,
        title: jsonImage.title,
        description: jsonImage.description,
        altText: jsonImage.altText,
        originalFilename: jsonImage.originalFilename,
        width: jsonImage.width,
        height: jsonImage.height,
        size: jsonImage.size,
        format: jsonImage.format,
        createdAt: jsonImage.createdAt,
        updatedAt: jsonImage.updatedAt,
        user: jsonImage.User,
        variants: jsonImage.variants
      }
    })
    
    return {
      images,
      total: count,
      totalSize,
      offset,
      limit
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des images'
    })
  }
})