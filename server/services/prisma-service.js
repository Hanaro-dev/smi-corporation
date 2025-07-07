// Service pour migrer progressivement de mock-db vers Prisma
// Cette approche permet de continuer à utiliser mock-db pendant que Prisma est configuré

import { PrismaClient } from '@prisma/client';

let prisma = null;

// Fonction pour initialiser Prisma (facultatif)
export function initializePrisma() {
  try {
    if (process.env.USE_MOCK_DB === 'false') {
      prisma = new PrismaClient();
      console.log('✅ Prisma client initialisé');
    } else {
      console.log('ℹ️  Utilisation de mock-db (USE_MOCK_DB=true)');
    }
  } catch (error) {
    console.log('⚠️  Prisma non disponible, utilisation de mock-db');
    prisma = null;
  }
}

// Fonction pour obtenir le client Prisma
export function getPrismaClient() {
  if (!prisma && process.env.USE_MOCK_DB === 'false') {
    initializePrisma();
  }
  return prisma;
}

// Service hybride - utilise Prisma si disponible, sinon mock-db
export const DatabaseService = {
  async getUsers() {
    const client = getPrismaClient();
    if (client) {
      return await client.user.findMany({
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
    } else {
      // Fallback vers mock-db
      const { userDb } = await import('../utils/mock-db-optimized.js');
      return userDb.findAll();
    }
  },

  async getUserById(id) {
    const client = getPrismaClient();
    if (client) {
      return await client.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
    } else {
      // Fallback vers mock-db
      const { userDb } = await import('../utils/mock-db-optimized.js');
      return userDb.findById(id);
    }
  },

  async createUser(userData) {
    const client = getPrismaClient();
    if (client) {
      return await client.user.create({
        data: userData,
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
    } else {
      // Fallback vers mock-db
      const { userDb } = await import('../utils/mock-db-optimized.js');
      return userDb.create(userData);
    }
  },

  async updateUser(id, userData) {
    const client = getPrismaClient();
    if (client) {
      return await client.user.update({
        where: { id: parseInt(id) },
        data: userData,
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
    } else {
      // Fallback vers mock-db
      const { userDb } = await import('../utils/mock-db-optimized.js');
      return userDb.update(id, userData);
    }
  },

  async deleteUser(id) {
    const client = getPrismaClient();
    if (client) {
      return await client.user.delete({
        where: { id: parseInt(id) }
      });
    } else {
      // Fallback vers mock-db
      const { userDb } = await import('../utils/mock-db-optimized.js');
      return userDb.delete(id);
    }
  }
};

// Initialiser au démarrage
initializePrisma();