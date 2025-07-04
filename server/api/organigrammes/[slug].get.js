import { defineEventHandler, createError } from "h3";
import { Organigramme, Employee, User } from "../../models.js";
import { organigrammeDb, employeeDb, userDb } from '../../utils/mock-db.js';
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on utilise la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

export default defineEventHandler(async (event) => {
  try {
    const slug = event.context.params.slug;
    
    if (!slug) {
      throw createError({ statusCode: 400, message: "Slug d'organigramme requis." });
    }

    if (useMockDb) {
      console.log(`Mode base de données simulée: recherche de l'organigramme avec slug "${slug}"`);
      
      // Rechercher l'organigramme par slug
      const organigramme = organigrammeDb.findOne({ where: { slug } });
      
      if (!organigramme) {
        throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
      }
      
      // Vérifier que l'organigramme est publié
      if (organigramme.status !== 'published') {
        throw createError({ statusCode: 404, message: "Organigramme non publié." });
      }
      
      // Récupérer les employés de cet organigramme
      const employees = employeeDb.findAll({ 
        where: { organigrammeId: organigramme.id, isActive: true } 
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
      const organigramme = await Organigramme.findOne({
        where: { slug, status: 'published' },
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
    // Si erreur de base de données, essayer le mode simulé
    if (error.name && error.name.startsWith('Sequelize')) {
      console.log(`Basculement vers les données simulées pour slug "${slug}"`);
      
      // Rechercher l'organigramme par slug en mode simulé
      const organigramme = organigrammeDb.findOne({ where: { slug } });
      
      if (organigramme && organigramme.status === 'published') {
        const employees = employeeDb.findAll({ 
          where: { organigrammeId: organigramme.id, isActive: true } 
        });
        const structure = buildHierarchy(employees);
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
      }
    }
    
    // Si c'est une erreur 404 ou autre erreur, la propager
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