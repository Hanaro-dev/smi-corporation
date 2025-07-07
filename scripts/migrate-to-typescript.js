#!/usr/bin/env node

/**
 * TypeScript Migration Script
 * Migrates JavaScript files to TypeScript with proper typing
 */
const fs = require('fs').promises;
const path = require('path');

// Mapping of imports to TypeScript
const IMPORT_MAPPINGS = {
  'auth-middleware.js': 'auth-middleware.ts',
  'validation-service.js': 'validation-service.ts',
  'audit-service.js': 'audit-service.ts',
  'slug-utils.js': 'slug-utils.ts',
  'api-constants.js': 'api-constants.ts',
  'real-database-service.js': 'real-database-service.ts'
};

// Type imports to add
const TYPE_IMPORTS = {
  'auth-middleware': 'import type { AuthenticatedEvent, User, Role, Permission } from \'../types/index.js\';',
  'validation-service': 'import type { ValidationResult, ValidationErrors, CreateOrganigrammeInput, UpdateOrganigrammeInput, CreateEmployeeInput, UpdateEmployeeInput, CreateUserInput, UpdateUserInput } from \'../types/index.js\';',
  'audit-service': 'import type { AuthenticatedEvent, User, Organigramme, AuditLogInput } from \'../types/index.js\';',
  'api-endpoints': 'import type { AuthenticatedEvent, ApiResponse, User } from \'../../types/index.js\';'
};

// Function parameter types
const FUNCTION_TYPE_MAPPINGS = {
  'authenticateUser': '(event: AuthenticatedEvent): Promise<User>',
  'validateIdParameter': '(id: string | undefined, paramName: string = \'ID\'): number',
  'handleDatabaseError': '(error: any, operation: string = \'opération\'): never',
  'validateRequired': '(value: any, fieldName: string): string | null',
  'validateStringLength': '(value: any, fieldName: string, minLength: number, maxLength: number): string | null',
  'validateStatus': '(status: any): string | null',
  'sanitizeText': '(text: any): string | null',
  'generateSlug': '(title: string): string'
};

async function findJavaScriptFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findJavaScriptFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

function updateImports(content) {
  // Update relative imports to TypeScript
  for (const [jsFile, tsFile] of Object.entries(IMPORT_MAPPINGS)) {
    const regex = new RegExp(`from\\s+['"]([^'"]*${jsFile})['"]`, 'g');
    content = content.replace(regex, (match, importPath) => {
      const newPath = importPath.replace(jsFile, tsFile);
      return `from '${newPath}'`;
    });
  }
  
  return content;
}

function addTypeImports(content, filePath) {
  const fileName = path.basename(filePath, '.js');
  
  // Determine which type imports to add based on content
  let typeImports = [];
  
  if (content.includes('authenticateUser') || content.includes('AuthenticatedEvent')) {
    typeImports.push(TYPE_IMPORTS['api-endpoints']);
  }
  
  if (content.includes('ValidationService') || content.includes('validate(')) {
    typeImports.push(TYPE_IMPORTS['validation-service']);
  }
  
  if (content.includes('AuditService') || content.includes('logUserAction')) {
    typeImports.push(TYPE_IMPORTS['audit-service']);
  }
  
  // Add type imports after the last import statement
  if (typeImports.length > 0) {
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^import\s+/)) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, '', ...typeImports);
      content = lines.join('\n');
    }
  }
  
  return content;
}

function addTypeAnnotations(content) {
  // Add basic type annotations for common patterns
  
  // Function parameters
  content = content.replace(
    /export\s+async\s+function\s+(\w+)\s*\(/g,
    (match, funcName) => {
      if (FUNCTION_TYPE_MAPPINGS[funcName]) {
        return `export async function ${funcName}`;
      }
      return match;
    }
  );
  
  // Event handlers
  content = content.replace(
    /defineEventHandler\s*\(\s*async\s*\(\s*event\s*\)\s*=>/g,
    'defineEventHandler(async (event: AuthenticatedEvent) =>'
  );
  
  // Try-catch error handling
  content = content.replace(
    /catch\s*\(\s*error\s*\)/g,
    'catch (error: any)'
  );
  
  return content;
}

async function migrateFile(jsPath) {
  const tsPath = jsPath.replace(/\.js$/, '.ts');
  
  try {
    let content = await fs.readFile(jsPath, 'utf8');
    
    // Apply transformations
    content = updateImports(content);
    content = addTypeImports(content, jsPath);
    content = addTypeAnnotations(content);
    
    // Write TypeScript file
    await fs.writeFile(tsPath, content);
    
    return { success: true, jsPath, tsPath };
  } catch (error) {
    return { success: false, jsPath, tsPath, error: error.message };
  }
}

async function main() {
  const serverDir = path.join(process.cwd(), 'server');
  
  console.log('🔍 Finding JavaScript files in server directory...');
  const jsFiles = await findJavaScriptFiles(serverDir);
  
  // Filter out already migrated files and exclude certain patterns
  const filesToMigrate = jsFiles.filter(file => {
    const fileName = path.basename(file);
    const dirName = path.dirname(file);
    
    // Skip files that already have TS equivalents
    const tsEquivalent = file.replace(/\.js$/, '.ts');
    try {
      require('fs').accessSync(tsEquivalent);
      return false; // TS file exists, skip
    } catch {
      // TS file doesn't exist, include for migration
    }
    
    // Skip certain directories or files
    if (dirName.includes('node_modules') || 
        dirName.includes('dist') || 
        fileName.startsWith('test') ||
        fileName.includes('.test.') ||
        fileName.includes('.spec.')) {
      return false;
    }
    
    return true;
  });
  
  console.log(`📋 Found ${filesToMigrate.length} JavaScript files to migrate:`);
  filesToMigrate.forEach(file => {
    console.log(`  - ${path.relative(serverDir, file)}`);
  });
  
  if (filesToMigrate.length === 0) {
    console.log('✅ No files to migrate!');
    return;
  }
  
  console.log('\n🚀 Starting migration...');
  
  const results = [];
  for (const jsFile of filesToMigrate) {
    console.log(`📝 Migrating ${path.relative(serverDir, jsFile)}...`);
    const result = await migrateFile(jsFile);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ Created ${path.relative(serverDir, result.tsPath)}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successful.length} files`);
  console.log(`❌ Failed: ${failed.length} files`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed migrations:');
    failed.forEach(f => {
      console.log(`  - ${path.relative(serverDir, f.jsPath)}: ${f.error}`);
    });
  }
  
  console.log('\n🎯 Next steps:');
  console.log('1. Review migrated TypeScript files for type accuracy');
  console.log('2. Update import statements in other files');
  console.log('3. Run TypeScript compiler to check for errors');
  console.log('4. Update references in package.json and configs');
  
  return { successful: successful.length, failed: failed.length };
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, migrateFile, findJavaScriptFiles };