/**
 * Endpoint pour tester l'état de l'authentification
 */
import { defineEventHandler, getCookie } from 'h3'
import { sessionDb, userDb, roleDb } from '../utils/mock-db.js'

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, "auth_token");
    
    if (!token) {
      return {
        authenticated: false,
        message: "Aucun token trouvé"
      };
    }
    
    const session = sessionDb.findByToken(token);
    if (!session) {
      return {
        authenticated: false,
        message: "Session invalide ou expirée"
      };
    }
    
    const user = userDb.findById(session.userId);
    if (!user) {
      return {
        authenticated: false,
        message: "Utilisateur non trouvé"
      };
    }
    
    const role = roleDb.findByPk(user.role_id);
    const userPermissions = role?.getPermissions() || [];
    
    return {
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: role?.name,
        permissions: userPermissions.map(p => p.name)
      },
      session: {
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    };
    
  } catch (error) {
    return {
      authenticated: false,
      error: error.message
    };
  }
});