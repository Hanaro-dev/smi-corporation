const { DataTypes } = require("sequelize");
const sequelize = require("./database"); // Assurez-vous que votre instance Sequelize est configurée ici

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

module.exports = { Role, Permission };
