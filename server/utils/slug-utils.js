/**
 * Utilities for slug generation and validation
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

  let slug = title.trim();

  // Remplacer les caractères accentués par leurs équivalents non accentués
  const accents = {
    'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ã': 'a',
    'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e',
    'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i',
    'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'õ': 'o',
    'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u',
    'ñ': 'n', 'ç': 'c', 'ß': 'ss',
    'æ': 'ae', 'œ': 'oe'
  };

  // Appliquer les remplacements d'accents
  Object.keys(accents).forEach(accent => {
    const regex = new RegExp(accent, 'g');
    slug = slug.replace(regex, accents[accent]);
    // Version majuscule
    slug = slug.replace(new RegExp(accent.toUpperCase(), 'g'), accents[accent].toUpperCase());
  });

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

  // Mots réservés à éviter
  const reservedWords = [
    'admin', 'api', 'www', 'ftp', 'mail', 'email', 'blog', 'shop',
    'store', 'news', 'about', 'contact', 'help', 'support', 'login',
    'register', 'signin', 'signup', 'logout', 'dashboard', 'profile',
    'settings', 'config', 'null', 'undefined', 'true', 'false'
  ];

  if (reservedWords.includes(trimmedSlug)) {
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
 * @param {Function} checkExistence - Fonction async qui vérifie si le slug existe
 * @param {number} maxAttempts - Nombre maximum de tentatives
 * @returns {Promise<string>} Le slug unique
 */
export async function generateUniqueSlug(baseSlug, checkExistence, maxAttempts = 100) {
  let slug = baseSlug;
  let attempt = 0;

  while (await checkExistence(slug) && attempt < maxAttempts) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  if (attempt >= maxAttempts) {
    // Fallback avec timestamp
    slug = `${baseSlug}-${Date.now()}`;
  }

  return slug;
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