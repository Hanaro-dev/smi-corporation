// Repository exports and factory
import { UserRepository } from './user-repository.js'
import { PageRepository } from './page-repository.js'
import { BaseRepository } from './base-repository.js'

// Create singleton instances
export const userRepository = new UserRepository()
export const pageRepository = new PageRepository()

// Export classes for testing/extending
export {
  BaseRepository,
  UserRepository,
  PageRepository
}

// Repository factory for dynamic model repositories
export function createRepository(model, modelName) {
  return new BaseRepository(model, modelName)
}

// Helper to get all repositories
export function getAllRepositories() {
  return {
    user: userRepository,
    page: pageRepository
  }
}