/**
 * Database Service - Abstracts database operations with mock/real implementation
 */
import { config } from '../utils/env-validation.js';
import { MockDatabaseService } from './mock-database-service.js';
import { RealDatabaseService } from './real-database-service.js';

class DatabaseService {
  constructor() {
    this.implementation = config.database.useMock 
      ? new MockDatabaseService()
      : new RealDatabaseService();
    
    console.log(`Database Service initialized with ${config.database.useMock ? 'mock' : 'real'} implementation`);
  }

  async initialize() {
    return await this.implementation.initialize();
  }

  async sync() {
    return await this.implementation.sync();
  }

  async authenticate() {
    return await this.implementation.authenticate();
  }

  get models() {
    return this.implementation.models;
  }

  get sequelize() {
    return this.implementation.sequelize;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;