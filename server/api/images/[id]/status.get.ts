/**
 * Endpoint pour vérifier le statut de traitement d'une image
 * Permet le polling côté client pour suivre le traitement asynchrone
 */
import { defineEventHandler, createError } from 'h3';
import { authenticateUser, validateIdParameter, handleDatabaseError } from '../../../services/auth-middleware-optimized.js';
import { imageProcessingQueue } from '../../../services/image-queue-service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../constants/api-constants.js';
import { models } from '../../../models.js';
import type { AuthenticatedEvent, ApiResponse } from '../../../types/index.js';

const { Image, ImageVariant } = models;

interface ImageStatusResponse {
  id: number;
  filename: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  variants: {
    expected: number;
    generated: number;
    details: Array<{
      type: string;
      status: 'pending' | 'completed' | 'failed';
      filename?: string;
      size?: number;
      width?: number;
      height?: number;
    }>;
  };
  processing?: {
    jobId?: string;
    queuePosition?: number;
    progress?: number;
    estimatedTimeRemaining?: number;
  };
  metadata: {
    originalSize: number;
    width: number;
    height: number;
    format: string;
    createdAt: string;
    updatedAt: string;
  };
  performance?: {
    processingTime?: number;
    compressionRatio?: number;
    totalSize: number;
  };
}

export default defineEventHandler(async (event: AuthenticatedEvent): Promise<ApiResponse<ImageStatusResponse>> => {
  try {
    // Authentification rapide
    const user = await authenticateUser(event);
    const id = validateIdParameter(event.context.params?.id);

    // Récupérer l'image avec ses variants
    const image = await Image.findByPk(id, {
      include: [
        {
          model: ImageVariant,
          as: 'variants',
          attributes: ['id', 'type', 'filename', 'size', 'width', 'height', 'format', 'createdAt']
        }
      ]
    });

    if (!image) {
      throw createError({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: ERROR_MESSAGES.IMAGES.NOT_FOUND
      });
    }

    // Vérifier les permissions (propriétaire ou manage_images)
    if (image.userId !== user.id && !user.permissions?.includes('manage_images')) {
      throw createError({
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: ERROR_MESSAGES.AUTH.PERMISSION_DENIED
      });
    }

    // Types de variants attendus
    const expectedVariantTypes = ['thumbnail', 'small', 'medium', 'large', 'webp'];
    const generatedVariants = image.variants || [];

    // Analyse des variants
    const variantDetails = expectedVariantTypes.map(type => {
      const variant = generatedVariants.find((v: any) => v.type === type);
      
      if (variant) {
        return {
          type,
          status: 'completed' as const,
          filename: variant.filename,
          size: variant.size,
          width: variant.width,
          height: variant.height
        };
      } else {
        return {
          type,
          status: image.processingStatus === 'failed' ? 'failed' as const : 'pending' as const
        };
      }
    });

    // Informations de traitement si en cours
    let processingInfo: ImageStatusResponse['processing'] = undefined;
    
    // Rechercher le job dans la queue si le traitement est en cours
    if (image.processingStatus === 'pending' || image.processingStatus === 'processing') {
      // Note: En production, on stockerait le jobId en base pour un tracking précis
      // Ici on fait une estimation basée sur les stats de la queue
      const queueStats = imageProcessingQueue.getStats();
      
      processingInfo = {
        queuePosition: queueStats.pending + 1,
        progress: image.processingStatus === 'processing' ? 75 : 25,
        estimatedTimeRemaining: estimateTimeRemaining(queueStats)
      };
    }

    // Calcul des performances si traitement terminé
    let performance: ImageStatusResponse['performance'] = undefined;
    
    if (image.processingStatus === 'completed') {
      const totalVariantSize = generatedVariants.reduce((sum: number, v: any) => sum + (v.size || 0), 0);
      const compressionRatio = image.size > 0 ? ((image.size - totalVariantSize) / image.size) * 100 : 0;
      
      performance = {
        processingTime: calculateProcessingTime(image.createdAt, image.updatedAt),
        compressionRatio: Math.max(0, compressionRatio),
        totalSize: image.size + totalVariantSize
      };
    }

    const response: ImageStatusResponse = {
      id: image.id,
      filename: image.filename,
      processingStatus: image.processingStatus as any,
      variants: {
        expected: expectedVariantTypes.length,
        generated: generatedVariants.length,
        details: variantDetails
      },
      processing: processingInfo,
      metadata: {
        originalSize: image.size,
        width: image.width || 0,
        height: image.height || 0,
        format: image.format,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      },
      performance
    };

    return {
      success: true,
      data: response,
      message: `Statut de l'image ${image.filename}`
    };

  } catch (error: any) {
    handleDatabaseError(error, "récupération du statut d'image");
  }
});

/**
 * Estime le temps de traitement restant basé sur les stats de la queue
 */
function estimateTimeRemaining(queueStats: any): number {
  if (queueStats.averageProcessingTime <= 0) {
    return 30000; // Estimation par défaut: 30 secondes
  }

  // Estimation basée sur la position dans la queue et le débit moyen
  const estimatedMs = (queueStats.pending * queueStats.averageProcessingTime) / Math.max(1, queueStats.processing);
  
  return Math.min(estimatedMs, 300000); // Max 5 minutes
}

/**
 * Calcule le temps de traitement effectif
 */
function calculateProcessingTime(createdAt: string, updatedAt: string): number {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  
  return Math.max(0, updated - created);
}