import { defineEventHandler, getCookie, H3Event } from 'h3';
import { userDb, sessionDb, roleDb } from '../../utils/mock-db.js';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Récupérer le token depuis le cookie
    const token = getCookie(event, "auth_token");
  
  if (!token) {
    return { user: null };
  }
  
  // Rechercher la session
  const session = sessionDb.findByToken(token);
  if (!session) {
    return { user: null };
  }
  
  // Rechercher l'utilisateur
  const user = await userDb.findById(session.userId);
  if (!user) {
    return { user: null };
  }
  
  // Récupérer le rôle et les permissions
  const role = roleDb.findByPk(user.role_id);
  
  // Retourner les informations de l'utilisateur sans mot de passe
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  
  // Ajouter le rôle avec ses permissions
  if (role) {
    userWithoutPassword.Role = {
      ...role,
      Permissions: role.getPermissions()
    };
  }
  
  // Mettre à jour le contexte de l'événement
  event.context.user = userWithoutPassword;
  
  return { 
    user: userWithoutPassword
  };
  
  } catch (error: any) {
    console.error('Erreur dans session.get.js:', error);
    return { user: null };
  }
});