/**
 * Utilities for slug generation and validation with TypeScript support
 * @file slug-utils.js
 */

/**
 * @typedef {Object} SlugOptions
 * @property {number} [maxLength=100] - Maximum length of the slug
 * @property {string} [separator='-'] - Separator character
 * @property {boolean} [lowercase=true] - Convert to lowercase
 * @property {boolean} [removeSpecialChars=true] - Remove special characters
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the slug is valid
 * @property {string[]} errors - Array of validation errors
 */

/**
 * @typedef {Function} ExistenceChecker
 * @param {string} slug - Slug to check
 * @returns {Promise<boolean>} Whether the slug exists
 */

/**
 * Génère un slug sécurisé et SEO-friendly à partir d'un titre
 * @param {string} title - Le titre à convertir en slug
 * @param {Object} options - Options de génération
 * @returns {string} Le slug généré
 */
export function generateSlug(title, options = {}) {
  if (!title || typeof title !== 'string') {
    throw new Error('Le titre est requis pour générer un slug');
  }

  const {
    maxLength = 100,
    separator = '-',
    lowercase = true,
    removeSpecialChars = true
  } = options;

  // Use modern Intl.Collator for better performance and Unicode support
  const normalizedTitle = title.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  let slug = normalizedTitle;

  // Convertir en minuscules si demandé
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Remplacer les espaces et caractères spéciaux par le séparateur
  if (removeSpecialChars) {
    // Garder seulement les lettres, chiffres et tirets
    slug = slug.replace(/[^a-z0-9\-]/g, separator);
  } else {
    // Remplacer seulement les espaces
    slug = slug.replace(/\s+/g, separator);
  }

  // Nettoyer les séparateurs multiples et en début/fin
  slug = slug
    .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Séparateurs multiples
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), ''); // Début/fin

  // Limiter la longueur
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // S'assurer qu'on ne coupe pas au milieu d'un mot
    const lastSeparator = slug.lastIndexOf(separator);
    if (lastSeparator > maxLength * 0.8) {
      slug = slug.substring(0, lastSeparator);
    }
  }

  // Vérifier que le slug final n'est pas vide
  if (!slug) {
    slug = 'page';
  }

  return slug;
}

/**
 * Valide un slug selon les règles SEO
 * @param {string} slug - Le slug à valider
 * @returns {Object} Résultat de validation avec isValid et errors
 */
export function validateSlug(slug) {
  const errors = [];

  if (!slug || typeof slug !== 'string') {
    errors.push('Le slug est requis');
    return { isValid: false, errors };
  }

  const trimmedSlug = slug.trim();

  // Vérifications de base
  if (trimmedSlug.length === 0) {
    errors.push('Le slug ne peut pas être vide');
  }

  if (trimmedSlug.length > 100) {
    errors.push('Le slug ne peut pas dépasser 100 caractères');
  }

  if (trimmedSlug.length < 2) {
    errors.push('Le slug doit contenir au moins 2 caractères');
  }

  // Vérifier le format (lettres minuscules, chiffres, tirets)
  if (!/^[a-z0-9\-]+$/.test(trimmedSlug)) {
    errors.push('Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets');
  }

  // Vérifier qu'il ne commence/finit pas par un tiret
  if (trimmedSlug.startsWith('-') || trimmedSlug.endsWith('-')) {
    errors.push('Le slug ne peut pas commencer ou finir par un tiret');
  }

  // Vérifier qu'il n'y a pas de tirets consécutifs
  if (trimmedSlug.includes('--')) {
    errors.push('Le slug ne peut pas contenir de tirets consécutifs');
  }

  // Mots réservés à éviter - utilisation d'un Set pour de meilleures performances
  const reservedWords = new Set([
    'admin', 'api', 'www', 'ftp', 'mail', 'email', 'blog', 'shop',
    'store', 'news', 'about', 'contact', 'help', 'support', 'login',
    'register', 'signin', 'signup', 'logout', 'dashboard', 'profile',
    'settings', 'config', 'null', 'undefined', 'true', 'false',
    // Ajout de mots réservés supplémentaires
    'home', 'index', 'search', 'static', 'assets', 'public', 'private',
    'secure', 'auth', 'oauth', 'token', 'session', 'cache', 'temp',
    'test', 'dev', 'prod', 'staging', 'beta', 'alpha', 'demo'
  ]);

  if (reservedWords.has(trimmedSlug)) {
    errors.push('Ce slug est un mot réservé et ne peut pas être utilisé');
  }

  // Vérifier qu'il ne ressemble pas à un fichier
  if (/\.(html|htm|php|asp|jsp|xml|json|css|js|jpg|jpeg|png|gif|pdf|doc|docx)$/i.test(trimmedSlug)) {
    errors.push('Le slug ne peut pas ressembler à un nom de fichier');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Génère un slug unique en ajoutant un suffixe numérique si nécessaire
 * @param {string} baseSlug - Le slug de base
 * @param {ExistenceChecker} checkExistence - Fonction async qui vérifie si le slug existe
 * @param {number} [maxAttempts=100] - Nombre maximum de tentatives
 * @returns {Promise<string>} Le slug unique
 */
export async function generateUniqueSlug(baseSlug, checkExistence, maxAttempts = 100) {
  if (!baseSlug || typeof baseSlug !== 'string') {
    throw new Error('Base slug is required and must be a string');
  }
  
  if (typeof checkExistence !== 'function') {
    throw new Error('checkExistence must be a function');
  }
  
  let slug = baseSlug;
  let attempt = 0;

  try {
    while (await checkExistence(slug) && attempt < maxAttempts) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    if (attempt >= maxAttempts) {
      // Fallback avec timestamp pour garantir l'unicité
      const timestamp = Date.now().toString(36); // Base 36 for shorter string
      slug = `${baseSlug}-${timestamp}`;
    }

    return slug;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    // Fallback sécurisé avec timestamp
    return `${baseSlug}-${Date.now().toString(36)}`;
  }
}

/**
 * Nettoie et optimise un slug existant
 * @param {string} slug - Le slug à nettoyer
 * @returns {string} Le slug nettoyé
 */
export function cleanSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return generateSlug(slug, {
    maxLength: 100,
    separator: '-',
    lowercase: true,
    removeSpecialChars: true
  });
}