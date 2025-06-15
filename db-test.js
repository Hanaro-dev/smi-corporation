// Test de la configuration de base de données simulée
import dotenv from 'dotenv';
import { Page, User, sequelize, syncDatabase } from './server/models.js';

// Charger les variables d'environnement
dotenv.config();

// Afficher la configuration actuelle
console.log("=== Configuration de test ===");
console.log(`USE_MOCK_DB: ${process.env.USE_MOCK_DB}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_USER: ${process.env.DB_USER}`);

// Fonction de test principale
async function testDatabase() {
  try {
    // Tester l'authentification
    console.log("\n=== Test d'authentification ===");
    try {
      await sequelize.authenticate();
      console.log("✅ Connexion à la base de données réussie");
    } catch (error) {
      console.error("❌ Échec de connexion:", error.message);
    }

    // Tester la synchronisation
    console.log("\n=== Test de synchronisation ===");
    try {
      await syncDatabase();
      console.log("✅ Synchronisation réussie");
    } catch (error) {
      console.error("❌ Échec de synchronisation:", error.message);
    }

    // Tester la création d'un utilisateur
    console.log("\n=== Test de création d'utilisateur ===");
    try {
      const testUser = await User.create({
        name: "Test User",
        email: "test@example.com", 
        password: "password123"
      });
      console.log("✅ Utilisateur créé:", testUser.id);
    } catch (error) {
      console.error("❌ Échec de création d'utilisateur:", error.message);
    }

    // Tester la création d'une page
    console.log("\n=== Test de création de page ===");
    try {
      const testPage = await Page.create({
        title: "Page de test",
        content: "Contenu de test",
        slug: "page-test",
        status: "published"
      });
      console.log("✅ Page créée:", testPage.id);
    } catch (error) {
      console.error("❌ Échec de création de page:", error.message);
    }

    console.log("\n=== Tests terminés ===");
  } catch (error) {
    console.error("Erreur globale:", error);
  }
}

// Exécuter les tests
testDatabase().catch(console.error);