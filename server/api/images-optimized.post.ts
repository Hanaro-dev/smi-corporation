/**
 * Endpoint d'upload d'images optimisé avec traitement asynchrone
 * Résout les problèmes de blocage du thread principal
 */
import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { authenticateUser, handleDatabaseError } from '../services/auth-middleware-optimized.ts';
import { imageProcessingQueue } from '../services/image-queue-service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/api-constants.js';
import { Image, ImageVariant } from '../models.js';
import crypto from 'crypto';
import type { AuthenticatedEvent, ApiResponse, Image as ImageType } from '../types/index.js';

// Configuration de l'upload
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  uploadsDir: './public/uploads/images',
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
};

interface UploadResponse {
  id: number;
  filename: string;
  url: string;
  size: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  jobId: string;
  message: string;
  variants?: {
    expected: number;
    generated: number;
  };
}

export default defineEventHandler(async (event: AuthenticatedEvent): Promise<ApiResponse<UploadResponse>> => {
  try {
    // OPTIMISATION 1: Authentification rapide avec cache
    const user = await authenticateUser(event);
    
    if (!user.permissions?.includes('manage_images')) {
      throw createError({
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: ERROR_MESSAGES.AUTH.PERMISSION_DENIED
      });
    }

    // OPTIMISATION 2: Lecture des données multipart
    const files = await readMultipartFormData(event);
    if (!files || files.length === 0) {
      throw createError({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: "Aucun fichier fourni."
      });
    }

    const imageFile = files.find(file => file.name === 'image');
    if (!imageFile || !imageFile.data) {
      throw createError({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: "Fichier image requis."
      });
    }

    // OPTIMISATION 3: Validation rapide du fichier
    await validateImageFile(imageFile);

    // OPTIMISATION 4: Génération du nom de fichier unique
    const fileExtension = path.extname(imageFile.filename || '.jpg');
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const uploadsDir = UPLOAD_CONFIG.uploadsDir;
    const filePath = path.join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/images/${uniqueFilename}`;

    // Créer le répertoire si nécessaire
    await mkdir(uploadsDir, { recursive: true });

    // OPTIMISATION 5: Sauvegarde rapide du fichier original (non-bloquant)
    await writeFile(filePath, imageFile.data);

    // OPTIMISATION 6: Création immédiate de l'entrée en base (status pending)
    const imageRecord = await Image.create({
      filename: uniqueFilename,
      originalFilename: imageFile.filename || 'unknown',
      path: relativePath,
      size: imageFile.data.length,
      mimeType: imageFile.type || 'image/jpeg',
      format: fileExtension.substring(1),
      title: extractMetadata(imageFile).title,
      description: extractMetadata(imageFile).description,
      altText: extractMetadata(imageFile).altText || imageFile.filename,
      hash: crypto.createHash('md5').update(imageFile.data).digest('hex'),
      userId: user.id,
      processingStatus: 'pending',
      width: 0, // Sera mis à jour après traitement
      height: 0
    });

    // OPTIMISATION 7: Démarrage du traitement asynchrone (non-bloquant)
    const jobId = await imageProcessingQueue.addJob(
      'variants',
      imageFile.data,
      uniqueFilename,
      uploadsDir,
      { priority: 'normal' }
    );

    // Monitoring du job pour mise à jour automatique
    monitorProcessingJob(jobId, imageRecord.id);

    // OPTIMISATION 8: Réponse immédiate (thread non bloqué)
    const response: UploadResponse = {
      id: imageRecord.id,
      filename: uniqueFilename,
      url: relativePath,
      size: imageFile.data.length,
      processingStatus: 'pending',
      jobId,
      message: 'Image uploadée avec succès. Traitement des variants en cours...',
      variants: {
        expected: 5, // thumbnail, small, medium, large, webp
        generated: 0
      }
    };

    return {
      success: true,
      data: response,
      message: "Upload réussi, traitement en arrière-plan"
    };

  } catch (error: any) {
    handleDatabaseError(error, "upload d'image optimisé");
  }
});

/**
 * Validation rapide du fichier d'image
 */
async function validateImageFile(file: any): Promise<void> {
  // Validation de la taille
  if (file.data.length > UPLOAD_CONFIG.maxFileSize) {
    throw createError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `La taille du fichier dépasse la limite de ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB.`
    });
  }

  // Validation du type MIME
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    throw createError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `Type de fichier non autorisé. Types acceptés: ${UPLOAD_CONFIG.allowedMimeTypes.join(', ')}.`
    });
  }

  // Validation de l'extension
  const extension = path.extname(file.filename || '').toLowerCase();
  if (!UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    throw createError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `Extension de fichier non autorisée. Extensions acceptées: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}.`
    });
  }

  // Validation basique du contenu (magic bytes)
  if (!isValidImageBuffer(file.data)) {
    throw createError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Le fichier ne semble pas être une image valide."
    });
  }
}

/**
 * Validation des magic bytes pour détecter le type réel du fichier
 */
function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;

  // JPEG magic bytes
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // PNG magic bytes
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }

  // WebP magic bytes
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return true;
  }

  return false;
}

/**
 * Extraction des métadonnées depuis les champs du formulaire
 */
function extractMetadata(file: any): {
  title?: string;
  description?: string;
  altText?: string;
} {
  return {
    title: file.filename ? path.parse(file.filename).name : undefined,
    description: undefined,
    altText: file.filename ? path.parse(file.filename).name : undefined
  };
}

/**
 * Monitoring asynchrone du job de traitement
 */
function monitorProcessingJob(jobId: string, imageId: number): void {
  // Écouter les événements de completion du job
  imageProcessingQueue.on('jobCompleted', async ({ jobId: completedJobId, result }) => {
    if (completedJobId === jobId) {
      try {
        await handleProcessingSuccess(imageId, result.results);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour post-traitement pour l'image ${imageId}:`, error);
      }
    }
  });

  imageProcessingQueue.on('jobFailed', async ({ jobId: failedJobId, error }) => {
    if (failedJobId === jobId) {
      try {
        await handleProcessingFailure(imageId, error);
      } catch (updateError) {
        console.error(`Erreur lors de la mise à jour d'échec pour l'image ${imageId}:`, updateError);
      }
    }
  });
}

/**
 * Gestion du succès du traitement
 */
async function handleProcessingSuccess(imageId: number, results: any): Promise<void> {
  try {
    const { variants, originalMetadata } = results;

    // Mise à jour de l'image principale avec les métadonnées
    await Image.update({
      width: originalMetadata.width,
      height: originalMetadata.height,
      processingStatus: 'completed'
    }, {
      where: { id: imageId }
    });

    // Création des variants réussis
    const variantPromises = variants
      .filter((variant: any) => variant.success)
      .map(async (variant: any) => {
        return ImageVariant.create({
          filename: variant.filename,
          path: variant.path,
          size: variant.size,
          width: variant.width,
          height: variant.height,
          format: variant.format,
          type: variant.type,
          imageId: imageId
        });
      });

    await Promise.allSettled(variantPromises);

    console.log(`✅ Traitement complété pour l'image ${imageId}: ${variants.filter((v: any) => v.success).length} variants générés`);

  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des variants pour l'image ${imageId}:`, error);
    
    // Marquer comme partiellement échoué
    await Image.update({
      processingStatus: 'failed'
    }, {
      where: { id: imageId }
    });
  }
}

/**
 * Gestion de l'échec du traitement
 */
async function handleProcessingFailure(imageId: number, error: string): Promise<void> {
  await Image.update({
    processingStatus: 'failed'
  }, {
    where: { id: imageId }
  });

  console.error(`❌ Échec du traitement pour l'image ${imageId}: ${error}`);
}