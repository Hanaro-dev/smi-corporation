import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Vérifier si on doit utiliser la base de données simulée
const useMockDb = process.env.USE_MOCK_DB === 'true';

// Ajout de logs pour le diagnostic
console.log("Configuration de la connexion à la base de données :");
console.log(`Mode: ${useMockDb ? 'Base de données simulée (définie dans models.js)' : 'Base de données réelle'}`);

// Si on est en mode base de données réelle, afficher les informations de connexion
if (!useMockDb) {
  console.log(`DB_NAME: ${process.env.DB_NAME || '(non défini)'}`);
  console.log(`DB_USER: ${process.env.DB_USER || '(non défini)'}`);
  console.log(`DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`DB_DIALECT: ${process.env.DB_DIALECT || 'mysql'}`);
}

// Créer un objet db qui contiendra l'instance Sequelize
const db = {
  sequelize: null
};

// Créer l'instance Sequelize (uniquement en mode réel)
if (!useMockDb) {
  try {
    db.sequelize = new Sequelize(
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
} else {
  // En mode simulé, on ne crée pas d'instance Sequelize ici
  // L'instance simulée sera créée dans models.js
  console.log("Mode simulé: L'instance Sequelize sera créée dans models.js");
}

// Exporter la propriété sequelize de l'objet db
const { sequelize } = db;

export default sequelize;