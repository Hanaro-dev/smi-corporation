import { defineEventHandler, createError, getQuery, readBody } from 'h3';
import { Organigramme, Employee, User, sequelize } from "../../models.js";
import { Op } from "sequelize";
import { organigrammeDb, employeeDb, userDb } from '../../utils/mock-db.js';
import { checkPermission } from "../../utils/permission-utils.js";
import { authenticateUser, validateIdParameter, handleDatabaseError } from '../../services/auth-middleware.js';
import { OrganigrammeValidator } from '../../services/validation-service.js';
import { AuditService } from '../../services/audit-service.js';
import { HTTP_STATUS, ERROR_MESSAGES, PAGINATION } from '../../constants/api-constants.js';
import dotenv from "dotenv";

dotenv.config();
const useMockDb = process.env.USE_MOCK_DB === 'true';

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user and set context
    await authenticateUser(event);

    const method = event.node.req.method;

    // GET /api/organigrammes - Liste paginée des organigrammes
    if (method === "GET") {
      await checkPermission(event, "view");
      return await getOrganigrammesList(event);
    }

    // POST /api/organigrammes - Créer un nouvel organigramme
    if (method === "POST") {
      await checkPermission(event, "manage_organigrammes");
      return await createOrganigramme(event);
    }

    throw createError({ 
      statusCode: HTTP_STATUS.METHOD_NOT_ALLOWED, 
      message: ERROR_MESSAGES.GENERIC.METHOD_NOT_ALLOWED 
    });
    
  } catch (error) {
    handleDatabaseError(error, "gestion des organigrammes");
  }
});

/**
 * Get paginated list of organigrammes
 */
async function getOrganigrammesList(event) {
  const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '', status = '' } = getQuery(event);
  const offset = (page - 1) * limit;
  
  try {
    if (useMockDb) {
      return await getOrganigrammesFromMockDb(search, status, offset, limit, page);
    }
    return await getOrganigrammesFromRealDb(search, status, offset, limit, page);
  } catch (error) {
    handleDatabaseError(error, "récupération des organigrammes");
  }
}

/**
 * Create new organigramme
 */
async function createOrganigramme(event) {
  const body = await readBody(event);
  
  // Validate input
  const errors = OrganigrammeValidator.validate(body);
  if (Object.keys(errors).length > 0) {
    throw createError({ statusCode: HTTP_STATUS.BAD_REQUEST, message: errors });
  }
  
  // Sanitize data
  const sanitizedData = OrganigrammeValidator.sanitize(body);
  
  try {
    let newOrganigramme;
    
    if (useMockDb) {
      // Check slug uniqueness
      const existingOrg = organigrammeDb.findOne({ where: { slug: sanitizedData.slug } });
      if (existingOrg) {
        throw createError({
          statusCode: HTTP_STATUS.CONFLICT,
          message: { slug: ERROR_MESSAGES.VALIDATION.SLUG_EXISTS }
        });
      }
      
      newOrganigramme = organigrammeDb.create({
        ...sanitizedData,
        userId: event.context.user.id
      });
    } else {
      newOrganigramme = await Organigramme.create({
        ...sanitizedData,
        userId: event.context.user.id
      });
    }
    
    // Log audit event
    await AuditService.logOrganigrammeCreate(event, newOrganigramme, event.context.user.id);
    
    return newOrganigramme;
  } catch (error) {
    handleDatabaseError(error, "création de l'organigramme");
  }
}

/**
 * Get organigrammes from mock database
 */
async function getOrganigrammesFromMockDb(search, status, offset, limit, page) {
  let allOrganigrammes = organigrammeDb.findAll();
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    allOrganigrammes = allOrganigrammes.filter(org => 
      org.title.toLowerCase().includes(searchLower) ||
      (org.description && org.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply status filter
  if (status && ['draft', 'published'].includes(status)) {
    allOrganigrammes = allOrganigrammes.filter(org => org.status === status);
  }
  
  const total = allOrganigrammes.length;
  const organigrammes = allOrganigrammes.slice(offset, offset + limit);
  
  // Enrich with user information
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
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get organigrammes from real database
 */
async function getOrganigrammesFromRealDb(search, status, offset, limit, page) {
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
    include: [{
      model: User,
      attributes: ['id', 'name', 'username']
    }]
  });
  
  return { 
    organigrammes: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
}