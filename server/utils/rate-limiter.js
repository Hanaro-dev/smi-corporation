/**
 * Rate Limiter pour les uploads d'images et autres opérations sensibles
 */
import { setHeader, createError, getRequestIP } from 'h3';

// Map pour stocker les tentatives par IP
const attempts = new Map();

// Configuration par défaut
const DEFAULT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 10, // Maximum 10 tentatives par fenêtre
  blockDurationMs: 60 * 60 * 1000 // Blocage pendant 1 heure après dépassement
};

// Optimized cleanup - only run periodically instead of on every request
let lastCleanup = 0;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Nettoie les anciennes entrées du rate limiter (optimisé)
 */
const cleanupOldEntries = () => {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [ip, data] of attempts.entries()) {
    let shouldRemove = false;
    
    // Remove non-blocked entries outside window
    if (!data.blocked && now - data.firstAttempt > DEFAULT_CONFIG.windowMs) {
      shouldRemove = true;
    }
    // Remove blocked IPs after block duration
    else if (data.blocked && now - data.blockedAt > DEFAULT_CONFIG.blockDurationMs) {
      shouldRemove = true;
    }
    
    if (shouldRemove) {
      attempts.delete(ip);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`Rate limiter cleanup: removed ${removedCount} entries, ${attempts.size} remaining`);
  }
};

/**
 * Conditional cleanup - only runs if enough time has passed
 */
const conditionalCleanup = () => {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldEntries();
    lastCleanup = now;
  }
};

/**
 * Vérifie si une IP est limitée en débit
 * @param {string} ip - Adresse IP du client
 * @param {Object} config - Configuration personnalisée
 * @returns {Object} État du rate limiting
 */
export function checkRateLimit(ip, config = {}) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  
  // Nettoyer les anciennes entrées (optimisé)
  conditionalCleanup();
  
  // Récupérer ou créer l'entrée pour cette IP
  let ipData = attempts.get(ip);
  
  if (!ipData) {
    ipData = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockedAt: null
    };
    attempts.set(ip, ipData);
    
    return {
      allowed: true,
      remaining: settings.maxAttempts - 1,
      resetTime: now + settings.windowMs,
      blocked: false
    };
  }
  
  // Vérifier si l'IP est actuellement bloquée
  if (ipData.blocked) {
    const timeUntilUnblock = (ipData.blockedAt + settings.blockDurationMs) - now;
    return {
      allowed: false,
      remaining: 0,
      resetTime: ipData.blockedAt + settings.blockDurationMs,
      blocked: true,
      timeUntilUnblock: Math.max(0, timeUntilUnblock)
    };
  }
  
  // Vérifier si nous sommes dans une nouvelle fenêtre de temps
  if (now - ipData.firstAttempt > settings.windowMs) {
    // Nouvelle fenêtre, réinitialiser le compteur
    ipData.count = 1;
    ipData.firstAttempt = now;
    ipData.lastAttempt = now;
    
    return {
      allowed: true,
      remaining: settings.maxAttempts - 1,
      resetTime: now + settings.windowMs,
      blocked: false
    };
  }
  
  // Incrémenter le compteur
  ipData.count++;
  ipData.lastAttempt = now;
  
  // Vérifier si la limite est dépassée
  if (ipData.count > settings.maxAttempts) {
    ipData.blocked = true;
    ipData.blockedAt = now;
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + settings.blockDurationMs,
      blocked: true,
      timeUntilUnblock: settings.blockDurationMs
    };
  }
  
  return {
    allowed: true,
    remaining: settings.maxAttempts - ipData.count,
    resetTime: ipData.firstAttempt + settings.windowMs,
    blocked: false
  };
}

/**
 * Middleware de rate limiting pour les routes Nuxt
 * @param {Object} options - Configuration du rate limiting
 * @returns {Function} Middleware function
 */
export function rateLimitMiddleware(options = {}) {
  return (event) => {
    const ip = getRequestIP(event) || 'unknown';
    const result = checkRateLimit(ip, options);
    
    if (!result.allowed) {
      const errorMessage = result.blocked 
        ? `Trop de tentatives. Réessayez dans ${Math.ceil(result.timeUntilUnblock / 1000 / 60)} minutes.`
        : 'Limite de débit atteinte. Réessayez plus tard.';
      
      throw createError({
        statusCode: 429,
        statusMessage: errorMessage,
        headers: {
          'X-RateLimit-Limit': options.maxAttempts || DEFAULT_CONFIG.maxAttempts,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'Retry-After': Math.ceil((result.timeUntilUnblock || 60000) / 1000)
        }
      });
    }
    
    // Ajouter les headers de rate limiting
    setHeader(event, 'X-RateLimit-Limit', options.maxAttempts || DEFAULT_CONFIG.maxAttempts);
    setHeader(event, 'X-RateLimit-Remaining', result.remaining);
    setHeader(event, 'X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  };
}

/**
 * Configuration spécialisée pour les uploads d'images
 */
export const imageUploadRateLimit = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxAttempts: 5, // Maximum 5 uploads par 10 minutes
  blockDurationMs: 30 * 60 * 1000 // Blocage pendant 30 minutes
};

/**
 * Configuration spécialisée pour les suppressions
 */
export const imageDeletionRateLimit = {
  windowMs: 5 * 60 * 1000, // 5 minutes  
  maxAttempts: 10, // Maximum 10 suppressions par 5 minutes
  blockDurationMs: 15 * 60 * 1000 // Blocage pendant 15 minutes
};

/**
 * Réinitialise le rate limiting pour une IP (utile pour les tests)
 * @param {string} ip - Adresse IP à réinitialiser
 */
export function resetRateLimit(ip) {
  if (ip) {
    attempts.delete(ip);
  } else {
    // Reset all if no IP specified
    attempts.clear();
    lastCleanup = Date.now();
  }
}

/**
 * Force immediate cleanup (useful for maintenance)
 */
export function forceCleanup() {
  cleanupOldEntries();
  lastCleanup = Date.now();
}

// Periodic cleanup to prevent memory leaks
const cleanupTimer = setInterval(() => {
  cleanupOldEntries();
  lastCleanup = Date.now();
}, CLEANUP_INTERVAL);

// Cleanup on process exit
process.on('exit', () => clearInterval(cleanupTimer));
process.on('SIGTERM', () => clearInterval(cleanupTimer));
process.on('SIGINT', () => clearInterval(cleanupTimer));

/**
 * Obtient les statistiques actuelles du rate limiting
 * @returns {Object} Statistiques
 */
export function getRateLimitStats() {
  // Force cleanup for accurate stats
  cleanupOldEntries();
  lastCleanup = Date.now();
  
  const stats = {
    totalTrackedIPs: attempts.size,
    blockedIPs: 0,
    activeConnections: 0,
    memoryUsage: attempts.size * 150 // Rough estimate per entry
  };
  
  for (const [ip, data] of attempts.entries()) {
    if (data.blocked) {
      stats.blockedIPs++;
    } else {
      stats.activeConnections++;
    }
  }
  
  return stats;
}