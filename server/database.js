const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("database_name", "username", "password", {
  host: "localhost",
  dialect: "mysql", // ou 'postgres', 'sqlite', etc.
});

module.exports = sequelize;
