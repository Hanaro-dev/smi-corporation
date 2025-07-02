/**
 * Configuration globale Playwright - Setup
 */
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🎭 Initialisation globale des tests Playwright...')
  
  // Configurer l'environnement de test
  process.env.NODE_ENV = 'test'
  process.env.USE_MOCK_DB = 'true'
  process.env.LOG_LEVEL = 'error'
  
  // Créer les dossiers de rapports
  const fs = await import('fs')
  const path = await import('path')
  
  const reportsDir = path.join(process.cwd(), 'tests/reports')
  const outputDir = path.join(reportsDir, 'playwright-output')
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Optionnel: Préparer des données de test
  await setupTestData()
  
  console.log('✅ Setup global Playwright terminé')
}

async function setupTestData() {
  // Ici on pourrait:
  // - Créer des utilisateurs de test
  // - Initialiser la base de données
  // - Préparer des fichiers de test
  console.log('📊 Préparation des données de test...')
  
  // Pour l'instant, juste un log
  console.log('✅ Données de test prêtes')
}

export default globalSetup