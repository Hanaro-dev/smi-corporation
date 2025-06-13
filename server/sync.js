import { sequelize, User, Role, Permission, Page } from "./models.js";

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Utilisez { alter: true } pour éviter de recréer les tables
    console.log("Les modèles ont été synchronisés avec succès.");
    
    // Afficher les tables synchronisées
    console.log("Tables synchronisées :",
      User.tableName,
      Role.tableName,
      Permission.tableName,
      Page.tableName
    );
  } catch (error) {
    console.error("Erreur lors de la synchronisation des modèles :", error);
  } finally {
    await sequelize.close();
  }
})();
