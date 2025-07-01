import { AuthService } from '../../services/auth-service.js';
import { validateUserLogin, checkRateLimit } from '../../utils/input-validation.js';
import { ValidationError } from '../../utils/error-handler.js';
import { userDb, roleDb, sessionDb, auditDb } from '../../utils/mock-db.js';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

export default defineEventHandler(async (event) => {
  const clientIP = getClientIP(event);
  
  // Rate limiting check
  if (!checkRateLimit(clientIP, 5, 60000)) {
    throw createError({
      statusCode: 429,
      message: "Trop de tentatives de connexion. Veuillez réessayer dans une minute.",
    });
  }

  const body = await readBody(event);
  const { redirect = "/" } = body;

  // Validate and sanitize input
  let validatedData;
  try {
    validatedData = validateUserLogin(body);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw createError({
        statusCode: 400,
        message: error.message,
      });
    }
    throw error;
  }

  const { email, password } = validatedData;

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
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );
    
    // Enregistrer la session avec durée de vie configurable
    sessionDb.create(user.id, token, config.auth.sessionMaxAge);
    
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
      maxAge: config.auth.cookieMaxAge,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
    });

    // Déterminer la redirection appropriée selon le rôle
    let redirectTo = redirect;
    if (role.name === 'admin') {
      redirectTo = "/admin";
    } else if (role.name === 'editor') {
      redirectTo = "/admin/pages";
    }

    return {
      success: true,
      user: userWithoutPassword,
      token,
      expiresIn: config.auth.cookieMaxAge,
      redirect: redirectTo
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