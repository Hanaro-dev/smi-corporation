/**
 * Models - Simplified interface using Database Service
 * Provides clean API for accessing database models
 */
import { databaseService } from './services/database-service.js';

// Initialize database service and export models
let User, Role, Permission, Page, Image, ImageVariant, Organigramme, Employee, sequelize;

const initializeModels = async () => {
  await databaseService.initialize();
  const models = databaseService.models;
  User = models.User;
  Role = models.Role;
  Permission = models.Permission;
  Page = models.Page;
  Image = models.Image;
  ImageVariant = models.ImageVariant;
  Organigramme = models.Organigramme;
  Employee = models.Employee;
  sequelize = databaseService.sequelize;
};

// Auto-initialize on import
initializeModels().catch(console.error);

// Enhanced database synchronization with fallback
const syncDatabase = async () => {
  try {
    await databaseService.sync();
    console.log("✅ Database synchronized successfully");
  } catch (error) {
    console.error("❌ Database synchronization failed:", error);
    console.warn("⚠️  Application may have limited functionality");
    throw error;
  }
};

// Export models and utilities
export { User, Role, Permission, Page, Image, ImageVariant, Organigramme, Employee, sequelize, syncDatabase };