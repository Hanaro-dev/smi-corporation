import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const file = form.find((f) => f.name === "image");

  if (!file || !file.filename || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image invalide.",
    });
  }

  const uploadDir = resolve(process.cwd(), "public/uploads/images");
  const fileName = `${Date.now()}_${file.filename}`;
  const filePath = join(uploadDir, fileName);

  try {
    // Créer le répertoire s'il n'existe pas
    await mkdir(uploadDir, { recursive: true });
    // Écrire le fichier
    await writeFile(filePath, file.data);
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Impossible de sauvegarder l'image.",
    });
  }

  // Retourner l'URL publique de l'image
  // Assurez-vous que le répertoire 'public/uploads' est servi statiquement par Nuxt
  // (c'est généralement le cas pour le répertoire 'public')
  return { url: `/uploads/images/${fileName}` };
});
