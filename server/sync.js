const sequelize = require("./database");
const { Role, Permission } = require("./models");

(async () => {
  try {
    await sequelize.sync({ force: true }); // Utilisez { force: true } pour recréer les tables
    console.log("Les modèles ont été synchronisés avec succès.");
  } catch (error) {
    console.error("Erreur lors de la synchronisation des modèles :", error);
  } finally {
    await sequelize.close();
  }
})();
