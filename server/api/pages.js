import { defineEventHandler, createError, getQuery, readBody, getCookie } from "../utils/http-utils.js";
import DOMPurify from "dompurify";
import { validatePageInput } from "../utils/validators";
import { Page, sequelize } from "../models.js";
import dotenv from "dotenv";
import { pageDb, userDb, sessionDb, roleDb, auditDb } from '../utils/mock-db.js';
import { Op as SequelizeOp } from "sequelize";
import { checkPermission } from "../utils/permission-utils.js";
import { generateSlug, validateSlug, generateUniqueSlug } from "../utils/slug-utils.js";

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on utilise la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

// Utiliser SequelizeOp ou créer un mock pour le mode simulé
let Op;
if (useMockDb) {
  // Créer un mock de Op pour le mode simulé
  Op = {
    like: Symbol('like'),
    eq: Symbol('eq'),
    ne: Symbol('ne'),
    gt: Symbol('gt'),
    lt: Symbol('lt')
  };
} else {
  // Utiliser l'import standard
  Op = SequelizeOp;
}

// Fonction utilitaire pour gérer les erreurs de connexion à la base de données
const handleDbConnectionError = (error) => {
  console.error("Erreur de connexion à la base de données:", error);
  
  if (useMockDb) {
    console.warn("Mode simulé activé: tentative de basculer vers les données simulées");
    return {
      statusCode: 200,
      mockData: true
    };
  }
  
  if (error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeConnectionError' ||
      error.name === 'SequelizeHostNotFoundError' ||
      error.name === 'SequelizeConnectionTimedOutError') {
    return createError({
      statusCode: 503,
      message: "Le service de base de données est temporairement indisponible. Veuillez réessayer ultérieurement."
    });
  }
  
  return error;
};

export default defineEventHandler(async (event) => {
  try {
    // Authentification comme dans session.get.js
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
  const url = new URL(event.node.req.url, `http://${event.node.req.headers.host}`);
  const pathname = url.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);

  // GET /api/pages - Liste paginée de toutes les pages
  if (method === "GET" && pathname === "/api/pages") {
    const { page = 1, limit = 10, search = '' } = getQuery(event);
    const offset = (page - 1) * limit;
    
    try {
      if (useMockDb) {
        console.log("Mode base de données simulée: utilisation des données simulées pour /api/pages");
        let allPages = pageDb.findAll();
        
        // Filtrer par recherche si nécessaire
        if (search) {
          const searchLower = search.toLowerCase();
          allPages = allPages.filter(page => 
            page.title.toLowerCase().includes(searchLower) ||
            (page.content && page.content.toLowerCase().includes(searchLower))
          );
        }
        
        const total = allPages.length;
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const pages = allPages.slice(startIndex, endIndex);
        
        return { 
          pages,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        };
      }
      
      const where = {};
      if (search) {
        where.title = { [Op.like]: `%${search}%` };
      }
      
      const { count, rows } = await Page.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['order', 'ASC'], ['title', 'ASC']],
      });
      
      return { 
        pages: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste des pages:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la récupération de la liste des pages."
      });
    }
  }
  
  // GET /api/pages/published - Liste des pages publiées
  if (method === "GET" && pathname === "/api/pages/published") {
    const { page = 1, limit = 10 } = getQuery(event);
    const offset = (page - 1) * limit;
    
    try {
      if (useMockDb) {
        const allPages = pageDb.findAll().filter(p => p.status === 'published');
        const total = allPages.length;
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const pages = allPages.slice(startIndex, endIndex);
        
        return { 
          pages,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        };
      }
      
      const { count, rows } = await Page.findAndCountAll({
        where: { status: 'published' },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['order', 'ASC'], ['title', 'ASC']],
      });
      
      return { 
        pages: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des pages publiées:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la récupération des pages publiées."
      });
    }
  }
  
  // GET /api/pages/tree - Structure arborescente des pages
  if (method === "GET" && pathname === "/api/pages/tree") {
    try {
      // En mode simulé, utiliser directement pageDb
      if (useMockDb) {
        console.log("Mode base de données simulée: utilisation des données simulées pour /api/pages/tree");
        const allPages = pageDb.findAll();
        
        // Fonction pour construire l'arbre récursivement
        const buildTree = (pages, parentId = null) => {
          return pages
            .filter(page => page.parentId === parentId)
            .map(page => ({
              ...page,
              children: buildTree(pages, page.id)
            }));
        };
        
        const tree = buildTree(allPages);
        return { tree };
      }
      
      // Mode normal avec base de données réelle
      const allPages = await Page.findAll({
        order: [['level', 'ASC'], ['order', 'ASC'], ['title', 'ASC']],
      });
      
      // Fonction pour construire l'arbre récursivement
      const buildTree = (pages, parentId = null) => {
        return pages
          .filter(page => page.parentId === parentId)
          .map(page => ({
            ...page.toJSON(),
            children: buildTree(pages, page.id)
          }));
      };
      
      const tree = buildTree(allPages);
      return { tree };
    } catch (error) {
      // En cas d'erreur, essayer de basculer vers les données simulées
      console.error("Erreur lors de la récupération de l'arbre des pages:", error);
      
      if (useMockDb || error.name && error.name.startsWith('Sequelize')) {
        console.log("Basculement vers les données simulées pour /api/pages/tree");
        
        const allPages = pageDb.findAll();
        
        const buildTree = (pages, parentId = null) => {
          return pages
            .filter(page => page.parentId === parentId)
            .map(page => ({
              ...page,
              children: buildTree(pages, page.id)
            }));
        };
        
        const tree = buildTree(allPages);
        return { tree };
      }
      
      throw error;
    }
  }
  
  // GET /api/pages/by-slug/:slug - Récupérer une page par son slug
  if (method === "GET" && pathSegments[2] === "by-slug" && pathSegments.length === 4) {
    const slug = pathSegments[3];
    
    try {
      // En mode simulé, utiliser directement pageDb
      if (useMockDb) {
        console.log(`Mode base de données simulée: recherche de la page avec slug "${slug}"`);
        const page = pageDb.findOne({ where: { slug } });
        
        if (!page) {
          throw createError({ statusCode: 404, message: "Page non trouvée." });
        }
        
        return page;
      }
      
      // Mode normal avec base de données réelle
      const page = await Page.findOne({
        where: { slug }
      });
      
      if (!page) {
        throw createError({ statusCode: 404, message: "Page non trouvée." });
      }
      
      return page;
    } catch (error) {
      // Si erreur de base de données, essayer le mode simulé
      if (error.name && error.name.startsWith('Sequelize')) {
        console.log(`Basculement vers les données simulées pour slug "${slug}"`);
        const page = pageDb.findOne({ where: { slug } });
        
        if (page) return page;
      }
      
      // Si c'est une erreur 404 ou autre erreur, la propager
      throw error;
    }
  }
  
  // GET /api/pages/:id - Récupérer une page par son ID
  if (method === "GET" && pathSegments.length === 3 && /^\d+$/.test(pathSegments[2])) {
    const id = parseInt(pathSegments[2]);
    
    try {
      if (useMockDb) {
        const page = pageDb.findByPk(id);
        if (!page) {
          throw createError({ statusCode: 404, message: "Page non trouvée." });
        }
        return page;
      }
      
      const page = await Page.findByPk(id);
      if (!page) {
        throw createError({ statusCode: 404, message: "Page non trouvée." });
      }
      
      return page;
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw createError instances
      }
      console.error('Erreur lors de la récupération de la page:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la récupération de la page."
      });
    }
  }

  // POST /api/pages - Créer une nouvelle page
  if (method === "POST" && pathname === "/api/pages") {
    // Vérifier les permissions
    await checkPermission(event, "manage_content");
    
    const body = await readBody(event);
    const errors = validatePageInput(body);
    
    if (Object.keys(errors).length > 0) {
      throw createError({ statusCode: 400, message: errors });
    }
    
    const sanitizedContent = DOMPurify.sanitize(body.content || "");
    
    try {
      // Générer ou valider le slug
      let slug = body.slug;
      if (!slug && body.title) {
        // Générer automatiquement depuis le titre
        slug = generateSlug(body.title);
      } else if (slug) {
        // Valider le slug fourni
        const validation = validateSlug(slug);
        if (!validation.isValid) {
          throw createError({
            statusCode: 400,
            message: { slug: validation.errors.join(', ') }
          });
        }
      }

      // Fonction pour vérifier l'existence d'un slug
      const checkSlugExists = async (slugToCheck) => {
        if (useMockDb) {
          return pageDb.findOne({ where: { slug: slugToCheck } }) !== null;
        }
        return await Page.findOne({ where: { slug: slugToCheck } }) !== null;
      };

      // Générer un slug unique
      slug = await generateUniqueSlug(slug, checkSlugExists);
      
      // Vérifier le niveau hiérarchique si parentId est fourni
      let level = 0;
      if (body.parentId) {
        const parent = await Page.findByPk(body.parentId);
        if (!parent) {
          throw createError({
            statusCode: 400,
            message: { parentId: "La page parente n'existe pas." }
          });
        }
        
        level = parent.level + 1;
        if (level > 2) {
          throw createError({
            statusCode: 400,
            message: { parentId: "Le niveau de profondeur ne peut pas dépasser 2 (max 3 niveaux)." }
          });
        }
      }
      
      // Déterminer l'ordre (à la fin par défaut)
      let order = 0;
      if (body.parentId) {
        const maxOrder = await Page.max('order', { 
          where: { parentId: body.parentId } 
        });
        order = (maxOrder || 0) + 1;
      } else {
        const maxOrder = await Page.max('order', { 
          where: { parentId: null } 
        });
        order = (maxOrder || 0) + 1;
      }
      
      // Créer la page
      const newPage = await Page.create({
        title: body.title,
        content: sanitizedContent,
        slug,
        status: body.status || 'draft',
        parentId: body.parentId || null,
        level,
        order
      });
      
      return newPage;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw createError({
          statusCode: 400,
          message: { slug: "Cette URL est déjà utilisée." }
        });
      }
      if (error.statusCode) {
        throw error; // Re-throw createError instances
      }
      console.error('Erreur lors de la création de la page:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la création de la page."
      });
    }
  }

  // PUT /api/pages/:id - Mettre à jour une page existante
  if (method === "PUT" && pathSegments.length === 3 && /^\d+$/.test(pathSegments[2])) {
    // Vérifier les permissions
    await checkPermission(event, "manage_content");
    
    const id = parseInt(pathSegments[2]);
    const body = await readBody(event);
    
    const errors = validatePageInput(body);
    if (Object.keys(errors).length > 0) {
      throw createError({ statusCode: 400, message: errors });
    }
    
    const page = await Page.findByPk(id);
    if (!page) {
      throw createError({ statusCode: 404, message: "Page non trouvée." });
    }
    
    const sanitizedContent = DOMPurify.sanitize(body.content || "");
    
    try {
      // Générer ou valider le slug si modifié
      let slug = body.slug;
      if (body.slug && body.slug !== page.slug) {
        // Valider le slug fourni
        const validation = validateSlug(body.slug);
        if (!validation.isValid) {
          throw createError({
            statusCode: 400,
            message: { slug: validation.errors.join(', ') }
          });
        }
        slug = body.slug;
      } else if (body.title && body.title !== page.title && !body.slug) {
        // Générer automatiquement depuis le nouveau titre si pas de slug fourni
        slug = generateSlug(body.title);
      } else {
        slug = page.slug; // Garder le slug existant
      }

      // Fonction pour vérifier l'existence d'un slug (excluant la page courante)
      const checkSlugExists = async (slugToCheck) => {
        if (useMockDb) {
          const existingPage = pageDb.findOne({ where: { slug: slugToCheck } });
          return existingPage && existingPage.id !== id;
        }
        return await Page.findOne({ 
          where: { 
            slug: slugToCheck,
            id: { [Op.ne]: id }
          } 
        }) !== null;
      };

      // Générer un slug unique si nécessaire
      if (slug !== page.slug) {
        slug = await generateUniqueSlug(slug, checkSlugExists);
      }
      
      // Vérifier le niveau hiérarchique si parentId est modifié
      if (body.parentId !== undefined && body.parentId !== page.parentId) {
        // Empêcher une page d'être son propre parent ou ancêtre
        if (body.parentId === id) {
          throw createError({
            statusCode: 400,
            message: { parentId: "Une page ne peut pas être son propre parent." }
          });
        }
        
        // Vérifier si le nouveau parent existe
        if (body.parentId !== null) {
          const parent = await Page.findByPk(body.parentId);
          if (!parent) {
            throw createError({
              statusCode: 400,
              message: { parentId: "La page parente n'existe pas." }
            });
          }
          
          // Vérifier le niveau de profondeur
          const newLevel = parent.level + 1;
          if (newLevel > 2) {
            throw createError({
              statusCode: 400,
              message: { parentId: "Le niveau de profondeur ne peut pas dépasser 2 (max 3 niveaux)." }
            });
          }
          
          // Si cette page a des enfants, vérifier qu'ils ne dépasseront pas le niveau max
          const hasChildren = await Page.findOne({ where: { parentId: id } });
          if (hasChildren && newLevel === 2) {
            throw createError({
              statusCode: 400,
              message: { parentId: "Le déplacement de cette page ferait dépasser le niveau max pour ses enfants." }
            });
          }
          
          // Mettre à jour le niveau
          body.level = newLevel;
        } else {
          body.level = 0;
        }
        
        // Déterminer le nouvel ordre (à la fin par défaut)
        const maxOrder = await Page.max('order', { 
          where: { parentId: body.parentId } 
        });
        body.order = (maxOrder || 0) + 1;
      }
      
      await page.update({
        title: body.title,
        content: sanitizedContent,
        slug: slug,
        status: body.status,
        parentId: body.parentId,
        level: body.level,
        order: body.order
      });
      
      return page;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw createError({
          statusCode: 400,
          message: { slug: "Cette URL est déjà utilisée." }
        });
      }
      if (error.statusCode) {
        throw error; // Re-throw createError instances
      }
      console.error('Erreur lors de la mise à jour de la page:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la mise à jour de la page."
      });
    }
  }
  
  // PATCH /api/pages/:id/status - Mettre à jour le statut d'une page
  if (method === "PATCH" && pathSegments.length === 4 && 
      /^\d+$/.test(pathSegments[2]) && pathSegments[3] === "status") {
    // Vérifier les permissions
    await checkPermission(event, "manage_content");
    
    const id = parseInt(pathSegments[2]);
    const body = await readBody(event);
    
    if (!body.status || !['draft', 'published'].includes(body.status)) {
      throw createError({ 
        statusCode: 400, 
        message: { status: "Le statut doit être 'draft' ou 'published'." } 
      });
    }
    
    try {
      const page = useMockDb ? pageDb.findByPk(id) : await Page.findByPk(id);
      if (!page) {
        throw createError({ statusCode: 404, message: "Page non trouvée." });
      }
      
      if (useMockDb) {
        page.status = body.status;
        pageDb.update(page);
      } else {
        await page.update({ status: body.status });
      }
      
      return page;
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw createError instances
      }
      console.error('Erreur lors de la mise à jour du statut de la page:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la mise à jour du statut de la page."
      });
    }
  }
  
  // PATCH /api/pages/:id/order - Mettre à jour l'ordre d'une page
  if (method === "PATCH" && pathSegments.length === 4 && 
      /^\d+$/.test(pathSegments[2]) && pathSegments[3] === "order") {
    // Vérifier les permissions
    await checkPermission(event, "manage_content");
    
    const id = parseInt(pathSegments[2]);
    const body = await readBody(event);
    
    if (typeof body.order !== 'number') {
      throw createError({ 
        statusCode: 400, 
        message: { order: "L'ordre doit être un nombre." } 
      });
    }
    
    try {
      const page = useMockDb ? pageDb.findByPk(id) : await Page.findByPk(id);
      if (!page) {
        throw createError({ statusCode: 404, message: "Page non trouvée." });
      }
      
      if (useMockDb) {
        // Logique pour mock database
        const siblings = pageDb.findAll()
          .filter(p => p.parentId === page.parentId && p.id !== id)
          .sort((a, b) => a.order - b.order);
        
        // Créer un nouvel ordre
        let newSiblings = [];
        
        for (let i = 0; i < siblings.length + 1; i++) {
          if (i === body.order) {
            newSiblings.push({ id, order: i });
          }
          
          if (i < siblings.length) {
            newSiblings.push({ 
              id: siblings[i].id, 
              order: i < body.order ? i : i + 1 
            });
          }
        }
        
        // Mettre à jour l'ordre de toutes les pages
        for (const sibling of newSiblings) {
          const pageToUpdate = pageDb.findByPk(sibling.id);
          if (pageToUpdate) {
            pageToUpdate.order = sibling.order;
            pageDb.update(pageToUpdate);
          }
        }
        
        return pageDb.findByPk(id);
      } else {
        // Logique pour vraie base de données
        const transaction = await sequelize.transaction();
        
        try {
          // Récupérer toutes les pages de même niveau et même parent
          const siblings = await Page.findAll({
            where: { 
              parentId: page.parentId,
              id: { [Op.ne]: id }
            },
            order: [['order', 'ASC']],
            transaction
          });
          
          // Créer un nouvel ordre
          let newSiblings = [];
          
          for (let i = 0; i < siblings.length + 1; i++) {
            if (i === body.order) {
              newSiblings.push({ id, order: i });
            }
            
            if (i < siblings.length) {
              newSiblings.push({ 
                id: siblings[i].id, 
                order: i < body.order ? i : i + 1 
              });
            }
          }
          
          // Mettre à jour l'ordre de toutes les pages
          for (const sibling of newSiblings) {
            await Page.update(
              { order: sibling.order },
              { 
                where: { id: sibling.id },
                transaction
              }
            );
          }
          
          await transaction.commit();
          
          // Récupérer la page mise à jour
          const updatedPage = await Page.findByPk(id);
          return updatedPage;
        } catch (dbError) {
          await transaction.rollback();
          throw dbError;
        }
      }
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw createError instances
      }
      console.error('Erreur lors de la mise à jour de l\'ordre de la page:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la mise à jour de l'ordre de la page."
      });
    }
  }

  // DELETE /api/pages/:id - Supprimer une page
  if (method === "DELETE" && pathSegments.length === 3 && /^\d+$/.test(pathSegments[2])) {
    // Vérifier les permissions
    await checkPermission(event, "manage_content");
    
    const id = parseInt(pathSegments[2]);
    
    try {
      // Vérifier si la page existe
      const page = useMockDb ? pageDb.findByPk(id) : await Page.findByPk(id);
      if (!page) {
        throw createError({ statusCode: 404, message: "Page non trouvée." });
      }
      
      // Vérifier si la page a des enfants
      const hasChildren = useMockDb 
        ? pageDb.findOne({ where: { parentId: id } })
        : await Page.findOne({ where: { parentId: id } });
      
      if (hasChildren) {
        throw createError({ 
          statusCode: 400, 
          message: "Cette page a des enfants. Veuillez d'abord supprimer ou déplacer les pages enfants." 
        });
      }
      
      if (useMockDb) {
        // Supprimer la page du mock
        pageDb.destroy(id);
        
        // Réorganiser les autres pages de même niveau
        const siblings = pageDb.findAll()
          .filter(p => p.parentId === page.parentId && p.order > page.order)
          .sort((a, b) => a.order - b.order);
        
        // Mettre à jour l'ordre des pages suivantes
        for (const sibling of siblings) {
          sibling.order -= 1;
          pageDb.update(sibling);
        }
      } else {
        // Supprimer la page
        await page.destroy();
        
        // Réorganiser les autres pages de même niveau
        const siblings = await Page.findAll({
          where: { 
            parentId: page.parentId,
            order: { [Op.gt]: page.order }
          },
          order: [['order', 'ASC']]
        });
        
        // Mettre à jour l'ordre des pages suivantes
        for (const sibling of siblings) {
          await sibling.update({ order: sibling.order - 1 });
        }
      }
      
      return { success: true };
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw createError instances
      }
      console.error('Erreur lors de la suppression de la page:', error);
      throw createError({
        statusCode: 500,
        message: "Erreur lors de la suppression de la page."
      });
    }
  }

  // Route non trouvée
  throw createError({ statusCode: 404, message: "Route non trouvée." });
  
  } catch (error) {
    // Intercepter les erreurs de connexion à la base de données
    if (error.name && error.name.startsWith('Sequelize')) {
      throw handleDbConnectionError(error);
    }
    // Laisser passer les autres erreurs
    throw error;
  }
});
