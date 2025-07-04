import { AuthService } from '../../services/auth-service.js';
import { validateUserLogin } from '../../utils/input-validation.js';
import { checkRateLimit } from '../../utils/rate-limiter.js';
import { ValidationError } from '../../utils/error-handler.js';

export default defineEventHandler(async (event) => {
  const clientIP = getClientIP(event);
  
  // Rate limiting check
  const rateLimitResult = checkRateLimit(clientIP, { maxAttempts: 5, windowMs: 60000 });
  if (!rateLimitResult.allowed) {
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
  const userAgent = event.node.req.headers['user-agent'] || 'Unknown';

  try {
    // Use authentication service
    const authResult = await AuthService.authenticate(
      email, 
      password, 
      clientIP, 
      userAgent
    );

    // Create secure session cookie
    setCookie(event, "auth_token", authResult.token, {
      httpOnly: true,
      path: "/",
      maxAge: authResult.expiresIn,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
    });

    // Use custom redirect if provided, otherwise use role-based redirect
    const finalRedirect = redirect !== "/" ? redirect : authResult.redirect;

    return {
      ...authResult,
      redirect: finalRedirect
    };

  } catch (error) {
    if (error instanceof ValidationError) {
      throw createError({
        statusCode: 401,
        message: error.message,
      });
    }
    
    console.error('Login endpoint error:', error);
    throw createError({
      statusCode: 500,
      message: "Erreur interne du serveur",
    });
  }
});