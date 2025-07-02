/**
 * Global Test Setup - Configuration globale pour tous les tests
 */
import { beforeAll, afterAll } from 'vitest'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '../..')

export async function setup() {
  console.log('🚀 Initialisation de l\'environnement de tests...')
  
  // Créer les dossiers de rapports de tests
  const reportsDir = join(projectRoot, 'tests/reports')
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }
  
  const coverageDir = join(projectRoot, 'coverage')
  if (!existsSync(coverageDir)) {
    mkdirSync(coverageDir, { recursive: true })
  }
  
  // Variables d'environnement pour les tests
  process.env.NODE_ENV = 'test'
  process.env.USE_MOCK_DB = 'true'
  process.env.LOG_LEVEL = 'error'
  process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production'
  process.env.CSRF_SECRET = 'test-csrf-secret-do-not-use-in-production'
  
  // Configuration de timeouts
  process.env.TEST_TIMEOUT = '10000'
  
  // Mock des modules externes si nécessaire
  await setupGlobalMocks()
  
  console.log('✅ Environnement de tests initialisé')
}

export async function teardown() {
  console.log('🧹 Nettoyage de l\'environnement de tests...')
  
  // Nettoyage des mocks
  // Fermeture des connexions
  // Suppression des fichiers temporaires si nécessaire
  
  console.log('✅ Nettoyage terminé')
}

async function setupGlobalMocks() {
  // Mock pour les services externes
  global.fetch = global.fetch || mockFetch
  
  // Mock pour les timers si nécessaire
  // vi.useFakeTimers()
}

function mockFetch(url: string, options?: any): Promise<Response> {
  // Mock basique de fetch pour les tests
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('mocked response')
  } as Response)
}

// Export pour vitest
export default { setup, teardown }