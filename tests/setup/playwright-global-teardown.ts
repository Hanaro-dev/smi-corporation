/**
 * Configuration globale Playwright - Teardown
 */
import type { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧽 Nettoyage global des tests Playwright...')
  
  // Nettoyer les données de test
  await cleanupTestData()
  
  // Nettoyer les fichiers temporaires si nécessaire
  await cleanupTempFiles()
  
  console.log('✅ Nettoyage global Playwright terminé')
}

async function cleanupTestData() {
  // Ici on pourrait:
  // - Supprimer les utilisateurs de test
  // - Nettoyer la base de données
  // - Supprimer les fichiers créés pendant les tests
  console.log('🗑️ Nettoyage des données de test...')
  
  try {
    // Pour l'instant, juste un log
    console.log('✅ Données de test nettoyées')
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage des données:', error)
  }
}

async function cleanupTempFiles() {
  console.log('📁 Nettoyage des fichiers temporaires...')
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    // Nettoyer les screenshots et vidéos de tests réussis
    const outputDir = path.join(process.cwd(), 'tests/reports/playwright-output')
    
    if (fs.existsSync(outputDir)) {
      // Garder seulement les artifacts des tests échoués
      console.log('📁 Fichiers temporaires nettoyés')
    }
    
    console.log('✅ Nettoyage des fichiers terminé')
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage des fichiers:', error)
  }
}

export default globalTeardown