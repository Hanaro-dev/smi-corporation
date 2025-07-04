/**
 * Mock Database Service - Handles mock database operations for development
 */
import { pageDb } from '../utils/mock-db.js';

export class MockDatabaseService {
  constructor() {
    this.models = {};
    this.sequelize = this.createMockSequelize();
    this.createMockModels();
  }

  createMockSequelize() {
    return {
      sync: async () => true,
      authenticate: async () => true,
      Op: {
        eq: Symbol('eq'),
        ne: Symbol('ne'),
        gt: Symbol('gt'),
        lt: Symbol('lt'),
        like: Symbol('like')
      }
    };
  }

  createMockModel(name) {
    let mockIdCounter = 1;
    
    function MockModel(data = {}) {
      Object.assign(this, { id: mockIdCounter++, ...data });
    }
    
    // Page model uses specialized pageDb
    if (name === "Page") {
      MockModel.findAll = async (options) => pageDb.findAll(options);
      MockModel.findOne = async (options) => pageDb.findOne(options);
      MockModel.findByPk = async (id) => pageDb.findByPk(id);
      MockModel.create = async (data) => pageDb.create(data);
      MockModel.update = async (data, options) => {
        if (options?.where?.id) {
          return [1, [pageDb.update(options.where.id, data)]];
        }
        return [0, []];
      };
      MockModel.destroy = async (options) => {
        if (options?.where?.id) {
          return pageDb.destroy(options.where.id) ? 1 : 0;
        }
        return 0;
      };
      MockModel.findAndCountAll = async (options) => pageDb.findAndCountAll(options);
      MockModel.max = async (field, options) => pageDb.max(field, options);
    } else {
      // Generic mock model methods
      MockModel.findAll = async () => [];
      MockModel.findOne = async () => null;
      MockModel.findByPk = async () => null;
      MockModel.create = async (data) => new MockModel(data);
      MockModel.update = async () => [1];
      MockModel.destroy = async () => 1;
      MockModel.findAndCountAll = async () => ({ count: 0, rows: [] });
      MockModel.max = async () => 0;
    }
    
    // Common model methods
    MockModel.hasMany = () => {};
    MockModel.belongsTo = () => {};
    MockModel.belongsToMany = () => {};
    
    // Instance methods
    MockModel.prototype.validPassword = async function(password) {
      if (this.password && name === 'User') {
        const bcrypt = await import('bcryptjs');
        return await bcrypt.default.compare(password, this.password);
      }
      return true;
    };
    
    MockModel.prototype.toJSON = function() {
      return { ...this };
    };
    
    MockModel.prototype.update = async function(data) {
      Object.assign(this, data);
      return this;
    };
    
    MockModel.prototype.destroy = async function() {
      return 1;
    };
    
    return MockModel;
  }

  createMockModels() {
    // Create mock models
    this.models.User = this.createMockModel("User");
    this.models.Role = this.createMockModel("Role");
    this.models.Permission = this.createMockModel("Permission");
    this.models.Page = this.createMockModel("Page");
    this.models.Image = this.createMockModel("Image");
    this.models.ImageVariant = this.createMockModel("ImageVariant");
    this.models.Organigramme = this.createMockModel("Organigramme");
    this.models.Employee = this.createMockModel("Employee");
    
    // Setup relationships
    this.setupRelationships();
  }

  setupRelationships() {
    const { User, Role, Permission, Page, Image, ImageVariant, Organigramme, Employee } = this.models;
    
    // User relations
    User.belongsTo(Role, { foreignKey: "role_id" });
    Role.hasMany(User, { foreignKey: "role_id" });
    
    // Role-Permission relations
    Role.belongsToMany(Permission, { through: "RolePermissions" });
    Permission.belongsToMany(Role, { through: "RolePermissions" });
    
    // Page relations (self-referencing)
    Page.hasMany(Page, { foreignKey: 'parentId', as: 'children' });
    Page.belongsTo(Page, { foreignKey: 'parentId', as: 'parent' });
    
    // Image relations
    User.hasMany(Image, { foreignKey: 'userId' });
    Image.belongsTo(User, { foreignKey: 'userId' });
    Image.hasMany(ImageVariant, { foreignKey: 'imageId', as: 'variants' });
    ImageVariant.belongsTo(Image, { foreignKey: 'imageId' });

    // Organigramme relations
    User.hasMany(Organigramme, { foreignKey: 'userId' });
    Organigramme.belongsTo(User, { foreignKey: 'userId' });
    Organigramme.hasMany(Employee, { foreignKey: 'organigrammeId', as: 'employees' });
    Employee.belongsTo(Organigramme, { foreignKey: 'organigrammeId' });

    // Employee relations (self-referencing hierarchy)
    Employee.hasMany(Employee, { foreignKey: 'parentId', as: 'children' });
    Employee.belongsTo(Employee, { foreignKey: 'parentId', as: 'parent' });
  }

  async initialize() {
    console.log("⚠️  Mock Database Service initialized");
    return true;
  }

  async sync() {
    console.log("Mock database sync completed");
    return true;
  }

  async authenticate() {
    console.log("Mock database authentication successful");
    return true;
  }
}