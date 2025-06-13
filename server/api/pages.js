import { defineEventHandler, createError, getQuery, readBody } from "h3";
import DOMPurify from "dompurify";
import { validatePageInput } from "../utils/validators";
import auth from "../middleware/auth.js";
import { Page, sequelize } from "../models.js";
import { Op } from "sequelize";

export default defineEventHandler(async (event) => {
  await auth(event);

  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Non autorisé." });
  }

  const method = event.node.req.method;
  const url = new URL(event.node.req.url, `http://${event.node.req.headers.host}`);
  const pathname = url.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);

  // GET /api/pages - Liste paginée de toutes les pages
  if (method === "GET" && pathname === "/api/pages") {
    const { page = 1, limit = 10, search = '' } = getQuery(event);
    const offset = (page - 1) * limit;
    
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
  }
  
  // GET /api/pages/published - Liste des pages publiées
  if (method === "GET" && pathname === "/api/pages/published") {
    const { page = 1, limit = 10 } = getQuery(event);
    const offset = (page - 1) * limit;
    
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
  }
  
  // GET /api/pages/tree - Structure arborescente des pages
  if (method === "GET" && pathname === "/api/pages/tree") {
    // Récupérer toutes les pages
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
  }
  
  // GET /api/pages/by-slug/:slug - Récupérer une page par son slug
  if (method === "GET" && pathSegments[2] === "by-slug" && pathSegments.length === 4) {
    const slug = pathSegments[3];
    
    const page = await Page.findOne({
      where: { slug }
    });
    
    if (!page) {
      throw createError({ statusCode: 404, message: "Page non trouvée." });
    }
    
    return page;
  }
  
  // GET /api/pages/:id - Récupérer une page par son ID
  if (method === "GET" && pathSegments.length === 3 && /^\d+$/.test(pathSegments[2])) {
    const id = parseInt(pathSegments[2]);
    
    const page = await Page.findByPk(id);
    if (!page) {
      throw createError({ statusCode: 404, message: "Page non trouvée." });
    }
    
    return page;
  }

  // POST /api/pages - Créer une nouvelle page
  if (method === "POST" && pathname === "/api/pages") {
    const body = await readBody(event);
    const errors = validatePageInput(body);
    
    if (Object.keys(errors).length > 0) {
      throw createError({ statusCode: 400, message: errors });
    }
    
    const sanitizedContent = DOMPurify.sanitize(body.content || "");
    
    try {
      // Vérifier si un slug est fourni ou le générer
      let slug = body.slug;
      if (!slug && body.title) {
        slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      // Vérifier l'unicité du slug
      const existingPage = await Page.findOne({ where: { slug } });
      if (existingPage) {
        throw createError({
          statusCode: 400,
          message: { slug: "Cette URL est déjà utilisée." }
        });
      }
      
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
      throw error;
    }
  }

  // PUT /api/pages/:id - Mettre à jour une page existante
  if (method === "PUT" && pathSegments.length === 3 && /^\d+$/.test(pathSegments[2])) {
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
      // Vérifier l'unicité du slug si modifié
      if (body.slug && body.slug !== page.slug) {
        const existingPage = await Page.findOne({ 
          where: { 
            slug: body.slug,
            id: { [Op.ne]: id }
          } 
        });
        
        if (existingPage) {
          throw createError({
            statusCode: 400,
            message: { slug: "Cette URL est déjà utilisée." }
          });
        }
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
        slug: body.slug,
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
      throw error;
    }
  }
  
  // PATCH /api/pages/:id/status - Mettre à jour le statut d'une page
  if (method === "PATCH" && pathSegments.length === 4 && 
      /^\d+$/.test(pathSegments[2]) && pathSegments[3] === "status") {
    const id = parseInt(pathSegments[2]);
    const body = await readBody(event);
    
    if (!body.status || !['draft', 'published'].includes(body.status)) {
      throw createError({ 
        statusCode: 400, 
        message: { status: "Le statut doit être 'draft' ou 'published'." } 
      });
    }
    
    const page = await Page.findByPk(id);
    if (!page) {
      throw createError({ statusCode: 404, message: "Page non trouvée." });
    }
    
    await page.update({ status: body.status });
    return page;
  }
  
  // PATCH /api/pages/:id/order - Mettre à jour l'ordre d'une page
  if (method === "PATCH" && pathSegments.length === 4 && 
      /^\d+$/.test(pathSegments[2]) && pathSegments[3] === "order") {
    const id = parseInt(pathSegments[2]);
    const body = await readBody(event);
    
    if (typeof body.order !== 'number') {
      throw createError({ 
        statusCode: 400, 
        message: { order: "L'ordre doit être un nombre." } 
      });
    }
    
    const page = await Page.findByPk(id);
    if (!page) {
      throw createError({ statusCode: 404, message: "Page non trouvée." });
    }
    
    // Mettre à jour l'ordre de la page et réorganiser les autres pages
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
      let newOrder = 0;
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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // DELETE /api/pages/:id - Supprimer une page
  if (method === "DELETE" && pathSegments.length === 3 && /^\d+$/.test(pathSegments[2])) {
    const id = parseInt(pathSegments[2]);
    
    // Vérifier si la page existe
    const page = await Page.findByPk(id);
    if (!page) {
      throw createError({ statusCode: 404, message: "Page non trouvée." });
    }
    
    // Vérifier si la page a des enfants
    const hasChildren = await Page.findOne({ where: { parentId: id } });
    if (hasChildren) {
      throw createError({ 
        statusCode: 400, 
        message: "Cette page a des enfants. Veuillez d'abord supprimer ou déplacer les pages enfants." 
      });
    }
    
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
    
    return { success: true };
  }

  // Route non trouvée
  throw createError({ statusCode: 404, message: "Route non trouvée." });
});
