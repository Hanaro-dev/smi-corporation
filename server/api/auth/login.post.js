import { userDb, sessionDb } from '../../utils/mock-db.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  // Recherche de l'utilisateur par email
  const user = userDb.findByEmail(email);

  // Vérification des identifiants avec le mot de passe haché
  if (user && userDb.verifyPassword(password, user.password)) {
    // Créer un token fictif simple
    const token = `dev-token-${Date.now()}`;
    
    // Enregistrer la session
    sessionDb.create(user.id, token);
    
    // Stocker l'utilisateur dans la session
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    event.context.user = userWithoutPassword;

    // Créer un cookie de session
    setCookie(event, "auth_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 semaine
    });

    return {
      success: true,
      user: userWithoutPassword
    };
  }

  throw createError({
    statusCode: 401,
    message: "Identifiants invalides",
  });
});