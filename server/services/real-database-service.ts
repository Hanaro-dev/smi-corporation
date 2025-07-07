/**
 * Real Database Service - Handles Sequelize database operations
 */
import { Sequelize, DataTypes, Model, ModelStatic } from 'sequelize';
import bcrypt from 'bcryptjs';
import { config } from '../utils/env-validation.js';
import { poolConfig, DatabaseHealthMonitor } from '../utils/db-helpers.js';
import { PasswordStrengthValidator } from '../utils/password-strength.js';
import type { DatabaseModels, DatabaseService, DatabaseConfig } from '../types/index.js';

export class RealDatabaseService implements DatabaseService {
  models: DatabaseModels;
  sequelize: Sequelize;
  private healthMonitor: DatabaseHealthMonitor | null = null;

  constructor() {
    this.models = {} as DatabaseModels;
    this.sequelize = new Sequelize('', '', '');
    this.createSequelizeInstance();
    this.defineModels();
    this.setupAssociations();
  }

  private createSequelizeInstance(): void {
    this.sequelize = new Sequelize(
      config.database.name,
      config.database.user,
      config.database.password,
      {
        host: config.database.host,
        dialect: config.database.dialect,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: poolConfig,
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
        },
        define: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
        },
      }
    );

    this.healthMonitor = new DatabaseHealthMonitor(this.sequelize);
  }

  private defineModels(): void {
    this.defineUserModel();
    this.defineRoleModel();
    this.definePermissionModel();
    this.definePageModel();
    this.defineImageModel();
    this.defineImageVariantModel();
    this.defineOrganigrammeModel();
    this.defineEmployeeModel();
    this.defineAuditLogModel();
  }

  private defineUserModel(): void {
    this.models.User = this.sequelize.define(
      'User',
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Le nom ne peut pas être vide.' },
            len: { args: [3, 255], msg: 'Le nom doit contenir entre 3 et 255 caractères.' }
          },
        },
        username: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: { msg: 'Ce nom d\'utilisateur est déjà pris.' },
          validate: {
            is: { 
              args: /^[a-zA-Z0-9_]+$/i, 
              msg: 'Le nom d\'utilisateur ne peut contenir que des lettres, des chiffres et des underscores.' 
            },
            len: { 
              args: [3, 50], 
              msg: 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères.' 
            }
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { msg: 'Cet email est déjà utilisé.' },
          validate: {
            isEmail: { msg: 'Veuillez fournir une adresse email valide.' }
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Le mot de passe ne peut pas être vide.' },
            isStrongPassword(value: string) {
              const validation = PasswordStrengthValidator.validate(value);
              if (!validation.isValid) {
                throw new Error(`Mot de passe faible: ${validation.errors.join(', ')}`);
              }
              if (validation.score < 60) {
                throw new Error(`Mot de passe trop faible (score: ${validation.score}/100). Utilisez une combinaison plus complexe.`);
              }
            }
          },
        },
        role_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Roles', key: 'id' }
        },
      },
      {
        timestamps: true,
        hooks: {
          beforeCreate: async (user: any) => {
            if (user.password) {
              const salt = await bcrypt.genSalt(config.security.bcryptRounds);
              user.password = await bcrypt.hash(user.password, salt);
            }
          },
          beforeUpdate: async (user: any) => {
            if (user.changed('password')) {
              const salt = await bcrypt.genSalt(config.security.bcryptRounds);
              user.password = await bcrypt.hash(user.password, salt);
            }
          },
        },
      }
    );

    // Add password validation method
    this.models.User.prototype.validPassword = async function(password: string): Promise<boolean> {
      return await bcrypt.compare(password, this.password);
    };
  }

  private defineRoleModel(): void {
    this.models.Role = this.sequelize.define(
      'Role',
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      { timestamps: true }
    );
  }

  private definePermissionModel(): void {
    this.models.Permission = this.sequelize.define(
      'Permission',
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      { timestamps: true }
    );
  }

  private definePageModel(): void {
    this.models.Page = this.sequelize.define(
      'Page',
      {
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Le titre ne peut pas être vide.' },
            len: { args: [3, 255], msg: 'Le titre doit contenir entre 3 et 255 caractères.' }
          },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { msg: 'Cette URL est déjà utilisée.' },
          validate: {
            is: {
              args: /^[a-z0-9-]+$/i,
              msg: 'Le slug ne peut contenir que des lettres, des chiffres et des tirets.'
            }
          },
        },
        status: {
          type: DataTypes.ENUM('draft', 'published'),
          defaultValue: 'draft',
          allowNull: false,
        },
        parentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Pages', key: 'id' }
        },
        order: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        level: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          validate: {
            max: { args: [2], msg: 'Le niveau de profondeur ne peut pas dépasser 2 (max 3 niveaux).' }
          },
        },
      },
      {
        timestamps: true,
        hooks: {
          beforeValidate: async (page: any) => {
            // Auto-generate slug from title if not provided
            if (!page.slug && page.title) {
              page.slug = page.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            }
            
            // Adjust level based on parent
            if (page.parentId) {
              try {
                const parent = await this.models.Page.findByPk(page.parentId);
                if (parent) {
                  page.level = parent.level + 1;
                }
              } catch (error) {
                console.error('Error checking parent:', error);
              }
            } else {
              page.level = 0;
            }
          }
        }
      }
    );
  }

  private defineImageModel(): void {
    this.models.Image = this.sequelize.define(
      'Image',
      {
        filename: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        originalFilename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        path: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        width: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        height: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        format: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        altText: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        hash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' }
        },
      },
      { timestamps: true }
    );
  }

  private defineImageVariantModel(): void {
    this.models.ImageVariant = this.sequelize.define(
      'ImageVariant',
      {
        filename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        path: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        width: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        height: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        format: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('thumbnail', 'small', 'medium', 'large', 'webp'),
          allowNull: false,
        },
        imageId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Images', key: 'id' }
        },
      },
      { timestamps: true }
    );
  }

  private defineOrganigrammeModel(): void {
    this.models.Organigramme = this.sequelize.define(
      'Organigramme',
      {
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Le titre de l\'organigramme ne peut pas être vide.' },
            len: { args: [3, 255], msg: 'Le titre doit contenir entre 3 et 255 caractères.' }
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { msg: 'Cette URL d\'organigramme est déjà utilisée.' },
          validate: {
            is: {
              args: /^[a-z0-9-]+$/i,
              msg: 'Le slug ne peut contenir que des lettres, des chiffres et des tirets.'
            }
          },
        },
        status: {
          type: DataTypes.ENUM('draft', 'published'),
          defaultValue: 'draft',
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' }
        },
      },
      {
        timestamps: true,
        hooks: {
          beforeValidate: async (organigramme: any) => {
            // Auto-generate slug from title if not provided
            if (!organigramme.slug && organigramme.title) {
              organigramme.slug = organigramme.title
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            }
          }
        }
      }
    );
  }

  private defineEmployeeModel(): void {
    this.models.Employee = this.sequelize.define(
      'Employee',
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Le nom de l\'employé ne peut pas être vide.' },
            len: { args: [2, 100], msg: 'Le nom doit contenir entre 2 et 100 caractères.' }
          },
        },
        position: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Le poste ne peut pas être vide.' },
            len: { args: [2, 150], msg: 'Le poste doit contenir entre 2 et 150 caractères.' }
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isEmail: { msg: 'L\'email doit être valide.' }
          },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            is: {
              args: /^[\d\s\-\+\(\)\.]+$/,
              msg: 'Le numéro de téléphone contient des caractères invalides.'
            }
          },
        },
        parentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Employees', key: 'id' }
        },
        organigrammeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Organigrammes', key: 'id' }
        },
        level: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          validate: {
            min: { args: [0], msg: 'Le niveau ne peut pas être négatif.' },
            max: { args: [10], msg: 'Le niveau ne peut pas dépasser 10.' }
          },
        },
        orderIndex: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          field: 'order_index', // Use snake_case in database
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        timestamps: true,
        hooks: {
          beforeValidate: async (employee: any) => {
            // Calculate level based on parent
            if (employee.parentId) {
              try {
                const parent = await this.models.Employee.findByPk(employee.parentId);
                if (parent) {
                  employee.level = parent.level + 1;
                }
              } catch (error) {
                console.error('Error checking parent employee:', error);
              }
            } else {
              employee.level = 0;
            }
          }
        }
      }
    );
  }

  private defineAuditLogModel(): void {
    this.models.AuditLog = this.sequelize.define(
      'AuditLog',
      {
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' }
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entityType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entityId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        oldData: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        newData: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      { timestamps: true }
    );
  }

  private setupAssociations(): void {
    const { User, Role, Permission, Page, Image, ImageVariant, Organigramme, Employee, AuditLog } = this.models;
    
    // User relations
    User.belongsTo(Role, { foreignKey: 'role_id' });
    Role.hasMany(User, { foreignKey: 'role_id' });

    // Role-Permission relations
    Role.belongsToMany(Permission, { through: 'RolePermissions' });
    Permission.belongsToMany(Role, { through: 'RolePermissions' });

    // Page relations (self-referencing)
    Page.hasMany(Page, { foreignKey: 'parentId', as: 'children' });
    Page.belongsTo(Page, { foreignKey: 'parentId', as: 'parent' });

    // Image relations
    Image.hasMany(ImageVariant, { foreignKey: 'imageId', as: 'variants' });
    ImageVariant.belongsTo(Image, { foreignKey: 'imageId' });
    User.hasMany(Image, { foreignKey: 'userId' });
    Image.belongsTo(User, { foreignKey: 'userId' });

    // Organigramme relations
    User.hasMany(Organigramme, { foreignKey: 'userId' });
    Organigramme.belongsTo(User, { foreignKey: 'userId' });
    Organigramme.hasMany(Employee, { foreignKey: 'organigrammeId', as: 'employees' });
    Employee.belongsTo(Organigramme, { foreignKey: 'organigrammeId' });

    // Employee relations (self-referencing hierarchy)
    Employee.hasMany(Employee, { foreignKey: 'parentId', as: 'children' });
    Employee.belongsTo(Employee, { foreignKey: 'parentId', as: 'parent' });

    // Audit log relations
    AuditLog.belongsTo(User, { foreignKey: 'userId' });
    User.hasMany(AuditLog, { foreignKey: 'userId' });
  }

  async initialize(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Real Database Service initialized - Connection established');
    } catch (error) {
      console.error('❌ Real Database Service failed to initialize:', error);
      throw error;
    }
  }

  async sync(options: { alter?: boolean } = { alter: true }): Promise<void> {
    try {
      await this.sequelize.sync(options);
      console.log('✅ Real database synchronized successfully');
    } catch (error) {
      console.error('❌ Database synchronization failed:', error);
      throw error;
    }
  }

  async authenticate(): Promise<void> {
    return await this.sequelize.authenticate();
  }

  isConnected(): boolean {
    return this.sequelize !== null;
  }

  async close(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
    }
  }
}