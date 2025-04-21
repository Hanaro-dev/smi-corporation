const { DataTypes } = require("sequelize");
const sequelize = require("./database");

// Modèle Utilisateur
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "editor", "viewer"),
    allowNull: false,
  },
});

// Modèle Role
const Role = sequelize.define("Role", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

// Modèle Permission
const Permission = sequelize.define("Permission", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

// Relation entre Role et Permission (Many-to-Many)
Role.belongsToMany(Permission, { through: "RolePermissions" });
Permission.belongsToMany(Role, { through: "RolePermissions" });

module.exports = { User, Role, Permission };
