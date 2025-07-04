/**
 * Composable pour la gestion du BBCode personnalisé - SMI Corporation
 * 
 * Ce composable fournit un système BBCode étendu avec des tags personnalisés
 * pour gérer du contenu riche et interactif dans l'application CMS.
 * 
 * Fonctionnalités principales :
 * - Tags BBCode personnalisés (orgchart, columns, callout, gallery, etc.)
 * - Validation et parsing sécurisé du contenu
 * - Gestion des permissions par type de page
 * - Intégration avec DOMPurify pour la sécurité
 * - Support de la configuration contextuelle
 * 
 * @author SMI Corporation Dev Team
 * @version 1.0.0
 */

// === IMPORTS ===
import bbcode2html from 'bbcode-to-html'; // Parser BBCode standard
import DOMPurify from 'dompurify';        // Sécurisation XSS

export const useBBCode = () => {
  /**
   * Définition des BBCodes personnalisés disponibles
   * Chaque tag contient sa configuration, description et exemple d'utilisation
   */
  const customBBCodes = {
    // === COMPOSANTS D'ENTREPRISE ===
    
    /**
     * Organigramme - Affiche des structures hiérarchiques d'organisation
     * Utilise l'API /api/organigrammes pour récupérer les données
     * Rendu avec une structure HTML responsive
     */
    orgchart: {
      tag: 'orgchart',
      description: 'Afficher un organigramme interactif avec hiérarchie',
      syntax: '[orgchart id="1"]',
      component: 'OrgChart',
      example: '[orgchart id="direction-generale"]'
    },
    
    // === MISE EN PAGE ET STRUCTURE ===
    
    /**
     * Colonnes - Crée des layouts en colonnes responsives
     * Utilise CSS Grid pour une mise en page moderne
     * Support de 1 à 6 colonnes avec adaptation mobile
     */
    columns: {
      tag: 'columns',
      description: 'Créer un layout en colonnes responsive (1-6 colonnes)',
      syntax: '[columns=2]contenu[/columns]',
      component: 'ColumnLayout',
      example: '[columns=3]Colonne 1[br]Texte pour la première colonne[/columns]'
    },
    
    /**
     * Callout - Boîtes d'information colorées avec icônes
     * Types disponibles : info, warning, error, success
     * Utilise TailwindCSS pour le styling responsive
     */
    callout: {
      tag: 'callout',
      description: 'Encadré d\'information avec style contextuel (info, warning, error, success)',
      syntax: '[callout type="info"]texte[/callout]',
      component: 'CalloutBox',
      example: '[callout type="warning"]Attention : Cette fonctionnalité est en bêta[/callout]'
    },
    
    // === GESTION MÉDIAS ===
    
    /**
     * Galerie - Affichage d'images en grille responsive
     * Récupère les images via l'API /api/images
     * Support du lazy loading et des effets hover
     */
    gallery: {
      tag: 'gallery',
      description: 'Galerie d\'images responsive avec lazy loading',
      syntax: '[gallery ids="1,2,3"]',
      component: 'ImageGallery',
      example: '[gallery ids="12,15,18,22"]'
    },
    
    // === DONNÉES DYNAMIQUES ===
    
    /**
     * Informations utilisateur - Affiche des données de l'utilisateur connecté
     * Récupère les données via l'API de session
     * Champs disponibles : name, email, role, etc.
     */
    userinfo: {
      tag: 'userinfo',
      description: 'Affiche les informations de l\'utilisateur connecté (name, email, role)',
      syntax: '[userinfo field="name"]',
      component: 'UserInfo',
      example: '[userinfo field="email"]'
    },
    
    // === NAVIGATION ET INTERFACE ===
    
    /**
     * Breadcrumb - Fil d'ariane personnalisé basé sur l'URL
     * Généré automatiquement à partir de la route courante
     * Support des liens et de la hiérarchie de navigation
     */
    breadcrumb: {
      tag: 'breadcrumb',
      description: 'Fil d\'ariane personnalisé généré automatiquement',
      syntax: '[breadcrumb]',
      component: 'CustomBreadcrumb',
      example: '[breadcrumb]'
    }
  };

  /**
   * Configuration BBCode étendue - Mapping des tags vers les fonctions de rendu HTML
   * Combine les tags BBCode standards avec nos extensions personnalisées
   * Utilise des closures pour gérer les attributs et paramètres
   */
  const bbcodeConfig = {
    // === TAGS BBCODE STANDARDS ===
    // Hérite de tous les tags par défaut (b, i, u, url, img, etc.)
    ...bbcode2html.defaultTags,
    
    // === EXTENSIONS PERSONNALISÉES SMI CORPORATION ===
    /**
     * Tag Orgchart - Génère un conteneur pour l'organigramme
     * Le traitement dynamique est fait côté client dans BBCodeRenderer
     */
    orgchart: {
      type: 'tag',
      open: (attr) => `<div class="orgchart-wrapper" data-id="${attr.default || ''}">`,
      close: '</div>'
    },
    
    /**
     * Tag Columns - Crée un layout CSS Grid responsive
     * Adaptation automatique sur mobile (toujours 1 colonne < 768px)
     */
    columns: {
      type: 'tag',
      open: (attr) => {
        const cols = parseInt(attr.default || '2');
        const validCols = Math.min(Math.max(cols, 1), 6); // Limite entre 1 et 6
        return `<div class="grid grid-cols-1 md:grid-cols-${validCols} gap-4 my-4">`;
      },
      close: '</div>'
    },
    
    /**
     * Tag Callout - Boîte d'information styleée avec thème sombre
     * Support complète du dark mode via classes TailwindCSS
     */
    callout: {
      type: 'tag',
      open: (attr) => {
        const type = attr.type || 'info';
        const typeClasses = {
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
          error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        };
        return `<div class="callout border-l-4 p-4 rounded-r-lg my-4 ${typeClasses[type] || typeClasses.info}">`;
      },
      close: '</div>'
    },
    
    /**
     * Tag Gallery - Conteneur pour galerie d'images
     * Le rendu des images est géré dynamiquement par BBCodeRenderer
     */
    gallery: {
      type: 'tag',
      open: (attr) => `<div class="image-gallery" data-ids="${attr.ids || ''}">`,
      close: '</div>'
    },
    
    /**
     * Tag UserInfo - Placeholder pour informations utilisateur
     * Résolution dynamique via l'API de session
     */
    userinfo: {
      type: 'tag',
      open: (attr) => `<span class="user-info font-medium text-blue-600 dark:text-blue-400" data-field="${attr.field || 'name'}">`,
      close: '</span>'
    },
    
    /**
     * Tag Breadcrumb - Navigation contextuelle
     * Génération automatique basée sur l'URL courante
     */
    breadcrumb: {
      type: 'tag',
      open: () => '<nav class="custom-breadcrumb text-sm text-gray-600 dark:text-gray-400 my-2">',
      close: '</nav>'
    }
  };

  /**
   * Convertit le contenu BBCode en HTML sécurisé
   * 
   * @param {string} bbcodeText - Le contenu BBCode à parser
   * @param {Array} enabledTags - Liste des tags autorisés pour cette page
   * @returns {string} HTML sécurisé prêt pour l'affichage
   */
  const parseCustomBBCode = (bbcodeText, enabledTags = []) => {
    // Validation d'entrée
    if (!bbcodeText || typeof bbcodeText !== 'string') return '';
    
    /**
     * Filtrage des tags selon les permissions de la page
     * Les tags standards (b, i, u, url, etc.) sont toujours autorisés
     * Seuls les tags personnalisés sont soumis à restriction
     */
    const allowedTags = enabledTags.length > 0 
      ? Object.fromEntries(
          Object.entries(bbcodeConfig).filter(([key]) => 
            enabledTags.includes(key) || !customBBCodes[key] // Autoriser les tags standards
          )
        )
      : bbcodeConfig;
    
    try {
      // Configuration du parser BBCode
      const html = bbcode2html.process({
        text: bbcodeText,
        removeMisalignedTags: true, // Nettoyer les tags mal formés
        addInLineBreaks: true,      // Conserver les retours à la ligne
        tags: allowedTags
      });
      
      /**
       * Nettoyage sécurisé avec DOMPurify
       * Configuration permissive pour nos éléments personnalisés
       * tout en maintenant la sécurité contre XSS
       */
      return DOMPurify.sanitize(html, {
        ADD_TAGS: ['div', 'span', 'nav'], // Éléments HTML supplémentaires autorisés
        ADD_ATTR: ['data-id', 'data-ids', 'data-field', 'class'], // Attributs personnalisés
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // URLs sécurisées
      });
    } catch (error) {
      console.error('Erreur lors du parsing BBCode:', error);
      // En cas d'erreur, retourner le texte original échappé
      return DOMPurify.sanitize(bbcodeText, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
  };

  /**
   * Détermine les BBCodes autorisés selon le type de page
   * 
   * @param {string} pageType - Type de page (default, admin, public, restricted)
   * @returns {Array} Liste des tags BBCode autorisés
   */
  const getAvailableBBCodes = (pageType = 'default') => {
    /**
     * Configuration des permissions par type de page
     * - default: Tags de base pour les pages standards
     * - admin: Accès complet à tous les tags (interface d'administration)
     * - public: Tags sûrs pour les pages publiques
     * - restricted: Tags spéciaux pour les pages sensibles
     */
    const pageConfigs = {
      default: ['orgchart', 'columns', 'callout', 'gallery'], // Pages standards
      admin: Object.keys(customBBCodes),                      // Accès complet pour les admins
      public: ['columns', 'callout', 'gallery'],              // Sécurisé pour le public
      restricted: ['userinfo', 'breadcrumb']                  // Informations sensibles uniquement
    };
    
    const allowedTags = pageConfigs[pageType] || pageConfigs.default;
    
    // Log pour le débogage en mode développement
    if (import.meta.dev) {
      console.log(`BBCode: Type de page '${pageType}' -> Tags autorisés:`, allowedTags);
    }
    
    return allowedTags;
  };

  /**
   * Valide le contenu BBCode avant sauvegarde
   * Vérifie la syntaxe, les permissions et la cohérence
   * 
   * @param {string} bbcodeText - Contenu à valider
   * @param {Array} allowedTags - Tags autorisés pour cette page
   * @returns {Object} Résultat de validation avec erreurs éventuelles
   */
  const validateBBCode = (bbcodeText, allowedTags = []) => {
    const errors = [];
    const warnings = [];
    const usedTags = [];
    
    // Validation d'entrée
    if (!bbcodeText || typeof bbcodeText !== 'string') {
      return { isValid: true, errors: [], warnings: [], usedTags: [] };
    }
    
    /**
     * Regex améliorée pour capturer tous les types de tags BBCode
     * Capture les tags ouvrants et fermants avec leurs attributs
     */
    const tagRegex = /\[(\/?)(\w+)(?:=([^\]]*)|\s+([^\]]*))?\]/g;
    let match;
    const openTags = [];
    
    while ((match = tagRegex.exec(bbcodeText)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2];
      const attributes = match[3] || match[4];
      
      if (!isClosing) {
        usedTags.push(tagName);
        
        // Vérifier si le tag est autorisé
        if (allowedTags.length > 0 && !allowedTags.includes(tagName) && customBBCodes[tagName]) {
          errors.push(`Tag '[${tagName}]' non autorisé sur cette page (type: ${getPageTypeFromTags(allowedTags)})`);
        }
        
        // Vérifier si le tag existe
        if (!bbcodeConfig[tagName]) {
          errors.push(`Tag '[${tagName}]' non reconnu. Tags disponibles: ${Object.keys(customBBCodes).join(', ')}`);
        }
        
        // Validation spécifique par tag
        if (customBBCodes[tagName]) {
          const tagValidation = validateSpecificTag(tagName, attributes);
          if (!tagValidation.isValid) {
            errors.push(...tagValidation.errors);
          }
          warnings.push(...tagValidation.warnings || []);
        }
        
        openTags.push(tagName);
      } else {
        // Vérifier l'appariement des tags fermants
        const lastOpenTag = openTags.pop();
        if (lastOpenTag !== tagName) {
          errors.push(`Tag '[/${tagName}]' ne correspond pas au tag ouvert '[${lastOpenTag}]'`);
        }
      }
    }
    
    // Vérifier les tags non fermés
    if (openTags.length > 0) {
      warnings.push(`Tags non fermés détectés: [${openTags.join('], [')}]`);
    }
    
    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings,
      usedTags: [...new Set(usedTags)] // Supprimer les doublons
    };
  };

  /**
   * Validation spécifique par type de tag
   * Chaque tag peut avoir ses propres règles de validation
   */
  const validateSpecificTag = (tagName, attributes) => {
    const errors = [];
    const warnings = [];
    
    switch (tagName) {
      case 'orgchart':
        if (!attributes) {
          errors.push('Le tag orgchart nécessite un attribut id');
        }
        break;
        
      case 'gallery':
        if (!attributes || !attributes.includes('ids=')) {
          errors.push('Le tag gallery nécessite un attribut ids avec une liste d\'identifiants');
        }
        break;
        
      case 'columns':
        if (attributes) {
          const cols = parseInt(attributes);
          if (isNaN(cols) || cols < 1 || cols > 6) {
            warnings.push('Le nombre de colonnes doit être entre 1 et 6');
          }
        }
        break;
        
      case 'callout':
        if (attributes && attributes.includes('type=')) {
          const type = attributes.match(/type="?([^"\s]+)"?/)?.[1];
          if (type && !['info', 'warning', 'error', 'success'].includes(type)) {
            warnings.push('Type de callout non reconnu. Utilisez: info, warning, error, success');
          }
        }
        break;
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  };
  
  /**
   * Détermine le type de page à partir des tags autorisés
   */
  const getPageTypeFromTags = (allowedTags) => {
    if (allowedTags.length === Object.keys(customBBCodes).length) return 'admin';
    if (allowedTags.includes('userinfo')) return 'restricted';
    if (!allowedTags.includes('orgchart')) return 'public';
    return 'default';
  };
  
  /**
   * Génère la documentation d'aide pour l'éditeur BBCode
   * Retourne les informations formatées pour l'interface utilisateur
   * 
   * @param {Array} allowedTags - Tags disponibles pour cette page
   * @returns {Array} Documentation formatée des tags
   */
  const getBBCodeHelp = (allowedTags = []) => {
    // Filtrer les tags selon les permissions
    const availableTags = allowedTags.length > 0 
      ? Object.entries(customBBCodes).filter(([key]) => allowedTags.includes(key))
      : Object.entries(customBBCodes);
    
    // Formatter la documentation pour l'interface
    return availableTags.map(([key, config]) => ({
      tag: key,
      description: config.description,
      syntax: config.syntax,
      example: config.example || config.syntax,
      component: config.component,
      category: getCategoryFromTag(key)
    }));
  };
  
  /**
   * Classe les tags par catégorie pour l'organisation de l'aide
   */
  const getCategoryFromTag = (tagName) => {
    const categories = {
      orgchart: 'Entreprise',
      columns: 'Mise en page',
      callout: 'Mise en page', 
      gallery: 'Médias',
      userinfo: 'Données',
      breadcrumb: 'Navigation'
    };
    return categories[tagName] || 'Autre';
  };

  // === API PUBLIQUE DU COMPOSABLE ===
  return {
    // Configuration
    customBBCodes,
    
    // Fonctions principales
    parseCustomBBCode,      // Conversion BBCode -> HTML
    getAvailableBBCodes,    // Récupérer les tags autorisés
    validateBBCode,         // Validation avant sauvegarde
    getBBCodeHelp,          // Documentation pour l'éditeur
    
    // Utilitaires
    validateSpecificTag,    // Validation spécifique par tag
    getCategoryFromTag      // Classification des tags
  };
};