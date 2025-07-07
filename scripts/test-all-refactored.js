#!/usr/bin/env node

/**
 * Script de test complet pour tous les endpoints refactorisés
 * Usage: node scripts/test-all-refactored.js
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const allRefactoredFiles = [
  // Endpoints prioritaires déjà testés
  'server/api/pages.js',
  'server/api/users/[id].js', 
  'server/api/images.post.js',
  'server/api/images/index.js',
  
  // Nouveaux endpoints refactorisés
  'server/api/users.js',
  'server/api/permissions/index.js',
  'server/api/roles/index.js',
  'server/api/images.delete.js',
  'server/api/organigrammes/[id]/employees.js',
  'server/api/images/[id].patch.js',
  'server/api/images/[id].js'
];

function analyzeFile(filePath) {
  console.log(`🔍 Analyse de ${filePath}...`);
  
  try {
    const content = readFileSync(resolve(filePath), 'utf8');
    
    const analysis = {
      file: filePath,
      // Tests de conformité
      hasAuthenticateUser: content.includes('authenticateUser(event)'),
      hasConstantsImport: content.includes('HTTP_STATUS') && content.includes('ERROR_MESSAGES'),
      hasErrorHandler: content.includes('handleDatabaseError'),
      hasTryCatch: content.includes('try {') && content.includes('} catch'),
      
      // Tests de régression
      hasOldAuthPattern: content.includes('getCookie(event, "auth_token")'),
      hasDuplicatedAuth: /const token = getCookie.*sessionDb\.findByToken.*userDb\.findById/s.test(content),
      hasHardcodedStatus: /statusCode:\s*[0-9]{3}(?!\w)/.test(content) && !content.includes('HTTP_STATUS'),
      
      // Métriques
      originalLines: content.split('\n').length,
      authOccurrences: (content.match(/authenticateUser/g) || []).length,
      errorHandlers: (content.match(/handleDatabaseError/g) || []).length
    };
    
    // Calcul du score de conformité
    let score = 0;
    let maxScore = 0;
    
    // Points positifs
    if (analysis.hasAuthenticateUser) score += 25;
    maxScore += 25;
    
    if (analysis.hasConstantsImport) score += 20;
    maxScore += 20;
    
    if (analysis.hasErrorHandler) score += 15;
    maxScore += 15;
    
    if (analysis.hasTryCatch) score += 10;
    maxScore += 10;
    
    // Pénalités
    if (analysis.hasOldAuthPattern) score -= 20;
    if (analysis.hasDuplicatedAuth) score -= 30;
    if (analysis.hasHardcodedStatus) score -= 10;
    
    analysis.conformityScore = Math.max(0, (score / maxScore) * 100);
    
    // Déterminer le statut
    if (analysis.conformityScore >= 90) {
      analysis.status = '✅ Excellent';
    } else if (analysis.conformityScore >= 75) {
      analysis.status = '🟨 Bon';
    } else if (analysis.conformityScore >= 50) {
      analysis.status = '⚠️ Moyen';
    } else {
      analysis.status = '❌ Problème';
    }
    
    console.log(`   ${analysis.status} (${Math.round(analysis.conformityScore)}%)`);
    
    return analysis;
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    return { 
      file: filePath, 
      status: '❌ Erreur', 
      error: error.message,
      conformityScore: 0
    };
  }
}

function generateComprehensiveReport(analyses) {
  console.log(`\n📊 Rapport Complet de Refactorisation`);
  console.log(`===========================================`);
  
  const successful = analyses.filter(a => a.conformityScore >= 90).length;
  const good = analyses.filter(a => a.conformityScore >= 75 && a.conformityScore < 90).length;
  const medium = analyses.filter(a => a.conformityScore >= 50 && a.conformityScore < 75).length;
  const problematic = analyses.filter(a => a.conformityScore < 50).length;
  
  console.log(`✅ Excellents: ${successful} fichiers`);
  console.log(`🟨 Bons: ${good} fichiers`);
  console.log(`⚠️  Moyens: ${medium} fichiers`);
  console.log(`❌ Problématiques: ${problematic} fichiers`);
  console.log(`📁 Total: ${analyses.length} fichiers analysés\n`);
  
  // Score global
  const avgScore = analyses.reduce((sum, a) => sum + (a.conformityScore || 0), 0) / analyses.length;
  console.log(`🎯 Score global de conformité: ${Math.round(avgScore)}%\n`);
  
  // Détails par fichier
  console.log(`📋 Détails par Endpoint:`);
  analyses.forEach(analysis => {
    console.log(`\n   📄 ${analysis.file}:`);
    console.log(`      Status: ${analysis.status}`);
    if (analysis.conformityScore !== undefined) {
      console.log(`      Score: ${Math.round(analysis.conformityScore)}%`);
      console.log(`      Lignes: ${analysis.originalLines}`);
      
      if (!analysis.hasAuthenticateUser) {
        console.log(`      ⚠️  authenticateUser() manquant`);
      }
      if (!analysis.hasConstantsImport) {
        console.log(`      ⚠️  Import des constantes manquant`);
      }
      if (analysis.hasOldAuthPattern) {
        console.log(`      ❌ Ancien pattern d'authentification détecté`);
      }
      if (analysis.hasDuplicatedAuth) {
        console.log(`      ❌ Code d'authentification dupliqué`);
      }
    }
    if (analysis.error) {
      console.log(`      ❌ Erreur: ${analysis.error}`);
    }
  });
  
  // Métriques de réduction
  console.log(`\n📈 Impact de la Refactorisation:`);
  const authUsage = analyses.reduce((sum, a) => sum + (a.authOccurrences || 0), 0);
  const errorHandlers = analyses.reduce((sum, a) => sum + (a.errorHandlers || 0), 0);
  
  console.log(`   🔧 Utilisations d'authenticateUser(): ${authUsage}`);
  console.log(`   🛡️  Gestionnaires d'erreurs centralisés: ${errorHandlers}`);
  console.log(`   📁 Endpoints refactorisés: ${analyses.length}`);
  
  // Recommandations
  console.log(`\n💡 Recommandations:`);
  
  if (problematic > 0) {
    console.log(`   🔴 PRIORITÉ CRITIQUE: Corriger ${problematic} endpoint(s) problématique(s)`);
  }
  
  if (medium > 0) {
    console.log(`   🟨 Améliorer ${medium} endpoint(s) avec score moyen`);
  }
  
  if (avgScore >= 95) {
    console.log(`   🎉 EXCELLENT! Refactorisation quasi-parfaite (${Math.round(avgScore)}%)`);
    console.log(`   ✅ Prêt pour la production`);
  } else if (avgScore >= 85) {
    console.log(`   ✅ TRÈS BON! Score global solide (${Math.round(avgScore)}%)`);
    console.log(`   🔧 Quelques ajustements mineurs recommandés`);
  } else if (avgScore >= 70) {
    console.log(`   ⚠️  Score global acceptable (${Math.round(avgScore)}%)`);
    console.log(`   🔧 Améliorations recommandées avant production`);
  } else {
    console.log(`   ❌ Score global insuffisant (${Math.round(avgScore)}%)`);
    console.log(`   🚨 Refactorisation supplémentaire requise`);
  }
  
  return {
    total: analyses.length,
    successful,
    good,
    medium,
    problematic,
    avgScore,
    isReady: avgScore >= 85 && problematic === 0
  };
}

// Fonction principale
function main() {
  console.log('🧪 Test Complet de la Refactorisation d\'Authentification\n');
  console.log(`Analyse de ${allRefactoredFiles.length} endpoints refactorisés...\n`);
  
  const analyses = allRefactoredFiles.map(analyzeFile);
  const report = generateComprehensiveReport(analyses);
  
  // Code de sortie
  if (report.isReady) {
    console.log(`\n✅ SUCCÈS! Refactorisation prête pour la production.`);
    console.log(`   📊 Score: ${Math.round(report.avgScore)}%`);
    console.log(`   🎯 ${report.successful + report.good}/${report.total} endpoints conformes`);
    process.exit(0);
  } else if (report.problematic === 0 && report.avgScore >= 75) {
    console.log(`\n🟨 BIEN! Refactorisation acceptable avec améliorations mineures.`);
    console.log(`   📊 Score: ${Math.round(report.avgScore)}%`);
    process.exit(0);
  } else {
    console.log(`\n❌ PROBLÈMES DÉTECTÉS! Refactorisation nécessite des corrections.`);
    console.log(`   📊 Score: ${Math.round(report.avgScore)}%`);
    console.log(`   🚨 ${report.problematic} endpoint(s) problématique(s)`);
    process.exit(1);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeFile, generateComprehensiveReport };