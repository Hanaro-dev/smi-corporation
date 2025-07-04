import { defineEventHandler, createError, readBody, getCookie, getHeader } from "../../utils/http-utils.js";
import { getClientIP } from "../../utils/ip-utils.js";
import { Organigramme, Employee, User } from "../../models.js";
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
    // Authentification obligatoire
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
    const id = event.context.params.id;
    
    if (!id || !/^\d+$/.test(id)) {
      throw createError({ statusCode: 400, message: "ID d'organigramme invalide." });
    }

    // GET /api/organigrammes/:id - Récupérer un organigramme avec ses employés
    if (method === "GET") {
      // Vérifier les permissions de lecture
      await checkPermission(event, "view");
      
      try {
        if (useMockDb) {
          // Mode base de données simulée
          const organigramme = organigrammeDb.findByPk(parseInt(id));
          if (!organigramme) {
            throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
          }
          
          // Récupérer les employés de cet organigramme
          const employees = employeeDb.findAll({ 
            where: { organigrammeId: parseInt(id), isActive: true } 
          });
          
          // Construire la structure hiérarchique
          const structure = buildHierarchy(employees);
          
          // Récupérer les informations de l'utilisateur créateur
          const orgUser = userDb.findById(organigramme.userId);
          
          return {
            id: organigramme.id,
            title: organigramme.title,
            description: organigramme.description,
            slug: organigramme.slug,
            status: organigramme.status,
            createdAt: organigramme.createdAt,
            updatedAt: organigramme.updatedAt,
            user: orgUser ? {
              id: orgUser.id,
              name: orgUser.name,
              username: orgUser.username
            } : null,
            structure
          };
        } else {
          // Mode base de données réelle
          const organigramme = await Organigramme.findByPk(id, {
            include: [
              {
                model: User,
                attributes: ['id', 'name', 'username']
              },
              {
                model: Employee,
                as: 'employees',
                where: { isActive: true },
                required: false,
                order: [['level', 'ASC'], ['orderIndex', 'ASC']]
              }
            ]
          });
          
          if (!organigramme) {
            throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
          }
          
          // Construire la structure hiérarchique
          const structure = buildHierarchy(organigramme.employees || []);
          
          return {
            id: organigramme.id,
            title: organigramme.title,
            description: organigramme.description,
            slug: organigramme.slug,
            status: organigramme.status,
            createdAt: organigramme.createdAt,
            updatedAt: organigramme.updatedAt,
            user: organigramme.User,
            structure
          };
        }
      } catch (error) {
        if (error.statusCode) {
          throw error;
        }
        console.error(`Erreur lors de la récupération de l'organigramme (ID: ${id}):`, error);
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la récupération de l'organigramme."
        });
      }
    }

    // PUT /api/organigrammes/:id - Mettre à jour un organigramme
    if (method === "PUT") {
      // Vérifier les permissions de gestion des organigrammes
      await checkPermission(event, "manage_organigrammes");
      
      const body = await readBody(event);
      
      // Validation des données d'entrée
      const errors = validateOrganigrammeInput(body);
      if (Object.keys(errors).length > 0) {
        throw createError({ statusCode: 400, message: errors });
      }
      
      try {
        let organigramme;
        
        if (useMockDb) {
          // Mode base de données simulée
          organigramme = organigrammeDb.findByPk(parseInt(id));
          if (!organigramme) {
            throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
          }
          
          // Sanitiser les données
          const sanitizedTitle = DOMPurify.sanitize(body.title.trim());
          const sanitizedDescription = body.description ? DOMPurify.sanitize(body.description.trim()) : null;
          
          // Vérifier l'unicité du slug si le titre a changé
          if (sanitizedTitle !== organigramme.title) {
            const newSlug = generateSlugFromTitle(sanitizedTitle);
            const existingOrg = organigrammeDb.findOne({ where: { slug: newSlug } });
            if (existingOrg && existingOrg.id !== parseInt(id)) {
              throw createError({
                statusCode: 400,
                message: { slug: "Cette URL d'organigramme est déjà utilisée." }
              });
            }
            body.slug = newSlug;
          }
          
          organigramme = organigrammeDb.update(parseInt(id), {
            title: sanitizedTitle,
            description: sanitizedDescription,
            slug: body.slug || organigramme.slug,
            status: body.status || organigramme.status
          });
        } else {
          // Mode base de données réelle
          organigramme = await Organigramme.findByPk(id);
          if (!organigramme) {
            throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
          }
          
          // Sanitiser les données
          const sanitizedTitle = DOMPurify.sanitize(body.title.trim());
          const sanitizedDescription = body.description ? DOMPurify.sanitize(body.description.trim()) : null;
          
          await organigramme.update({
            title: sanitizedTitle,
            description: sanitizedDescription,
            status: body.status || organigramme.status
          });
        }
        
        // Enregistrer l'activité dans les logs d'audit
        await auditDb.create({
          userId: event.context.user.id,
          action: 'organigramme_update',
          details: `Organigramme modifié: ${body.title || organigramme.title} (ID: ${id})`,
          ipAddress: getClientIP(event) || 'unknown',
          userAgent: getHeader(event, 'user-agent') || 'unknown'
        });
        
        return organigramme;
      } catch (error) {
        if (error.statusCode) {
          throw error;
        }
        console.error(`Erreur lors de la mise à jour de l'organigramme (ID: ${id}):`, error);
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la mise à jour de l'organigramme."
        });
      }
    }

    // DELETE /api/organigrammes/:id - Supprimer un organigramme
    if (method === "DELETE") {
      // Vérifier les permissions de gestion des organigrammes
      await checkPermission(event, "manage_organigrammes");
      
      try {
        let organigramme;
        
        if (useMockDb) {
          // Mode base de données simulée
          organigramme = organigrammeDb.findByPk(parseInt(id));
          if (!organigramme) {
            throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
          }
          
          // Supprimer tous les employés associés
          const employees = employeeDb.findAll({ where: { organigrammeId: parseInt(id) } });
          employees.forEach(emp => employeeDb.destroy(emp.id));
          
          // Supprimer l'organigramme
          organigrammeDb.destroy(parseInt(id));
        } else {
          // Mode base de données réelle
          organigramme = await Organigramme.findByPk(id);
          if (!organigramme) {
            throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
          }
          
          // Supprimer tous les employés associés en cascade
          await Employee.destroy({ where: { organigrammeId: id } });
          
          // Supprimer l'organigramme
          await organigramme.destroy();
        }
        
        // Enregistrer l'activité dans les logs d'audit
        await auditDb.create({
          userId: event.context.user.id,
          action: 'organigramme_delete',
          details: `Organigramme supprimé: ${organigramme.title} (ID: ${id})`,
          ipAddress: getClientIP(event) || 'unknown',
          userAgent: getHeader(event, 'user-agent') || 'unknown'
        });
        
        return { success: true, message: "Organigramme supprimé avec succès." };
      } catch (error) {
        if (error.statusCode) {
          throw error;
        }
        console.error(`Erreur lors de la suppression de l'organigramme (ID: ${id}):`, error);
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la suppression de l'organigramme."
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
 * Construit la structure hiérarchique des employés
 * @param {Array} employees - Liste des employés
 * @returns {Array} Structure hiérarchique
 */
function buildHierarchy(employees) {
  if (!Array.isArray(employees)) return [];
  
  // Créer une map pour un accès rapide
  const employeeMap = new Map();
  employees.forEach(emp => {
    employeeMap.set(emp.id, {
      name: emp.name,
      position: emp.position,
      email: emp.email || null,
      phone: emp.phone || null,
      children: []
    });
  });
  
  // Construire la hiérarchie
  const roots = [];
  employees.forEach(emp => {
    const employee = employeeMap.get(emp.id);
    if (emp.parentId && employeeMap.has(emp.parentId)) {
      employeeMap.get(emp.parentId).children.push(employee);
    } else {
      roots.push(employee);
    }
  });
  
  return roots;
}

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