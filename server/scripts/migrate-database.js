#!/usr/bin/env node

// Database migration script
import { addDatabaseIndexes, removeDatabaseIndexes, analyzeIndexPerformance, getDatabaseStats } from '../migrations/001-add-database-indexes.js'
import { config } from '../utils/env-validation.js'

const command = process.argv[2]
const subcommand = process.argv[3]

async function main() {
  console.log('🚀 SMI Corporation Database Migration Tool')
  console.log('=========================================')

  try {
    switch (command) {
      case 'add-indexes':
        console.log('📥 Adding database indexes...\n')
        const addResult = await addDatabaseIndexes()
        console.log('\n✅ Success:', addResult.message)
        console.log('📋 Indexes created:')
        addResult.indexesCreated.forEach(index => console.log(`   - ${index}`))
        break

      case 'remove-indexes':
        console.log('🗑️ Removing database indexes...\n')
        const removeResult = await removeDatabaseIndexes()
        console.log('\n✅ Success:', removeResult.message)
        break

      case 'analyze':
        console.log('📊 Analyzing index performance...\n')
        const analysis = await analyzeIndexPerformance()
        
        console.log('📈 Performance Analysis Results:')
        console.log('================================')
        
        analysis.forEach(result => {
          console.log(`\n🔍 ${result.name}:`)
          if (result.error) {
            console.log(`   ❌ Error: ${result.error}`)
          } else {
            console.log(`   ✅ Uses Index: ${result.usesIndex ? 'Yes' : 'No'}`)
            if (result.plan && result.plan.length > 0) {
              console.log(`   📋 Query Plan:`)
              result.plan.forEach(step => {
                console.log(`      ${step.detail || step.selectid || 'N/A'}`)
              })
            }
          }
        })
        break

      case 'stats':
        console.log('📈 Gathering database statistics...\n')
        const stats = await getDatabaseStats()
        
        console.log('📊 Database Statistics:')
        console.log('======================')
        console.log(`\n📋 Table Counts:`)
        Object.entries(stats.tables).forEach(([table, count]) => {
          console.log(`   ${table}: ${count.toLocaleString()} records`)
        })
        
        console.log(`\n🔍 Custom Indexes (${stats.indexes.length}):`)
        stats.indexes.forEach(index => {
          console.log(`   - ${index.name}`)
        })
        break

      case 'help':
      default:
        printHelp()
        break
    }

  } catch (error) {
    console.error('\n❌ Migration failed:')
    console.error(error.message)
    
    if (config.app.isDevelopment) {
      console.error('\n🔧 Stack trace:')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

function printHelp() {
  console.log(`
📚 Available Commands:
====================

🔧 Database Management:
  add-indexes     Add performance indexes to database tables
  remove-indexes  Remove all custom indexes from database
  
📊 Analysis & Monitoring:
  analyze         Analyze query performance and index usage
  stats           Show database statistics and index information
  
📖 Help:
  help           Show this help message

💡 Examples:
  npm run migrate add-indexes    # Add all performance indexes
  npm run migrate analyze        # Check if queries use indexes
  npm run migrate stats          # Show table counts and indexes

🔧 Configuration:
  - Uses database connection from your environment settings
  - Logs are detailed in development mode
  - Safe to run multiple times (idempotent operations)

⚠️  Important Notes:
  - Always backup your database before running migrations
  - Test migrations on a copy of production data first
  - Some operations may take time on large datasets
`)
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })
}