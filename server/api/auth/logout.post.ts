import { sessionDb, auditDb } from '../../utils/mock-db.js';
import auth from '../../middleware/auth.js';

import type { AuthenticatedEvent, ApiResponse, User } from '../../types/index.js';

export default defineEventHandler(async (event: AuthenticatedEvent) => {
  try {
    // Récupérer le token depuis le cookie ou l'en-tête Authorization
    const token = getCookie(event, "auth_token") || 
                  event.node.req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return {
        success: true,
        message: "Aucune session active"
      };
    }
    
    // Récupérer la session pour identifier l'utilisateur
    const session = sessionDb.findByToken(token);
    
    // Si on a une session valide et un utilisateur identifié
    if (session && session.userId) {
      // Journaliser la déconnexion
      auditDb.log(
        'logout',
        'user',
        session.userId,
        session.userId,
        { 
          ip: event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress,
          userAgent: event.node.req.headers['user-agent']
        }
      );
      
      // Supprimer la session
      sessionDb.delete(token);
    }
    
    // Supprimer le cookie d'authentification
    deleteCookie(event, "auth_token", {
      path: "/",
      httpOnly: true,
      sameSite: "strict"
    });
    
    // Supprimer l'utilisateur et les informations de rôle du contexte
    event.context.user = null;
    event.context.userRole = null;
    event.context.permissions = null;
    
    return {
      success: true,
      message: "Déconnexion réussie"
    };
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error);
    
    // Toujours supprimer le cookie même en cas d'erreur
    deleteCookie(event, "auth_token", {
      path: "/",
      httpOnly: true,
      sameSite: "strict"
    });
    
    return {
      success: true, // On considère que c'est un succès même si la session n'a pas pu être supprimée
      message: "Déconnexion effectuée"
    };
  }
});