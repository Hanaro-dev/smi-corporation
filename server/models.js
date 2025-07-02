/**
 * Models - Simplified interface using Database Service
 * Provides clean API for accessing database models
 */
import { databaseService } from './services/database-service.js';

// Initialize database service
await databaseService.initialize();

// Clean interface for accessing models
const { User, Role, Permission, Page, Image, ImageVariant } = databaseService.models;
const sequelize = databaseService.sequelize;

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
export { User, Role, Permission, Page, Image, ImageVariant, sequelize, syncDatabase };