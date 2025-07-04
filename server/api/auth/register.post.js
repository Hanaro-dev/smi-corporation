import { userDb, auditDb } from '../../utils/mock-db.js';
import { validateUserRegistration, sanitizeInput, checkRateLimit } from '../../utils/input-validation.js';
import { ValidationError } from '../../utils/error-handler.js';
import { getClientIP } from '../../utils/api-middleware.js';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const clientIP = getClientIP(event);
  
  // Rate limiting pour l'inscription
  if (!checkRateLimit(clientIP, 3, 300000)) { // 3 tentatives par 5 minutes
    throw createError({
      statusCode: 429,
      message: "Trop de tentatives d'inscription. Veuillez réessayer dans 5 minutes.",
    });
  }

  const body = await readBody(event);
  
  // Validation et sanitisation des données
  let validatedData;
  try {
    validatedData = validateUserRegistration(body);
  } catch (error) {
    // Journaliser la tentative d'inscription échouée
    auditDb.log(
      'registration_failed',
      'user',
      null,
      null,
      { 
        reason: 'validation_error',
        ip: clientIP,
        userAgent: event.node.req.headers['user-agent'],
        error: error.message
      }
    );
    
    if (error instanceof ValidationError) {
      throw createError({
        statusCode: 400,
        message: "Données invalides",
      });
    }
    throw createError({
      statusCode: 400,
      message: "Erreur de validation",
    });
  }

  const { email, password, username } = validatedData;

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await userDb.findByEmail(email);
    if (existingUser) {
      // Journaliser la tentative avec email existant
      auditDb.log(
        'registration_failed',
        'user',
        null,
        null,
        { 
          email: sanitizeInput(email),
          reason: 'email_already_exists',
          ip: clientIP,
          userAgent: event.node.req.headers['user-agent']
        }
      );
      
      throw createError({
        statusCode: 400,
        message: "Un compte avec cet email existe déjà",
      });
    }

    // Hacher le mot de passe de manière sécurisée
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer un nouvel utilisateur avec mot de passe haché
    const newUser = await userDb.create({
      email: sanitizeInput(email),
      password: hashedPassword,
      name: sanitizeInput(username),
      role_id: 3, // Rôle "user" par défaut
    });

    // Journaliser l'inscription réussie
    auditDb.log(
      'registration_success',
      'user',
      newUser.id,
      null,
      { 
        email: sanitizeInput(email),
        name: sanitizeInput(username),
        ip: clientIP,
        userAgent: event.node.req.headers['user-agent']
      }
    );

    // Renvoyer les données de l'utilisateur sans le mot de passe
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    
    return {
      success: true,
      message: "Compte créé avec succès",
      user: userWithoutPassword
    };
  } catch (error) {
    // Journaliser l'erreur serveur
    auditDb.log(
      'registration_error',
      'user',
      null,
      null,
      { 
        ip: clientIP,
        userAgent: event.node.req.headers['user-agent'],
        error: error.message
      }
    );

    // Si c'est une erreur que nous avons déjà traitée, la relancer
    if (error.statusCode) {
      throw error;
    }

    // Erreur générique pour les erreurs non prévues
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la création du compte",
    });
  }
});