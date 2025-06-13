import { Image, sequelize } from '../../models.js'
import { Sequelize } from 'sequelize'

export default defineEventHandler(async (event) => {
  try {
    // Obtenir le nombre total d'images
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