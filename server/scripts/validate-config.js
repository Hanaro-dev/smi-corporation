#!/usr/bin/env node

// Configuration validation script
import { appConfig, validateConfig, getEnvironmentConfig } from '../config/index.js'

function main() {
  console.log('🔧 SMI Corporation Configuration Validator')
  console.log('==========================================\n')

  try {
    // Validate configuration
    console.log('🔍 Validating configuration...')
    validateConfig()
    
    const envConfig = getEnvironmentConfig()
    
    console.log('\n📋 Configuration Summary:')
    console.log('========================')
    console.log(`Environment: ${envConfig.environment}`)
    console.log(`App Name: ${appConfig.app.name}`)
    console.log(`Version: ${appConfig.app.version}`)
    console.log(`Port: ${appConfig.app.port}`)
    console.log(`Base URL: ${appConfig.app.baseUrl}`)
    
    console.log('\n🗄️ Database:')
    console.log(`Using Mock DB: ${appConfig.database.useMock ? 'Yes' : 'No'}`)
    if (!appConfig.database.useMock) {
      console.log(`Dialect: ${appConfig.database.dialect}`)
      console.log(`Host: ${appConfig.database.host}`)
      console.log(`Database: ${appConfig.database.name}`)
    }
    
    console.log('\n🔐 Security:')
    console.log(`CSRF Enabled: ${appConfig.csrf.enabled ? 'Yes' : 'No'}`)
    console.log(`Rate Limiting: ${appConfig.rateLimit.global.enabled ? 'Yes' : 'No'}`)
    console.log(`JWT Secret Length: ${appConfig.auth.jwtSecret.length} characters`)
    
    console.log('\n💾 Caching:')
    console.log(`Redis Enabled: ${appConfig.cache.redis.enabled ? 'Yes' : 'No'}`)
    console.log(`Memory Cache TTL: ${appConfig.cache.memory.defaultTTL}ms`)
    
    console.log('\n📁 File Uploads:')
    console.log(`Images: ${appConfig.uploads.images.enabled ? 'Enabled' : 'Disabled'}`)
    console.log(`Max Image Size: ${(appConfig.uploads.images.maxSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Image Processing: ${appConfig.uploads.images.processing.enabled ? 'Enabled' : 'Disabled'}`)
    
    console.log('\n📧 Email:')
    console.log(`Email Enabled: ${appConfig.email.enabled ? 'Yes' : 'No'}`)
    if (appConfig.email.enabled) {
      console.log(`SMTP Host: ${appConfig.email.smtp.host}`)
      console.log(`From Address: ${appConfig.email.from.address}`)
    }
    
    console.log('\n🚀 Features:')
    Object.entries(appConfig.features).forEach(([feature, enabled]) => {
      const status = enabled ? '✅' : '❌'
      console.log(`${status} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
    })
    
    console.log('\n⚠️ Security Recommendations:')
    const recommendations = []
    
    if (appConfig.auth.jwtSecret === 'fallback-dev-secret-change-in-production') {
      recommendations.push('Change JWT_SECRET from default value')
    }
    
    if (appConfig.auth.jwtSecret.length < 32) {
      recommendations.push('Use a JWT_SECRET with at least 32 characters')
    }
    
    if (envConfig.isProduction && appConfig.database.useMock) {
      recommendations.push('Do not use mock database in production')
    }
    
    if (envConfig.isProduction && !appConfig.csrf.enabled) {
      recommendations.push('Enable CSRF protection in production')
    }
    
    if (envConfig.isProduction && !appConfig.rateLimit.global.enabled) {
      recommendations.push('Enable rate limiting in production')
    }
    
    if (!appConfig.email.enabled && appConfig.features.passwordReset) {
      recommendations.push('Password reset requires email to be enabled')
    }
    
    if (recommendations.length === 0) {
      console.log('✅ No security recommendations')
    } else {
      recommendations.forEach(rec => {
        console.log(`⚠️  ${rec}`)
      })
    }
    
    console.log('\n✅ Configuration validation completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Configuration validation failed:')
    console.error(error.message)
    
    if (process.env.NODE_ENV === 'development') {
      console.error('\n🔧 Stack trace:')
      console.error(error.stack)
    }
    
    console.log('\n💡 Tips:')
    console.log('- Copy .env.example to .env and adjust values')
    console.log('- Ensure all required environment variables are set')
    console.log('- Check JWT_SECRET is properly configured')
    console.log('- Verify database connection settings')
    
    process.exit(1)
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}