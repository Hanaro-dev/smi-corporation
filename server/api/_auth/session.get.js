import { userDb, sessionDb } from '../../utils/mock-db.js';

export default defineEventHandler(async (event) => {
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
  const user = userDb.findById(session.userId);
  if (!user) {
    return { user: null };
  }
  
  // Retourner les informations de l'utilisateur sans mot de passe
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  
  // Mettre à jour le contexte de l'événement
  event.context.user = userWithoutPassword;
  
  return { 
    user: userWithoutPassword
  };
});