import { Sequelize, DataTypes } from "sequelize";

// Connexion à la base de données
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
  }
);

// Modèle Utilisateur
const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { timestamps: true }
);

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
User.belongsTo(Role, { foreignKey: "roleId" });
Role.hasMany(User, { foreignKey: "roleId" });

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
