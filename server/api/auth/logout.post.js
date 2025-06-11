import { sessionDb } from '../../utils/mock-db.js';

export default defineEventHandler(async (event) => {
  // Récupérer le token depuis le cookie
  const token = getCookie(event, "auth_token");
  
  if (token) {
    // Supprimer la session
    sessionDb.delete(token);
  }
  
  // Supprimer le cookie d'authentification
  deleteCookie(event, "auth_token", {
    path: "/",
  });
  
  // Supprimer l'utilisateur de la session
  event.context.user = null;
  
  return {
    success: true,
    message: "Déconnexion réussie"
  };
});