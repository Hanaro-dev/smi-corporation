/**
 * Worker Thread pour le traitement d'images
 * Traite les opérations Sharp de manière asynchrone pour éviter le blocage du thread principal
 */
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import path from 'path';

if (!isMainThread) {
  /**
   * Configuration des variants d'images optimisées
   */
  const VARIANTS_CONFIG = {
    thumbnail: { width: 150, height: 150, fit: "cover", quality: 80 },
    small: { width: 300, quality: 85 },
    medium: { width: 600, quality: 90 },
    large: { width: 1200, quality: 95 },
    webp: { width: 800, format: 'webp', quality: 85 }
  };

  /**
   * Traitement optimisé des variants d'images
   */
  async function processImageVariants() {
    try {
      const { imageBuffer, filename, outputDir, operation } = workerData;
      
      if (operation === 'variants') {
        return await generateVariants(imageBuffer, filename, outputDir);
      } else if (operation === 'crop') {
        return await processCrop(imageBuffer, workerData.cropOptions, filename, outputDir);
      } else if (operation === 'optimize') {
        return await optimizeImage(imageBuffer, filename, outputDir);
      }
      
      throw new Error(`Opération non supportée: ${operation}`);
      
    } catch (error) {
      parentPort.postMessage({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      });
    }
  }

  /**
   * Génération des variants d'images avec optimisation parallèle
   */
  async function generateVariants(imageBuffer, filename, outputDir) {
    const results = [];
    const baseSharp = sharp(imageBuffer);
    const metadata = await baseSharp.metadata();
    
    // Optimisation: Traitement parallèle des variants avec Promise.allSettled
    const variantPromises = Object.entries(VARIANTS_CONFIG).map(async ([type, options]) => {
      try {
        const variantFilename = `${path.parse(filename).name}-${type}${path.extname(filename)}`;
        const variantPath = path.join(outputDir, variantFilename);
        
        let transformer = sharp(imageBuffer);
        
        // Configuration du redimensionnement
        if (options.fit === "cover" && options.width && options.height) {
          transformer = transformer.resize(options.width, options.height, { 
            fit: "cover",
            position: "centre"
          });
        } else if (options.width) {
          transformer = transformer.resize(options.width, null, {
            withoutEnlargement: true
          });
        }
        
        // Configuration du format et qualité
        if (options.format === 'webp') {
          transformer = transformer.webp({ quality: options.quality });
        } else {
          transformer = transformer.jpeg({ 
            quality: options.quality,
            progressive: true,
            mozjpeg: true
          });
        }
        
        // Traitement et sauvegarde
        const buffer = await transformer.toBuffer();
        await writeFile(variantPath, buffer);
        
        // Récupération des métadonnées du variant
        const variantMetadata = await sharp(buffer).metadata();
        
        return {
          type,
          filename: variantFilename,
          path: variantPath,
          size: buffer.length,
          width: variantMetadata.width,
          height: variantMetadata.height,
          format: variantMetadata.format,
          success: true
        };
        
      } catch (error) {
        console.error(`Erreur lors du traitement du variant ${type}:`, error);
        return {
          type,
          success: false,
          error: error.message
        };
      }
    });
    
    const variantResults = await Promise.allSettled(variantPromises);
    
    // Traitement des résultats
    variantResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const variantType = Object.keys(VARIANTS_CONFIG)[index];
        console.error(`Échec du traitement du variant ${variantType}:`, result.reason);
        results.push({
          type: variantType,
          success: false,
          error: result.reason?.message || 'Erreur inconnue'
        });
      }
    });
    
    return {
      variants: results,
      originalMetadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length
      }
    };
  }

  /**
   * Traitement du recadrage d'image
   */
  async function processCrop(imageBuffer, cropOptions, filename, outputDir) {
    const { x, y, width, height } = cropOptions;
    
    // Recadrage de l'image
    const croppedBuffer = await sharp(imageBuffer)
      .extract({ 
        left: Math.round(x), 
        top: Math.round(y), 
        width: Math.round(width), 
        height: Math.round(height) 
      })
      .jpeg({ quality: 95, progressive: true })
      .toBuffer();
    
    // Sauvegarde de l'image recadrée
    const croppedPath = path.join(outputDir, filename);
    await writeFile(croppedPath, croppedBuffer);
    
    // Génération des nouveaux variants
    const variantsResult = await generateVariants(croppedBuffer, filename, outputDir);
    
    const metadata = await sharp(croppedBuffer).metadata();
    
    return {
      cropped: {
        filename,
        path: croppedPath,
        size: croppedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      },
      variants: variantsResult.variants
    };
  }

  /**
   * Optimisation d'image existante
   */
  async function optimizeImage(imageBuffer, filename, outputDir) {
    const optimizedBuffer = await sharp(imageBuffer)
      .jpeg({ 
        quality: 90, 
        progressive: true, 
        mozjpeg: true 
      })
      .toBuffer();
    
    const optimizedPath = path.join(outputDir, filename);
    await writeFile(optimizedPath, optimizedBuffer);
    
    const metadata = await sharp(optimizedBuffer).metadata();
    const compressionRatio = ((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length) * 100;
    
    return {
      optimized: {
        filename,
        path: optimizedPath,
        originalSize: imageBuffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      }
    };
  }

  // Démarrer le traitement
  processImageVariants()
    .then(results => {
      parentPort.postMessage({ success: true, results });
    })
    .catch(error => {
      parentPort.postMessage({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      });
    });

} else {
  // Mode principal - utilitaires pour créer des workers
  class ImageWorker {
    static async processVariants(imageBuffer, filename, outputDir) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), {
          workerData: {
            imageBuffer,
            filename,
            outputDir,
            operation: 'variants'
          }
        });
        
        const timeout = setTimeout(() => {
          worker.terminate();
          reject(new Error('Timeout du traitement d\'image (30s)'));
        }, 30000);
        
        worker.on('message', (result) => {
          clearTimeout(timeout);
          if (result.success) {
            resolve(result.results);
          } else {
            reject(new Error(result.error));
          }
        });
        
        worker.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        
        worker.on('exit', (code) => {
          clearTimeout(timeout);
          if (code !== 0) {
            reject(new Error(`Worker s'est arrêté avec le code ${code}`));
          }
        });
      });
    }
    
    static async processCrop(imageBuffer, cropOptions, filename, outputDir) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), {
          workerData: {
            imageBuffer,
            cropOptions,
            filename,
            outputDir,
            operation: 'crop'
          }
        });
        
        const timeout = setTimeout(() => {
          worker.terminate();
          reject(new Error('Timeout du recadrage d\'image (45s)'));
        }, 45000);
        
        worker.on('message', (result) => {
          clearTimeout(timeout);
          if (result.success) {
            resolve(result.results);
          } else {
            reject(new Error(result.error));
          }
        });
        
        worker.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        
        worker.on('exit', (code) => {
          clearTimeout(timeout);
          if (code !== 0) {
            reject(new Error(`Worker s'est arrêté avec le code ${code}`));
          }
        });
      });
    }
  }
  
  module.exports = { ImageWorker };
}