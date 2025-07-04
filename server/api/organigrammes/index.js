import { defineEventHandler, createError, getQuery, readBody, getCookie, getClientIP, getHeader } from "h3";
import { Organigramme, Employee, User, sequelize } from "../../models.js";
import { Op } from "sequelize";
import { sessionDb, userDb, roleDb, auditDb, organigrammeDb, employeeDb } from '../../utils/mock-db.js';
import { checkPermission } from "../../utils/permission-utils.js";
import DOMPurify from "dompurify";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on utilise la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

export default defineEventHandler(async (event) => {
  try {
    // Authentification obligatoire pour tous les endpoints d'organigrammes
    const token = getCookie(event, "auth_token");
    
    if (!token) {
      throw createError({ statusCode: 401, message: "Token d'authentification requis." });
    }
    
    // Rechercher la session
    const session = sessionDb.findByToken(token);
    if (!session) {
      throw createError({ statusCode: 401, message: "Session invalide." });
    }
    
    // Rechercher l'utilisateur
    const user = await userDb.findById(session.userId);
    if (!user) {
      throw createError({ statusCode: 401, message: "Utilisateur non trouvé." });
    }

    // Récupérer le rôle de l'utilisateur avec ses permissions
    const role = roleDb.findByPk(user.role_id);
    if (!role) {
      throw createError({
        statusCode: 500,
        message: "Rôle utilisateur non trouvé."
      });
    }

    // Mettre l'utilisateur dans le contexte
    const userWithoutPassword = user.toJSON ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;
    
    event.context.user = userWithoutPassword;
    event.context.userRole = role;
    event.context.permissions = role.getPermissions();

    const method = event.node.req.method;

    // GET /api/organigrammes - Liste paginée des organigrammes
    if (method === "GET") {
      // Vérifier les permissions de lecture
      await checkPermission(event, "view");
      
      const { page = 1, limit = 10, search = '', status = '' } = getQuery(event);
      const offset = (page - 1) * limit;
      
      if (useMockDb) {
        console.log("Mode base de données simulée: utilisation des données simulées pour /api/organigrammes");
        let allOrganigrammes = organigrammeDb.findAll();
        
        // Filtrer par recherche si nécessaire
        if (search) {
          const searchLower = search.toLowerCase();
          allOrganigrammes = allOrganigrammes.filter(org => 
            org.title.toLowerCase().includes(searchLower) ||
            (org.description && org.description.toLowerCase().includes(searchLower))
          );
        }
        
        // Filtrer par statut si spécifié
        if (status && ['draft', 'published'].includes(status)) {
          allOrganigrammes = allOrganigrammes.filter(org => org.status === status);
        }
        
        const total = allOrganigrammes.length;
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const organigrammes = allOrganigrammes.slice(startIndex, endIndex);
        
        // Enrichir avec les informations utilisateur
        const enrichedOrganigrammes = organigrammes.map(org => {
          const orgUser = userDb.findById(org.userId);
          return {
            ...org,
            user: orgUser ? {
              id: orgUser.id,
              name: orgUser.name,
              username: orgUser.username
            } : null
          };
        });
        
        return { 
          organigrammes: enrichedOrganigrammes,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        };
      }
      
      // Mode base de données réelle
      const where = {};
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      if (status && ['draft', 'published'].includes(status)) {
        where.status = status;
      }
      
      const { count, rows } = await Organigramme.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'username']
          }
        ]
      });
      
      return { 
        organigrammes: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };
    }

    // POST /api/organigrammes - Créer un nouvel organigramme
    if (method === "POST") {
      // Vérifier les permissions de gestion des organigrammes
      await checkPermission(event, "manage_organigrammes");
      
      const body = await readBody(event);
      
      // Validation des données d'entrée
      const errors = validateOrganigrammeInput(body);
      if (Object.keys(errors).length > 0) {
        throw createError({ statusCode: 400, message: errors });
      }
      
      // Sanitiser les données
      const sanitizedTitle = DOMPurify.sanitize(body.title.trim());
      const sanitizedDescription = body.description ? DOMPurify.sanitize(body.description.trim()) : null;
      
      try {
        let newOrganigramme;
        
        if (useMockDb) {
          // Générer un slug automatiquement
          const slug = generateSlugFromTitle(sanitizedTitle);
          
          // Vérifier l'unicité du slug
          const existingOrg = organigrammeDb.findOne({ where: { slug } });
          if (existingOrg) {
            throw createError({
              statusCode: 400,
              message: { slug: "Cette URL d'organigramme est déjà utilisée." }
            });
          }
          
          newOrganigramme = organigrammeDb.create({
            title: sanitizedTitle,
            description: sanitizedDescription,
            slug,
            status: body.status || 'draft',
            userId: event.context.user.id
          });
        } else {
          // Créer l'organigramme avec la vraie base de données
          newOrganigramme = await Organigramme.create({
            title: sanitizedTitle,
            description: sanitizedDescription,
            status: body.status || 'draft',
            userId: event.context.user.id
          });
        }
        
        // Enregistrer l'activité dans les logs d'audit
        await auditDb.create({
          userId: event.context.user.id,
          action: 'organigramme_create',
          details: `Organigramme créé: ${sanitizedTitle}`,
          ipAddress: getClientIP(event) || 'unknown',
          userAgent: getHeader(event, 'user-agent') || 'unknown'
        });
        
        return newOrganigramme;
      } catch (error) {
        if (error.statusCode) {
          throw error; // Re-throw createError instances
        }
        console.error('Erreur lors de la création de l\'organigramme:', error);
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la création de l'organigramme."
        });
      }
    }

    // Méthode non supportée
    throw createError({ statusCode: 405, message: "Méthode non autorisée." });
    
  } catch (error) {
    // Intercepter les erreurs de connexion à la base de données
    if (error.name && error.name.startsWith('Sequelize')) {
      console.error("Erreur de base de données:", error);
      throw createError({
        statusCode: 503,
        message: "Service de base de données temporairement indisponible."
      });
    }
    // Laisser passer les autres erreurs
    throw error;
  }
});

/**
 * Valide les données d'entrée pour un organigramme
 * @param {Object} data - Données à valider
 * @returns {Object} Erreurs de validation
 */
function validateOrganigrammeInput(data) {
  const errors = {};
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = "Le titre est requis.";
  } else if (data.title.trim().length < 3 || data.title.trim().length > 255) {
    errors.title = "Le titre doit contenir entre 3 et 255 caractères.";
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.description = "La description doit être une chaîne de caractères.";
  }
  
  if (data.status && !['draft', 'published'].includes(data.status)) {
    errors.status = "Le statut doit être 'draft' ou 'published'.";
  }
  
  return errors;
}

/**
 * Génère un slug à partir du titre
 * @param {string} title - Titre à convertir
 * @returns {string} Slug généré
 */
function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}