#!/usr/bin/env node

/**
 * Script d'application automatique de la refactorisation d'authentification
 * Usage: node scripts/apply-refactor.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const filesToRefactor = [
  'server/api/images.delete.js',
  'server/api/organigrammes/[id]/employees.js',
  'server/api/images/[id].patch.js',
  'server/api/images/[id].js'
];

function refactorAuthenticationPattern(content) {
  // Pattern d'authentification complet à remplacer
  const oldAuthPattern = /const token = getCookie\(event, "auth_token"\);[\s\S]*?event\.context\.permissions = role\.getPermissions\(\);/g;
  
  // Nouveau pattern d'authentification
  const newAuthPattern = 'await authenticateUser(event);';
  
  // Remplacer le pattern d'authentification
  content = content.replace(oldAuthPattern, newAuthPattern);
  
  // Ajouter les imports nécessaires si pas présents
  if (!content.includes('authenticateUser')) {
    // Trouver la ligne d'import et ajouter les nouveaux
    const importMatch = content.match(/(import.*from.*['"]h3['"];)/);
    if (importMatch) {
      const h3Import = importMatch[1];
      // Retirer getCookie de l'import h3 s'il existe
      const cleanH3Import = h3Import.replace(/getCookie,?\s?/, '').replace(/,\s*}/, ' }');
      
      const newImports = `${cleanH3Import}
import { authenticateUser, handleDatabaseError } from "../services/auth-middleware.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants/api-constants.js";`;
      
      content = content.replace(h3Import, newImports);
    }
  }
  
  // Ajouter try-catch et gestion d'erreur centralisée si pas présente
  if (!content.includes('handleDatabaseError')) {
    // Trouver la fin du defineEventHandler
    const endPattern = /}\)\;$/;
    if (endPattern.test(content)) {
      content = content.replace(endPattern, `  } catch (error) {
    handleDatabaseError(error, "opération API");
  }
});`);
      
      // Ajouter try au début si pas présent
      if (!content.includes('try {')) {
        content = content.replace(/export default defineEventHandler\(async \(event\) => \{/, 
          `export default defineEventHandler(async (event) => {
  try {`);
      }
    }
  }
  
  // Standardiser les codes de statut HTTP
  content = content.replace(/statusCode: 400(?!\d)/g, 'statusCode: HTTP_STATUS.BAD_REQUEST');
  content = content.replace(/statusCode: 401(?!\d)/g, 'statusCode: HTTP_STATUS.UNAUTHORIZED');
  content = content.replace(/statusCode: 403(?!\d)/g, 'statusCode: HTTP_STATUS.FORBIDDEN');
  content = content.replace(/statusCode: 404(?!\d)/g, 'statusCode: HTTP_STATUS.NOT_FOUND');
  content = content.replace(/statusCode: 405(?!\d)/g, 'statusCode: HTTP_STATUS.METHOD_NOT_ALLOWED');
  content = content.replace(/statusCode: 500(?!\d)/g, 'statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR');
  
  return content;
}

function refactorFile(filePath) {
  try {
    console.log(`🔧 Refactorisation de ${filePath}...`);
    
    const fullPath = resolve(filePath);
    let content = readFileSync(fullPath, 'utf8');
    
    // Sauvegarder le contenu original
    const backupPath = `${fullPath}.backup`;
    writeFileSync(backupPath, content);
    
    // Appliquer la refactorisation
    const refactoredContent = refactorAuthenticationPattern(content);
    
    // Écrire le contenu refactorisé
    writeFileSync(fullPath, refactoredContent);
    
    console.log(`   ✅ ${filePath} refactorisé avec succès`);
    console.log(`   💾 Sauvegarde créée: ${backupPath}`);
    
    return { success: true, file: filePath };
    
  } catch (error) {
    console.error(`   ❌ Erreur lors de la refactorisation de ${filePath}:`, error.message);
    return { success: false, file: filePath, error: error.message };
  }
}

// Fonction principale
function main() {
  console.log('🚀 Application automatique de la refactorisation d\'authentification\n');
  
  const results = filesToRefactor.map(refactorFile);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Succès: ${successful} fichiers`);
  console.log(`   ❌ Échecs: ${failed} fichiers`);
  
  if (failed > 0) {
    console.log(`\n❌ Fichiers échoués:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }
  
  if (successful === filesToRefactor.length) {
    console.log(`\n🎉 Refactorisation automatique terminée avec succès !`);
    console.log(`\nProchaines étapes:`);
    console.log(`   1. Vérifier les fichiers refactorisés`);
    console.log(`   2. Exécuter les tests: node scripts/test-auth-refactor.js`);
    console.log(`   3. Valider le bon fonctionnement`);
    console.log(`   4. Commit des changements`);
  } else {
    console.log(`\n⚠️  Refactorisation partielle. Vérifiez les erreurs et corrigez manuellement.`);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { refactorAuthenticationPattern, refactorFile };