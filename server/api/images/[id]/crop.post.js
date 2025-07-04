import { resolve, join, dirname, extname } from "node:path";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import sizeOf from "image-size";
import { Image, ImageVariant } from "../../../models.js";
import { getCookie, getClientIP, getHeader } from "h3";
import { sessionDb, userDb, roleDb, auditDb } from '../../../utils/mock-db.js';
import { checkPermission } from "../../../utils/permission-utils.js";

// Dimensions des variantes
const VARIANTS = {
  thumbnail: { width: 150, height: 150, fit: "cover" },
  small: { width: 300, height: null },
  medium: { width: 600, height: null },
  large: { width: 1200, height: null },
};

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
    
    const id = event.context.params.id;
    const body = await readBody(event);
    
    // Récupérer l'image avec ses variantes
    const image = await Image.findByPk(id, {
      include: [
        {
          model: ImageVariant,
          as: 'variants',
        }
      ]
    });
    
    // Vérifier si l'image existe
    if (!image) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image non trouvée'
      });
    }
    
    // Valider les coordonnées reçues
    const { coordinates, aspectRatio } = body;
    
    if (!coordinates || !coordinates.width || !coordinates.height) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Coordonnées de recadrage invalides'
      });
    }
    
    // Chemin de l'image originale
    const originalImagePath = resolve(process.cwd(), "public", image.path);
    
    // Générer un nouveau nom de fichier pour l'image recadrée
    const fileExt = extname(image.filename);
    const newFilename = `${uuidv4()}${fileExt}`;
    
    // Créer la structure de répertoire basée sur la date (YYYY-MM)
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const uploadDir = resolve(process.cwd(), "public/uploads/images", dateFolder);
    await mkdir(uploadDir, { recursive: true });
    
    // Chemin pour la nouvelle image
    const newFilePath = join(uploadDir, newFilename);
    const relativeNewPath = `/uploads/images/${dateFolder}/${newFilename}`;
    
    // Recadrer l'image
    const croppedImage = await sharp(originalImagePath)
      .extract({
        left: Math.round(coordinates.left),
        top: Math.round(coordinates.top),
        width: Math.round(coordinates.width),
        height: Math.round(coordinates.height)
      })
      .toBuffer();
    
    // Sauvegarder l'image recadrée
    await writeFile(newFilePath, croppedImage);
    
    // Obtenir les dimensions de la nouvelle image
    const dimensions = sizeOf(croppedImage);
    
    // Créer le répertoire pour les variantes
    const variantsDir = join(dirname(newFilePath), "variants");
    await mkdir(variantsDir, { recursive: true });
    
    // Supprimer les anciennes variantes
    const deleteVariantPromises = image.variants.map(async (variant) => {
      try {
        const variantPath = resolve(process.cwd(), "public", variant.path);
        await unlink(variantPath);
      } catch (error) {
        console.error(`Erreur lors de la suppression de la variante (ID: ${variant.id}):`, error);
      }
    });
    
    await Promise.all(deleteVariantPromises);
    
    // Supprimer les entrées de variantes dans la base de données
    await ImageVariant.destroy({
      where: { imageId: image.id }
    });
    
    // Générer et sauvegarder les nouvelles variantes
    const variantPromises = [];
    const variantRecords = [];
    
    for (const [type, options] of Object.entries(VARIANTS)) {
      const variantFilename = `${type}_${newFilename}`;
      const variantPath = join(variantsDir, variantFilename);
      const relativeVariantPath = `/uploads/images/${dateFolder}/variants/${variantFilename}`;
      
      // Traitement avec Sharp
      let transformer = sharp(croppedImage);
      
      if (options.fit === "cover" && options.width && options.height) {
        transformer = transformer.resize(options.width, options.height, { fit: "cover" });
      } else if (options.width) {
        transformer = transformer.resize(options.width, null);
      }
      
      // Conversion en WebP si demandé
      if (type === "webp") {
        transformer = transformer.toFormat("webp");
      }
      
      // Enregistrer la variante
      const processPromise = transformer.toBuffer()
        .then(async (outputBuffer) => {
          await writeFile(variantPath, outputBuffer);
          
          // Obtenir les dimensions de la variante
          const variantDimensions = sizeOf(outputBuffer);
          
          // Créer l'entrée de variante
          const variantRecord = await ImageVariant.create({
            filename: variantFilename,
            path: relativeVariantPath,
            size: outputBuffer.length,
            width: variantDimensions.width,
            height: variantDimensions.height,
            format: type === "webp" ? "webp" : image.format,
            type,
            imageId: image.id,
          });
          
          variantRecords.push(variantRecord);
        });
      
      variantPromises.push(processPromise);
    }
    
    // Attendre que toutes les variantes soient traitées
    await Promise.all(variantPromises);
    
    // Mettre à jour l'image dans la base de données
    await image.update({
      filename: newFilename,
      path: relativeNewPath,
      width: dimensions.width,
      height: dimensions.height,
      size: croppedImage.length
    });
    
    // Récupérer l'image mise à jour avec ses nouvelles variantes
    const updatedImage = await Image.findByPk(id, {
      include: [
        {
          model: ImageVariant,
          as: 'variants',
        }
      ]
    });
    
    // Supprimer l'ancienne image (facultatif)
    try {
      await unlink(originalImagePath);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'image originale:`, error);
    }
    
    // Enregistrer l'activité dans les logs d'audit
    await auditDb.create({
      userId: event.context.user.id,
      action: 'image_crop',
      details: `Image recadrée: ${updatedImage.originalFilename || updatedImage.filename} (ID: ${id})`,
      ipAddress: getClientIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    });
    
    // Formater la réponse
    const jsonImage = updatedImage.toJSON();
    
    // Transformer les variantes en un format plus simple
    const variants = jsonImage.variants.map(variant => ({
      id: variant.id,
      type: variant.type,
      url: variant.path,
      width: variant.width,
      height: variant.height
    }));
    
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
      variants
    };
  } catch (error) {
    console.error(`Erreur lors du recadrage de l'image (ID: ${event.context.params.id}):`, error);
    
    // Si l'erreur est déjà une erreur HTTP, la propager
    if (error.statusCode) {
      throw error;
    }
    
    // Sinon, créer une erreur 500
    throw createError({
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors du recadrage de l'image"
    });
  }
});