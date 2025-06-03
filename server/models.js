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

// Relations
User.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(User, { foreignKey: "role_id" });

Role.belongsToMany(Permission, { through: "RolePermissions" });
Permission.belongsToMany(Role, { through: "RolePermissions" });

// Fonction de synchronisation
export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de la synchronisation de la base de données :",
      error
    );
  }
};

// Export des modèles et de l'instance Sequelize
export { User, Role, Permission, sequelize };
