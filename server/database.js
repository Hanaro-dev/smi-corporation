import { Sequelize } from "sequelize";
import { config } from "./utils/env-validation.js";
import { poolConfig, DatabaseHealthMonitor } from "./utils/db-helpers.js";

// Vérifier si on doit utiliser la base de données simulée
const useMockDb = config.database.useMock;

// Ajout de logs pour le diagnostic
console.log("Configuration de la connexion à la base de données :");
console.log(`Mode: ${useMockDb ? 'Base de données simulée (définie dans models.js)' : 'Base de données réelle'}`);

// Si on est en mode base de données réelle, afficher les informations de connexion
if (!useMockDb) {
  console.log(`DB_NAME: ${config.database.name || '(non défini)'}`);
  console.log(`DB_USER: ${config.database.user || '(non défini)'}`);
  console.log(`DB_HOST: ${config.database.host}`);
  console.log(`DB_DIALECT: ${config.database.dialect}`);
}

// Créer un objet db qui contiendra l'instance Sequelize
const db = {
  sequelize: null
};

// Créer l'instance Sequelize (uniquement en mode réel)
if (!useMockDb) {
  try {
    db.sequelize = new Sequelize(
      config.database.name,
      config.database.user,
      config.database.password,
      {
        host: config.database.host,
        dialect: config.database.dialect,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: poolConfig,
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci'
        },
        define: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci'
        }
      }
    );
    
    console.log("Instance Sequelize créée, tentative de connexion...");
    
    // Initialize health monitoring
    db.healthMonitor = new DatabaseHealthMonitor(db.sequelize);
    
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