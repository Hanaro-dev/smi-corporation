const sequelize = require("./database");
require("./models").default;

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Utilisez { alter: true } pour éviter de recréer les tables
    console.log("Les modèles ont été synchronisés avec succès.");
  } catch (error) {
    console.error("Erreur lors de la synchronisation des modèles :", error);
  } finally {
    await sequelize.close();
  }
})();
