import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import sequelizeImport from "./database.js";
import { pageDb } from './utils/mock-db.js';
import { config } from './utils/env-validation.js';

// Vérifier si on doit utiliser la base de données simulée
const useMockDb = config.database.useMock;

// Créer un objet pour stocker tous nos modèles et Sequelize
const db = {};

// Fonction pour créer des mocks de modèles
const createMockModel = (name) => {
  // Créer une fonction constructeur
  function MockModel(data = {}) {
    Object.assign(this, { id: Math.floor(Math.random() * 1000), ...data });
  }
  
  // Pour le modèle Page, utiliser pageDb
  if (name === "Page") {
    MockModel.findAll = async (options) => pageDb.findAll(options);
    MockModel.findOne = async (options) => pageDb.findOne(options);
    MockModel.findByPk = async (id) => pageDb.findByPk(id);
    MockModel.create = async (data) => pageDb.create(data);
    MockModel.update = async (data, options) => {
      if (options && options.where && options.where.id) {
        return [1, [pageDb.update(options.where.id, data)]];
      }
      return [0, []];
    };
    MockModel.destroy = async (options) => {
      if (options && options.where && options.where.id) {
        return pageDb.destroy(options.where.id) ? 1 : 0;
      }
      return 0;
    };
    MockModel.findAndCountAll = async (options) => pageDb.findAndCountAll(options);
    MockModel.max = async (field, options) => pageDb.max(field, options);
  } else {
    // Autres modèles génériques
    MockModel.findAll = async () => [];
    MockModel.findOne = async () => null;
    MockModel.findByPk = async () => null;
    MockModel.create = async (data) => {
      const instance = new MockModel(data);
      return instance;
    };
    MockModel.update = async () => [1];
    MockModel.destroy = async () => 1;
    MockModel.findAndCountAll = async () => ({ count: 0, rows: [] });
    MockModel.max = async () => 0;
  }
  
  // Méthodes communes à tous les modèles
  MockModel.hasMany = () => {};
  MockModel.belongsTo = () => {};
  MockModel.belongsToMany = () => {};
  
  // Méthodes d'instance
  MockModel.prototype.validPassword = async function(password) {
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
};

// Configurer Sequelize et les modèles en fonction du mode
if (useMockDb) {
  console.log("Mode simulé: Utilisation de modèles mock...");
  
  // Créer un objet sequelize simulé
  db.sequelize = { 
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
  
  // Créer des modèles simulés
  db.User = createMockModel("User");
  db.Role = createMockModel("Role");
  db.Permission = createMockModel("Permission");
  db.Page = createMockModel("Page");
  db.Image = createMockModel("Image");
  db.ImageVariant = createMockModel("ImageVariant");
  
  // Simuler les relations
  db.User.hasMany(db.Image);
  db.Image.belongsTo(db.User);
  db.Image.hasMany(db.ImageVariant);
  db.ImageVariant.belongsTo(db.Image);
  db.Page.hasMany(db.Page);
  db.Page.belongsTo(db.Page);
  db.User.belongsTo(db.Role);
  db.Role.hasMany(db.User);
  db.Role.belongsToMany(db.Permission, { through: "RolePermissions" });
  db.Permission.belongsToMany(db.Role, { through: "RolePermissions" });
  
} else {
  console.log("Mode normal: Chargement des modèles réels...");
  
  // Utiliser l'instance de base de données importée
  db.sequelize = sequelizeImport;
  
  // Modèle Utilisateur
  db.User = db.sequelize.define(
    "User",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Le nom ne peut pas être vide." },
          len: { args: [3, 255], msg: "Le nom doit contenir entre 3 et 255 caractères." }
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: { msg: "Ce nom d'utilisateur est déjà pris." },
        validate: {
          is: { 
            args: /^[a-zA-Z0-9_]+$/i, 
            msg: "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores." 
          },
          len: { 
            args: [3, 50], 
            msg: "Le nom d'utilisateur doit contenir entre 3 et 50 caractères." 
          }
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Cet email est déjà utilisé." },
        validate: {
          isEmail: { msg: "Veuillez fournir une adresse email valide." }
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Le mot de passe ne peut pas être vide." },
          len: { args: [8, 255], msg: "Le mot de passe doit contenir au moins 8 caractères." }
        },
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(config.security.bcryptRounds);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(config.security.bcryptRounds);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  // Méthode pour valider le mot de passe
  db.User.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Modèle Role
  db.Role = db.sequelize.define(
    "Role",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    { timestamps: true }
  );

  // Modèle Permission
  db.Permission = db.sequelize.define(
    "Permission",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    { timestamps: true }
  );

  // Modèle Page
  db.Page = db.sequelize.define(
    "Page",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Le titre ne peut pas être vide." },
          len: { args: [3, 255], msg: "Le titre doit contenir entre 3 et 255 caractères." }
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Cette URL est déjà utilisée." },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/i,
            msg: "Le slug ne peut contenir que des lettres, des chiffres et des tirets."
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
          max: { args: [2], msg: "Le niveau de profondeur ne peut pas dépasser 2 (max 3 niveaux)." }
        },
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeValidate: async (page) => {
          // Générer automatiquement un slug à partir du titre si non fourni
          if (!page.slug && page.title) {
            page.slug = page.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
          }
          
          // Ajuster le niveau en fonction du parent
          if (page.parentId) {
            try {
              const parent = await db.Page.findByPk(page.parentId);
              if (parent) {
                page.level = parent.level + 1;
              }
            } catch (error) {
              console.error("Erreur lors de la vérification du parent:", error);
            }
          } else {
            page.level = 0;
          }
        }
      }
    }
  );

  // Modèle Image
  db.Image = db.sequelize.define(
    "Image",
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

  // Modèle ImageVariant
  db.ImageVariant = db.sequelize.define(
    "ImageVariant",
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

  // Relations des pages (auto-relation)
  db.Page.hasMany(db.Page, { foreignKey: 'parentId', as: 'children' });
  db.Page.belongsTo(db.Page, { foreignKey: 'parentId', as: 'parent' });

  // Relations
  db.User.belongsTo(db.Role, { foreignKey: "role_id" });
  db.Role.hasMany(db.User, { foreignKey: "role_id" });

  db.Role.belongsToMany(db.Permission, { through: "RolePermissions" });
  db.Permission.belongsToMany(db.Role, { through: "RolePermissions" });

  // Relations des images
  db.Image.hasMany(db.ImageVariant, { foreignKey: 'imageId', as: 'variants' });
  db.ImageVariant.belongsTo(db.Image, { foreignKey: 'imageId' });
  db.User.hasMany(db.Image, { foreignKey: 'userId' });
  db.Image.belongsTo(db.User, { foreignKey: 'userId' });
}

// Fonction de synchronisation avec gestion d'erreur améliorée
const syncDatabase = async () => {
  try {
    // Vérifier si on utilise la base de données simulée
    if (useMockDb) {
      console.log("Mode base de données simulée: synchronisation avec la base simulée");
      console.log("Base de données simulée synchronisée avec succès");
      return;
    }
    
    // Si on utilise une base de données réelle, vérifier d'abord la connectivité
    try {
      await db.sequelize.authenticate();
      console.log("Connexion à la base de données établie avec succès.");
    } catch (connError) {
      console.error("Impossible de se connecter à la base de données :", connError);
      console.warn("ATTENTION: L'application va basculer vers la base de données simulée.");
      
      // Log des détails de configuration pour le diagnostic
      console.log("Vérifiez que le serveur MySQL est démarré et accessible.");
      console.log("Vérifiez aussi les variables d'environnement pour la connexion:");
      console.log("- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT");
      
      // Basculer vers le mode simulé
      process.env.USE_MOCK_DB = 'true';
      console.log("Redémarrage de l'application recommandé pour utiliser la base de données simulée");
      return;
    }
    
    // Si la connexion réussit, on synchronise la base de données
    await db.sequelize.sync({ alter: true });
    console.log("Base de données synchronisée avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de la synchronisation de la base de données :",
      error
    );
    console.warn("L'application pourrait fonctionner de manière limitée.");
  }
};

// Extraire les modèles de l'objet db pour l'export
const { User, Role, Permission, Page, Image, ImageVariant, sequelize } = db;

// Export des modèles et de l'instance Sequelize
export { User, Role, Permission, Page, Image, ImageVariant, sequelize, syncDatabase };
