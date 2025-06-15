/**
 * Utilitaire pour configurer et tester la connexion à la base de données
 * Ce script peut être utilisé pour migrer de la base de données simulée vers une base de données réelle
 */

import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../database.js';
import { syncDatabase, User, Role, Permission, Page, Image, ImageVariant } from '../models.js';

// Charger les variables d'environnement
dotenv.config();

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Synchronise la base de données (crée les tables)
 */
async function syncDb(force = false) {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Base de données synchronisée avec succès (force = ${force}).`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation de la base de données:', error);
    return false;
  }
}

/**
 * Teste la connexion à la base de données
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error);
    return false;
  }
}

/**
 * Affiche les informations de configuration de la base de données
 */
function showConfig() {
  console.log('\n=== Configuration de la base de données ===');
  console.log(`Hôte: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`Base de données: ${process.env.DB_NAME || 'smi_corporation'}`);
  console.log(`Utilisateur: ${process.env.DB_USER || 'root'}`);
  console.log(`Dialecte: ${process.env.DB_DIALECT || 'mysql'}`);
  console.log('=======================================\n');
}


/**
 * Importe les données d'exemple depuis un fichier SQL
 */
async function importSampleData(filePath) {
  try {
    // Lire le fichier SQL
    const sqlFilePath = path.resolve(__dirname, '../../', filePath);
    const sql = await fs.readFile(sqlFilePath, 'utf8');
    
    // Séparer les requêtes SQL (en ignorant les commentaires)
    const queries = sql
      .split(';')
      .map(query => query.trim())
      .filter(query => query && !query.startsWith('--'));
    
    // Exécuter chaque requête
    let count = 0;
    for (const query of queries) {
      if (query) {
        await sequelize.query(query + ';');
        count++;
      }
    }
    
    console.log(`✅ ${count} requêtes exécutées avec succès depuis ${filePath}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation des données d\'exemple:', error);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  // Afficher la configuration
  showConfig();
  
  // Tester la connexion
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️ Impossible de se connecter à la base de données. Veuillez vérifier vos paramètres de connexion.');
    console.log('Vous pouvez configurer la connexion en créant un fichier .env à la racine du projet avec les variables suivantes:');
    console.log(`
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smi_corporation
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_DIALECT=mysql
    `);
    return;
  }
  
  // Menu interactif (pourrait être remplacé par des arguments de ligne de commande)
  const args = process.argv.slice(2);
  const action = args[0];
  
  if (action === 'sync') {
    await syncDb(args[1] === 'force');
  } else if (action === 'import') {
    const filePath = args[1] || '../pages-sample-data.sql';
    await importSampleData(filePath);
  } else if (action === 'full-setup') {
    const force = args[1] === 'force';
    await syncDb(force);
    await importSampleData('pages-sample-data.sql');
  } else {
    console.log('\n=== Script de configuration de la base de données ===');
    console.log('Usage:');
    console.log('  node db-setup.js sync [force]      - Synchronise la base de données (crée les tables)');
    console.log('  node db-setup.js import [file]     - Importe les données d\'exemple');
    console.log('  node db-setup.js full-setup [force] - Synchronise et importe les données');
    console.log('');
    console.log('Exemples:');
    console.log('  node db-setup.js sync              - Synchronise sans supprimer les données existantes');
    console.log('  node db-setup.js sync force        - Supprime toutes les tables et les recrée');
    console.log('  node db-setup.js import ../mon-fichier.sql - Importe un fichier SQL spécifique');
    console.log('  node db-setup.js full-setup        - Synchronise et importe les données d\'exemple');
    console.log('===============================================\n');
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testConnection, syncDb, importSampleData };