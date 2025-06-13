import { Sequelize } from "sequelize";

// Ajout de logs pour le diagnostic
console.log("Configuration de la connexion à la base de données :");
console.log(`DB_NAME: ${process.env.DB_NAME || '(non défini)'}`);
console.log(`DB_USER: ${process.env.DB_USER || '(non défini)'}`);
console.log(`DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`DB_DIALECT: ${process.env.DB_DIALECT || 'mysql'}`);

const sequelize = (() => {
  let instance;

  try {
    instance = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || "localhost",
        dialect: process.env.DB_DIALECT || "mysql",
        logging: false,
      }
    );
    
    console.log("Instance Sequelize créée, tentative de connexion...");
  } catch (error) {
    console.error("Erreur lors de la création de l'instance Sequelize:", error);
    throw error;
  }
  
  return instance;
})();

export default sequelize;