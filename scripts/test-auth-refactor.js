#!/usr/bin/env node

/**
 * Script de test pour vérifier la refactorisation de l'authentification
 * Usage: node scripts/test-auth-refactor.js
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const refactoredFiles = [
  'server/api/pages.js',
  'server/api/users/[id].js',
  'server/api/images.post.js',
  'server/api/images/index.js'
];

function testFile(filePath) {
  console.log(`🔍 Test de ${filePath}...`);
  
  try {
    const content = readFileSync(resolve(filePath), 'utf8');
    const results = {
      file: filePath,
      hasAuthenticateUser: content.includes('authenticateUser(event)'),
      hasOldAuthPattern: content.includes('getCookie(event, "auth_token")'),
      hasConstantsImport: content.includes('HTTP_STATUS'),
      hasErrorHandler: content.includes('handleDatabaseError'),
      hasDuplicatedAuth: /const token = getCookie.*sessionDb\.findByToken.*userDb\.findById/s.test(content)
    };
    
    // Validation
    let status = '✅';
    let issues = [];
    
    if (!results.hasAuthenticateUser) {
      status = '❌';
      issues.push('authenticateUser() non trouvé');
    }
    
    if (results.hasOldAuthPattern) {
      status = '⚠️';
      issues.push('Ancien pattern d\'authentification encore présent');
    }
    
    if (!results.hasConstantsImport) {
      status = '⚠️';
      issues.push('Import des constantes HTTP_STATUS manquant');
    }
    
    if (results.hasDuplicatedAuth) {
      status = '❌';
      issues.push('Code d\'authentification dupliqué détecté');
    }
    
    console.log(`   ${status} ${filePath}`);
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    return { ...results, status, issues };
    
  } catch (error) {
    console.log(`   ❌ ${filePath} - Erreur: ${error.message}`);
    return { file: filePath, status: '❌', error: error.message };
  }
}

function generateReport(testResults) {
  const successful = testResults.filter(r => r.status === '✅').length;
  const withWarnings = testResults.filter(r => r.status === '⚠️').length;
  const failed = testResults.filter(r => r.status === '❌').length;
  
  console.log(`\n📊 Rapport de Test de Refactorisation`);
  console.log(`===========================================`);
  console.log(`✅ Succès: ${successful} fichiers`);
  console.log(`⚠️  Avertissements: ${withWarnings} fichiers`);
  console.log(`❌ Échecs: ${failed} fichiers`);
  console.log(`📁 Total: ${testResults.length} fichiers testés\n`);
  
  // Détails des problèmes
  const problemFiles = testResults.filter(r => r.issues && r.issues.length > 0);
  if (problemFiles.length > 0) {
    console.log(`🔧 Fichiers nécessitant une attention:`);
    problemFiles.forEach(file => {
      console.log(`\n   📄 ${file.file}:`);
      file.issues.forEach(issue => console.log(`      • ${issue}`));
    });
  }
  
  // Recommandations
  console.log(`\n💡 Recommandations:`);
  
  if (failed > 0) {
    console.log(`   1. Corriger les fichiers en échec avant de continuer`);
  }
  
  if (withWarnings > 0) {
    console.log(`   2. Résoudre les avertissements pour une refactorisation complète`);
  }
  
  if (successful === testResults.length) {
    console.log(`   🎉 Refactorisation réussie ! Tous les fichiers sont conformes.`);
    console.log(`   ✅ Prêt pour les tests d'intégration`);
  }
  
  return {
    successful,
    withWarnings,
    failed,
    total: testResults.length,
    isComplete: failed === 0 && withWarnings === 0
  };
}

// Fonction principale
function main() {
  console.log('🧪 Test de Refactorisation de l\'Authentification\n');
  console.log('Vérification des endpoints refactorisés...\n');
  
  const testResults = refactoredFiles.map(testFile);
  const report = generateReport(testResults);
  
  // Code de sortie
  if (report.failed > 0) {
    console.log(`\n❌ Tests échoués. Code de sortie: 1`);
    process.exit(1);
  } else if (report.withWarnings > 0) {
    console.log(`\n⚠️  Tests avec avertissements. Code de sortie: 0`);
    process.exit(0);
  } else {
    console.log(`\n✅ Tous les tests réussis ! Code de sortie: 0`);
    process.exit(0);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testFile, generateReport };