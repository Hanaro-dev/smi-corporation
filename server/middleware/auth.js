import { userDb, sessionDb } from '../utils/mock-db.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on utilise la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

export default defineEventHandler(async (event) => {
  const publicRoutes = [
    "/", // Page d'accueil
    "/auth/login",
    "/auth/register",
    "/api/auth/login", // Routes d'authentification
    "/api/auth/register",
    "/api/auth/logout",
    "/api/_auth/session", // Route pour vérifier la session
    "/favicon.ico", // Ressources statiques
    // Ajoutez d'autres routes publiques si nécessaire
  ];

  const requestUrl = event.node.req.url || "";
  const requestMethod = event.node.req.method || "";

  // Vérifier les routes qui commencent par certains préfixes (pour les icônes, etc.)
  if (requestUrl.startsWith('/api/_nuxt_icon/')) {
    return; // Permettre l'accès aux icônes sans authentification
  }

  // Rendre l'upload d'images public pour l'instant
  if (requestUrl === '/api/images' && requestMethod === 'POST') {
    console.log("[Auth Middleware] Skipping auth for /api/images POST");
    return;
  }

  // Vérifier si la route est publique
  if (publicRoutes.includes(requestUrl)) {
    console.log(`[Auth Middleware] Public route: ${requestUrl}`);
    return; // Ne pas vérifier l'authentification pour les routes publiques
  }

  // Si l'utilisateur est déjà dans le contexte, passer à la suite
  if (event.context.user) {
    console.log(`[Auth Middleware] Protected route: ${requestUrl}. User already in context.`);
    return;
  }

  // Sinon, vérifier le token d'authentification
  const token = getCookie(event, "auth_token");
  if (!token) {
    console.log(`[Auth Middleware] Protected route: ${requestUrl}. No auth token, throwing 401.`);
    throw createError({ statusCode: 401, message: "Non autorisé." });
  }

  // Vérifier si la session existe
  const session = sessionDb.findByToken(token);
  if (!session) {
    console.log(`[Auth Middleware] Protected route: ${requestUrl}. Invalid session, throwing 401.`);
    throw createError({ statusCode: 401, message: "Session invalide." });
  }

  // Récupérer l'utilisateur
  const user = userDb.findById(session.userId);
  if (!user) {
    console.log(`[Auth Middleware] Protected route: ${requestUrl}. User not found, throwing 401.`);
    throw createError({ statusCode: 401, message: "Utilisateur non trouvé." });
  }

  // Mettre l'utilisateur dans le contexte (sans mot de passe)
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  event.context.user = userWithoutPassword;

  console.log(`[Auth Middleware] Protected route: ${requestUrl}. User authenticated: ${user.name}`);
});
