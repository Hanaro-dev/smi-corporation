import { userDb } from '../../utils/mock-db.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("Données reçues:", body); // Log pour diagnostic
  const { email, password, username } = body;

  // Vérification simple des données
  if (!email || !password || !username) {
    throw createError({
      statusCode: 400,
      message: "Tous les champs sont requis",
    });
  }

  // Vérifier si l'email existe déjà
  const existingUser = userDb.findByEmail(email);
  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: "Cet email est déjà utilisé",
    });
  }

  // Créer un nouvel utilisateur dans notre base de données simulée
  const newUser = userDb.create({
    email,
    password, // En production, il faudrait hacher le mot de passe
    name: username, // Conversion de username vers name pour compatibilité avec le modèle
    permissions: ["view"], // permissions de base pour un nouvel utilisateur
  });

  // Renvoyer les données de l'utilisateur sans le mot de passe
  const userWithoutPassword = { ...newUser };
  delete userWithoutPassword.password;
  
  return {
    success: true,
    message: "Utilisateur enregistré avec succès",
    user: userWithoutPassword
  };
});