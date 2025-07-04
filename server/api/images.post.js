import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join, dirname, extname } from "node:path";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import sizeOf from "image-size";
import { Image, ImageVariant } from "../models.js";
import { getCookie, getHeader, defineEventHandler, createError } from "../utils/http-utils.js";
import { getClientIP } from "../utils/ip-utils.js";
import { sessionDb, userDb, roleDb, auditDb } from '../utils/mock-db.js';
import { checkPermission } from "../utils/permission-utils.js";
import DOMPurify from "dompurify";
import { checkRateLimit, imageUploadRateLimit } from "../utils/rate-limiter.js";

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
    // 1. Vérification du rate limiting (avant authentification pour éviter les attaques)
    const clientIP = getClientIP(event) || 'unknown';
    const rateLimitResult = checkRateLimit(clientIP, imageUploadRateLimit);
    
    if (!rateLimitResult.allowed) {
      const errorMessage = rateLimitResult.blocked 
        ? `Trop de tentatives d'upload. Réessayez dans ${Math.ceil(rateLimitResult.timeUntilUnblock / 1000 / 60)} minutes.`
        : 'Limite d\'upload atteinte. Réessayez plus tard.';
      
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
    
    // 2. Récupérer et valider les données du formulaire
    const form = await readMultipartFormData(event);
    const file = form.find((f) => f.name === "image");
    const title = form.find((f) => f.name === "title")?.data.toString() || null;
    const description = form.find((f) => f.name === "description")?.data.toString() || null;
    const altText = form.find((f) => f.name === "altText")?.data.toString() || null;
    
    // Utiliser l'ID de l'utilisateur authentifié
    const userId = event.context.user.id;
    
    // Nettoyer et sanitiser les métadonnées
    const sanitizedTitle = title ? DOMPurify.sanitize(title.trim()) : null;
    const sanitizedDescription = description ? DOMPurify.sanitize(description.trim()) : null;
    const sanitizedAltText = altText ? DOMPurify.sanitize(altText.trim()) : null;
    
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
    
    // 2. Validation stricte du type de fichier (magic number + MIME type)
    const fileType = await fileTypeFromBuffer(file.data);
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_MIME_TYPES.join(", ")}`,
      });
    }
    
    // Vérification supplémentaire : l'extension du fichier doit correspondre au type détecté
    const detectedExt = fileType.ext;
    const providedExt = extname(file.filename).slice(1).toLowerCase();
    
    const validExtensions = {
      'jpeg': ['jpg', 'jpeg'],
      'png': ['png'],
      'gif': ['gif'],
      'webp': ['webp'],
      'svg': ['svg']
    };
    
    const expectedExts = validExtensions[detectedExt] || [detectedExt];
    if (!expectedExts.includes(providedExt)) {
      throw createError({
        statusCode: 400,
        statusMessage: "L'extension du fichier ne correspond pas au contenu détecté.",
      });
    }
    
    // Vérification spéciale pour les fichiers SVG (sécurité)
    if (fileType.mime === 'image/svg+xml') {
      const svgContent = file.data.toString('utf8');
      // Vérifier la présence de balises potentiellement dangereuses
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(svgContent)) {
          throw createError({
            statusCode: 400,
            statusMessage: "Le fichier SVG contient du contenu potentiellement dangereux.",
          });
        }
      }
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
      title: sanitizedTitle,
      description: sanitizedDescription,
      altText: sanitizedAltText,
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
    
    // 11. Enregistrer l'activité dans les logs d'audit
    await auditDb.create({
      userId: userId,
      action: 'image_upload',
      details: `Image uploadée: ${sanitizedTitle || file.filename} (${fileType.ext})`,
      ipAddress: getClientIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    });
    
    // 12. Retourner les informations de l'image
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
