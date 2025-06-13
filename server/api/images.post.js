import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join, dirname, extname } from "node:path";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import sizeOf from "image-size";
import { Image, ImageVariant } from "../models.js";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Dimensions des variantes
const VARIANTS = {
  thumbnail: { width: 150, height: 150, fit: "cover" },
  small: { width: 300, height: null },
  medium: { width: 600, height: null },
  large: { width: 1200, height: null },
};

export default defineEventHandler(async (event) => {
  try {
    // 1. Récupérer et valider les données du formulaire
    const form = await readMultipartFormData(event);
    const file = form.find((f) => f.name === "image");
    const title = form.find((f) => f.name === "title")?.data.toString() || null;
    const description = form.find((f) => f.name === "description")?.data.toString() || null;
    const altText = form.find((f) => f.name === "altText")?.data.toString() || null;
    
    // L'ID de l'utilisateur connecté (à adapter selon votre système d'authentification)
    // Pour l'instant, nous utilisons une valeur fixe, mais cela devrait être remplacé par l'ID de l'utilisateur connecté
    const userId = 1; // Utilisateur avec l'ID 1
    
    // Validation de base
    if (!file || !file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image invalide.",
      });
    }
    
    // Validation de la taille
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: `La taille de l'image ne doit pas dépasser ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
      });
    }
    
    // 2. Valider le type de fichier
    const fileType = await fileTypeFromBuffer(file.data);
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_MIME_TYPES.join(", ")}`,
      });
    }
    
    // 3. Obtenir les dimensions de l'image
    const dimensions = sizeOf(file.data);
    if (!dimensions.width || !dimensions.height) {
      throw createError({
        statusCode: 400,
        statusMessage: "Impossible de déterminer les dimensions de l'image.",
      });
    }
    
    // 4. Générer un hash MD5 pour détecter les doublons
    const hash = createHash("md5").update(file.data).digest("hex");
    
    // Vérifier si une image avec ce hash existe déjà
    const existingImage = await Image.findOne({ where: { hash } });
    if (existingImage) {
      // Si une image avec le même hash existe, on peut soit la renvoyer
      // soit lancer une erreur. Ici, on renvoie l'URL existante.
      return {
        url: existingImage.path,
        id: existingImage.id,
        message: "Cette image existe déjà dans le système.",
        duplicate: true
      };
    }
    
    // 5. Créer la structure de répertoire basée sur la date (YYYY-MM)
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const uploadDir = resolve(process.cwd(), "public/uploads/images", dateFolder);
    await mkdir(uploadDir, { recursive: true });
    
    // 6. Générer un nom de fichier unique avec UUID
    const fileExt = extname(file.filename).toLowerCase();
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const filePath = join(uploadDir, uniqueFilename);
    const relativePath = `/uploads/images/${dateFolder}/${uniqueFilename}`;
    
    // 7. Enregistrer le fichier original
    await writeFile(filePath, file.data);
    
    // 8. Créer l'entrée dans la base de données
    const imageRecord = await Image.create({
      filename: uniqueFilename,
      originalFilename: file.filename,
      path: relativePath,
      size: file.data.length,
      width: dimensions.width,
      height: dimensions.height,
      format: fileType.ext,
      mimeType: fileType.mime,
      title,
      description,
      altText,
      hash,
      userId,
    });
    
    // 9. Créer le répertoire pour les variantes
    const variantsDir = join(dirname(filePath), "variants");
    await mkdir(variantsDir, { recursive: true });
    
    // 10. Générer et sauvegarder les variantes
    const variantPromises = [];
    const variantRecords = [];
    
    for (const [type, options] of Object.entries(VARIANTS)) {
      const variantFilename = `${type}_${uniqueFilename}`;
      const variantPath = join(variantsDir, variantFilename);
      const relativeVariantPath = `/uploads/images/${dateFolder}/variants/${variantFilename}`;
      
      // Traitement avec Sharp
      let transformer = sharp(file.data);
      
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
            format: type === "webp" ? "webp" : fileType.ext,
            type,
            imageId: imageRecord.id,
          });
          
          variantRecords.push(variantRecord);
        });
      
      variantPromises.push(processPromise);
    }
    
    // Attendre que toutes les variantes soient traitées
    await Promise.all(variantPromises);
    
    // 11. Retourner les informations de l'image
    return {
      id: imageRecord.id,
      url: relativePath,
      filename: uniqueFilename,
      width: dimensions.width,
      height: dimensions.height,
      variants: variantRecords.map(v => ({
        id: v.id,
        type: v.type,
        url: v.path,
        width: v.width,
        height: v.height,
      })),
    };
    
  } catch (error) {
    console.error("Erreur lors du traitement de l'image:", error);
    
    // Si l'erreur est déjà une erreur HTTP, la propager
    if (error.statusCode) {
      throw error;
    }
    
    // Sinon, créer une erreur 500
    throw createError({
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors du traitement de l'image.",
    });
  }
});
