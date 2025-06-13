import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "./database.js"; // Importer l'instance centralisée

// Modèle Utilisateur
const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Le nom ne peut pas être vide.",
        },
        len: {
          args: [3, 255],
          msg: "Le nom doit contenir entre 3 et 255 caractères.",
        },
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true, // ou false si obligatoire
      unique: {
        msg: "Ce nom d'utilisateur est déjà pris.",
      },
      validate: {
        is: {
          args: /^[a-zA-Z0-9_]+$/i, // Lettres, chiffres, underscores
          msg: "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores.",
        },
        len: {
          args: [3, 50],
          msg: "Le nom d'utilisateur doit contenir entre 3 et 50 caractères.",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Cet email est déjà utilisé.",
      },
      validate: {
        isEmail: {
          msg: "Veuillez fournir une adresse email valide.",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Le mot de passe ne peut pas être vide.",
        },
        len: {
          args: [8, 255], // Exiger au moins 8 caractères
          msg: "Le mot de passe doit contenir au moins 8 caractères.",
        },
      },
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Méthode pour valider le mot de passe
User.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Modèle Role
const Role = sequelize.define(
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
const Permission = sequelize.define(
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
const Page = sequelize.define(
  "Page",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Le titre ne peut pas être vide.",
        },
        len: {
          args: [3, 255],
          msg: "Le titre doit contenir entre 3 et 255 caractères.",
        },
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Cette URL est déjà utilisée.",
      },
      validate: {
        is: {
          args: /^[a-z0-9-]+$/i,
          msg: "Le slug ne peut contenir que des lettres, des chiffres et des tirets.",
        },
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
      references: {
        model: 'Pages',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        max: {
          args: [2],
          msg: "Le niveau de profondeur ne peut pas dépasser 2 (max 3 niveaux).",
        },
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
            const parent = await Page.findByPk(page.parentId);
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

// Relations des pages (auto-relation)
Page.hasMany(Page, { foreignKey: 'parentId', as: 'children' });
Page.belongsTo(Page, { foreignKey: 'parentId', as: 'parent' });

// Relations
User.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(User, { foreignKey: "role_id" });

Role.belongsToMany(Permission, { through: "RolePermissions" });
Permission.belongsToMany(Role, { through: "RolePermissions" });

// Fonction de synchronisation avec gestion d'erreur améliorée
export const syncDatabase = async () => {
  try {
    // Vérifier d'abord la connectivité avec la base de données
    try {
      await sequelize.authenticate();
      console.log("Connexion à la base de données établie avec succès.");
    } catch (connError) {
      console.error("Impossible de se connecter à la base de données :", connError);
      console.warn("ATTENTION: L'application pourrait utiliser la base de données simulée.");
      
      // Log des détails de configuration pour le diagnostic
      console.log("Vérifiez que le serveur MySQL est démarré et accessible.");
      console.log("Vérifiez aussi les variables d'environnement pour la connexion:");
      console.log("- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT");
      
      // On ne lève pas l'erreur ici pour permettre à l'application de continuer
      // potentiellement avec la base de données simulée
      return;
    }
    
    // Si la connexion réussit, on synchronise la base de données
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de la synchronisation de la base de données :",
      error
    );
    console.warn("L'application pourrait fonctionner de manière limitée.");
  }
};

// Modèle Image
const Image = sequelize.define(
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
      references: {
        model: 'Users',
        key: 'id'
      }
    },
  },
  {
    timestamps: true,
  }
);

// Modèle ImageVariant
const ImageVariant = sequelize.define(
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
      references: {
        model: 'Images',
        key: 'id'
      }
    },
  },
  {
    timestamps: true,
  }
);

// Définir les relations
Image.hasMany(ImageVariant, { foreignKey: 'imageId', as: 'variants' });
ImageVariant.belongsTo(Image, { foreignKey: 'imageId' });
User.hasMany(Image, { foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId' });

// Export des modèles et de l'instance Sequelize
export { User, Role, Permission, Page, Image, ImageVariant, sequelize };
