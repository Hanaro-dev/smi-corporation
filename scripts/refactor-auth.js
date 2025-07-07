#!/usr/bin/env node

/**
 * Script de refactorisation automatique des endpoints avec authentification dupliquée
 * Usage: node scripts/refactor-auth.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const filesToRefactor = [
  'server/api/users.js',
  'server/api/permissions/index.js',
  'server/api/roles/index.js',
  'server/api/images/index.js',
  'server/api/images.delete.js',
  'server/api/organigrammes/[id]/employees.js',
  'server/api/images/[id].patch.js',
  'server/api/images/[id].js'
];

// Patterns à remplacer
const authPatterns = {
  // Pattern d'import à ajouter
  newImports: `import { authenticateUser, handleDatabaseError } from "../services/auth-middleware.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants/api-constants.js";`,
  
  // Pattern d'authentification complète à supprimer
  oldAuthPattern: /const token = getCookie\(event, "auth_token"\);[\s\S]*?event\.context\.permissions = role\.getPermissions\(\);/g,
  
  // Nouveau pattern d'authentification
  newAuthPattern: `await authenticateUser(event);`,
  
  // Pattern de gestion d'erreur à remplacer
  oldErrorPattern: /} catch \(error\) {[\s\S]*?throw error;[\s\S]*?}/g,
  
  // Nouveau pattern de gestion d'erreur
  newErrorPattern: `} catch (error) {
    handleDatabaseError(error, "opération API");
  }`
};

function refactorFile(filePath) {
  try {
    console.log(`Refactorisation de ${filePath}...`);
    
    const fullPath = resolve(filePath);
    let content = readFileSync(fullPath, 'utf8');
    
    // Ajouter les nouveaux imports si pas déjà présents
    if (!content.includes('authenticateUser')) {
      // Trouver la ligne d'import et ajouter les nouveaux
      const importLines = content.match(/import.*from.*['"].*['"];/g);
      if (importLines && importLines.length > 0) {
        const lastImport = importLines[importLines.length - 1];
        content = content.replace(lastImport, lastImport + '\n' + authPatterns.newImports);
      }
    }
    
    // Remplacer le pattern d'authentification dupliqué
    content = content.replace(authPatterns.oldAuthPattern, authPatterns.newAuthPattern);
    
    // Remplacer les patterns d'erreur
    content = content.replace(authPatterns.oldErrorPattern, authPatterns.newErrorPattern);
    
    // Standardiser les codes de statut HTTP
    content = content.replace(/statusCode: 400/g, 'statusCode: HTTP_STATUS.BAD_REQUEST');
    content = content.replace(/statusCode: 401/g, 'statusCode: HTTP_STATUS.UNAUTHORIZED');
    content = content.replace(/statusCode: 403/g, 'statusCode: HTTP_STATUS.FORBIDDEN');
    content = content.replace(/statusCode: 404/g, 'statusCode: HTTP_STATUS.NOT_FOUND');
    content = content.replace(/statusCode: 500/g, 'statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR');
    
    writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} refactorisé avec succès`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la refactorisation de ${filePath}:`, error.message);
  }
}

// Fonction principale
function main() {
  console.log('🔧 Démarrage de la refactorisation des endpoints avec authentification dupliquée\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of filesToRefactor) {
    try {
      refactorFile(file);
      successCount++;
    } catch (error) {
      console.error(`❌ Erreur sur ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Résumé de la refactorisation:`);
  console.log(`   ✅ Succès: ${successCount} fichiers`);
  console.log(`   ❌ Erreurs: ${errorCount} fichiers`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Refactorisation terminée avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Tester les endpoints modifiés');
    console.log('   2. Vérifier que l\'authentification fonctionne correctement');
    console.log('   3. Exécuter les tests automatisés');
    console.log('   4. Commit des changements');
  } else {
    console.log('\n⚠️  Refactorisation terminée avec des erreurs. Vérifiez les fichiers manuellement.');
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { refactorFile, authPatterns };