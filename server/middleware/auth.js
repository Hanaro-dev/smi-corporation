import { userDb, sessionDb, roleDb } from '../utils/mock-db.js';
import { defineEventHandler, createError, getCookie } from 'h3';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

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
    "/api/csrf-token", // Route pour obtenir le token CSRF
    "/favicon.ico", // Ressources statiques
    "/_nuxt/", // Vite development files
    "/__nuxt_devtools__/", // DevTools
    // Ajoutez d'autres routes publiques si nécessaire
  ];

  const requestUrl = event.node.req.url || "";
  const requestMethod = event.node.req.method || "";

  // Vérifier les routes qui commencent par certains préfixes (pour les icônes, etc.)
  if (requestUrl.startsWith('/api/_nuxt_icon/')) {
    return; // Permettre l'accès aux icônes sans authentification
  }

  // Permettre l'accès aux pages publiques
  if (requestUrl.startsWith('/page/')) {
    return;
  }

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('/')) {
      return requestUrl.startsWith(route);
    }
    return requestUrl === route || requestUrl.startsWith(route + '?');
  });
  console.log(`[Auth Middleware] Checking URL: ${requestUrl}, isPublic: ${isPublicRoute}`);
  
  if (isPublicRoute) {
    console.log(`[Auth Middleware] Public route: ${requestUrl}`);
    return; // Ne pas vérifier l'authentification pour les routes publiques
  }

  // Si l'utilisateur est déjà dans le contexte, passer à la suite
  if (event.context.user) {
    console.log(`[Auth Middleware] Protected route: ${requestUrl}. User already in context.`);
    return;
  }

  // Vérifier le token d'authentification (cookie ou header)
  const token = getCookie(event, "auth_token") || 
                event.node.req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log(`[Auth Middleware] Protected route: ${requestUrl}. No auth token, throwing 401.`);
    throw createError({ 
      statusCode: 401, 
      message: "Authentification requise." 
    });
  }

  try {
    // Vérifier si la session existe dans notre stockage
    const session = sessionDb.findByToken(token);
    if (!session) {
      console.log(`[Auth Middleware] Protected route: ${requestUrl}. Invalid session, throwing 401.`);
      throw createError({ 
        statusCode: 401, 
        message: "Session invalide ou expirée." 
      });
    }

    // Vérifier la validité du token JWT
    let decodedToken;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token JWT invalide ou expiré, supprimer la session
      sessionDb.delete(token);
      throw createError({ 
        statusCode: 401, 
        message: "Token expiré ou invalide." 
      });
    }

    // Récupérer l'utilisateur
    const user = userDb.findById(session.userId);
    if (!user) {
      console.log(`[Auth Middleware] Protected route: ${requestUrl}. User not found, throwing 401.`);
      throw createError({ 
        statusCode: 401, 
        message: "Utilisateur non trouvé." 
      });
    }

    // Récupérer le rôle de l'utilisateur avec ses permissions
    const role = roleDb.findByPk(user.role_id);
    if (!role) {
      console.log(`[Auth Middleware] Protected route: ${requestUrl}. Role not found, throwing 500.`);
      throw createError({ 
        statusCode: 500, 
        message: "Rôle utilisateur non trouvé." 
      });
    }

    // Mettre l'utilisateur dans le contexte (sans mot de passe)
    const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;
    
    // Ajouter les informations de rôle et permissions directement dans le contexte
    event.context.user = userWithoutPassword;
    event.context.userRole = role;
    event.context.permissions = role.getPermissions();

    console.log(`[Auth Middleware] Protected route: ${requestUrl}. User authenticated: ${user.name} (Role: ${role.name})`);
  } catch (error) {
    // Log l'erreur pour les administrateurs sans exposer les détails
    console.error("Auth middleware error:", {
      url: requestUrl,
      method: requestMethod,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // En cas d'erreur non gérée, renvoyer une erreur générique
    throw createError({ 
      statusCode: error.statusCode || 401, 
      message: error.statusCode ? error.message : "Authentification requise" 
    });
  }
});
