import { userDb, sessionDb, roleDb, auditDb } from '../../utils/mock-db.js';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  // Vérification des paramètres requis
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: "Email et mot de passe requis",
    });
  }

  // Recherche de l'utilisateur par email
  const user = userDb.findByEmail(email);

  // Vérification des identifiants avec le mot de passe haché
  if (user && userDb.verifyPassword(password, user.password)) {
    // Récupérer le rôle et ses permissions
    const role = roleDb.findByPk(user.role_id);
    if (!role) {
      throw createError({
        statusCode: 500,
        message: "Erreur: rôle utilisateur non trouvé",
      });
    }

    // Générer un token JWT avec les informations utilisateur
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role_id: user.role_id,
        role: role.name
      },
      process.env.JWT_SECRET || "YOUR_FALLBACK_JWT_SECRET",
      { expiresIn: "24h" }
    );
    
    // Enregistrer la session avec durée de vie de 7 jours
    sessionDb.create(user.id, token, 7 * 24 * 60 * 60 * 1000);
    
    // Préparer la réponse utilisateur sans le mot de passe
    const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;
    
    // Journaliser la connexion
    auditDb.log(
      'login',
      'user',
      user.id,
      user.id,
      { 
        email: user.email,
        role: role.name,
        ip: event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress,
        userAgent: event.node.req.headers['user-agent']
      }
    );

    // Créer un cookie de session sécurisé
    setCookie(event, "auth_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 semaine
      sameSite: "strict",
      // secure: true, // Activer en production avec HTTPS
    });

    return {
      success: true,
      user: userWithoutPassword,
      token,
      expiresIn: 24 * 60 * 60 // 24 heures en secondes
    };
  }

  // Journaliser la tentative échouée
  if (user) {
    auditDb.log(
      'login_failed',
      'user',
      user.id,
      null,
      { 
        email,
        reason: 'wrong_password',
        ip: event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress,
        userAgent: event.node.req.headers['user-agent']
      }
    );
  } else {
    auditDb.log(
      'login_failed',
      'user',
      null,
      null,
      { 
        email,
        reason: 'user_not_found',
        ip: event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress,
        userAgent: event.node.req.headers['user-agent']
      }
    );
  }

  throw createError({
    statusCode: 401,
    message: "Identifiants invalides",
  });
});