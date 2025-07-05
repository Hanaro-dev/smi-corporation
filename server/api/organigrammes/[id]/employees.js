import { defineEventHandler, createError, readBody, getCookie, getHeader, getRequestIP } from 'h3';
import { Organigramme, Employee } from "../../../models.js";
import { sessionDb, userDb, roleDb, auditDb, organigrammeDb, employeeDb } from '../../../utils/mock-db.js';
import { checkPermission } from "../../../utils/permission-utils.js";
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
    const organigrammeId = event.context.params.id;
    
    if (!organigrammeId || !/^\d+$/.test(organigrammeId)) {
      throw createError({ statusCode: 400, message: "ID d'organigramme invalide." });
    }

    // Vérifier que l'organigramme existe
    const organigramme = useMockDb 
      ? organigrammeDb.findByPk(parseInt(organigrammeId))
      : await Organigramme.findByPk(organigrammeId);
    
    if (!organigramme) {
      throw createError({ statusCode: 404, message: "Organigramme non trouvé." });
    }

    // POST /api/organigrammes/:id/employees - Ajouter un employé
    if (method === "POST") {
      // Vérifier les permissions de gestion des organigrammes
      await checkPermission(event, "manage_organigrammes");
      
      const body = await readBody(event);
      
      // Validation des données d'entrée
      const errors = validateEmployeeInput(body);
      if (Object.keys(errors).length > 0) {
        throw createError({ statusCode: 400, message: errors });
      }
      
      try {
        // Sanitiser les données
        const sanitizedName = DOMPurify.sanitize(body.name.trim());
        const sanitizedPosition = DOMPurify.sanitize(body.position.trim());
        const sanitizedEmail = body.email ? DOMPurify.sanitize(body.email.trim()) : null;
        const sanitizedPhone = body.phone ? DOMPurify.sanitize(body.phone.trim()) : null;
        
        // Vérifier le parent si spécifié
        if (body.parentId) {
          const parent = useMockDb
            ? employeeDb.findByPk(parseInt(body.parentId))
            : await Employee.findByPk(body.parentId);
          
          if (!parent || parent.organigrammeId !== parseInt(organigrammeId)) {
            throw createError({
              statusCode: 400,
              message: { parentId: "Le parent spécifié n'existe pas dans cet organigramme." }
            });
          }
          
          // Vérifier le niveau de profondeur (max 10 niveaux)
          if (parent.level >= 9) {
            throw createError({
              statusCode: 400,
              message: { parentId: "Le niveau de profondeur maximal (10) serait dépassé." }
            });
          }
        }
        
        let newEmployee;
        
        if (useMockDb) {
          // Calculer l'ordre automatiquement
          const siblings = employeeDb.findAll({ 
            where: { 
              organigrammeId: parseInt(organigrammeId),
              parentId: body.parentId || null
            } 
          });
          const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.orderIndex)) : -1;
          
          newEmployee = employeeDb.create({
            name: sanitizedName,
            position: sanitizedPosition,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            parentId: body.parentId || null,
            organigrammeId: parseInt(organigrammeId),
            level: body.parentId ? (employeeDb.findByPk(parseInt(body.parentId)).level + 1) : 0,
            orderIndex: maxOrder + 1,
            isActive: true
          });
        } else {
          newEmployee = await Employee.create({
            name: sanitizedName,
            position: sanitizedPosition,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            parentId: body.parentId || null,
            organigrammeId: parseInt(organigrammeId),
            isActive: true
          });
        }
        
        // Enregistrer l'activité dans les logs d'audit
        await auditDb.create({
          userId: event.context.user.id,
          action: 'employee_create',
          details: `Employé ajouté: ${sanitizedName} (${sanitizedPosition}) dans l'organigramme ${organigramme.title}`,
          ipAddress: getRequestIP(event) || 'unknown',
          userAgent: getHeader(event, 'user-agent') || 'unknown'
        });
        
        return newEmployee;
      } catch (error) {
        if (error.statusCode) {
          throw error;
        }
        console.error('Erreur lors de la création de l\'employé:', error);
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la création de l'employé."
        });
      }
    }

    // GET /api/organigrammes/:id/employees - Lister les employés
    if (method === "GET") {
      // Vérifier les permissions de lecture
      await checkPermission(event, "view");
      
      try {
        let employees;
        
        if (useMockDb) {
          employees = employeeDb.findAll({ 
            where: { 
              organigrammeId: parseInt(organigrammeId),
              isActive: true 
            } 
          });
        } else {
          employees = await Employee.findAll({
            where: { 
              organigrammeId: parseInt(organigrammeId),
              isActive: true 
            },
            order: [['level', 'ASC'], ['orderIndex', 'ASC']]
          });
        }
        
        return { employees };
      } catch (error) {
        console.error('Erreur lors de la récupération des employés:', error);
        throw createError({
          statusCode: 500,
          message: "Erreur lors de la récupération des employés."
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
 * Valide les données d'entrée pour un employé
 * @param {Object} data - Données à valider
 * @returns {Object} Erreurs de validation
 */
function validateEmployeeInput(data) {
  const errors = {};
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = "Le nom est requis.";
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.name = "Le nom doit contenir entre 2 et 100 caractères.";
  }
  
  if (!data.position || typeof data.position !== 'string' || data.position.trim().length === 0) {
    errors.position = "Le poste est requis.";
  } else if (data.position.trim().length < 2 || data.position.trim().length > 150) {
    errors.position = "Le poste doit contenir entre 2 et 150 caractères.";
  }
  
  if (data.email && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
    errors.email = "L'email doit être valide.";
  }
  
  if (data.phone && (typeof data.phone !== 'string' || !/^[\d\s\-\+\(\)\.]+$/.test(data.phone))) {
    errors.phone = "Le numéro de téléphone contient des caractères invalides.";
  }
  
  if (data.parentId && (!/^\d+$/.test(data.parentId.toString()))) {
    errors.parentId = "L'ID du parent doit être un nombre valide.";
  }
  
  return errors;
}