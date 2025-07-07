/**
 * Service d'authentification optimisé - Version finale
 * Résout les problèmes N+1 avec cache intelligent et requête unique
 * Réduit 4 requêtes à 0-1 requête selon le cache
 */
import { createError, getCookie } from 'h3';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/api-constants.js';
import { authCache } from './auth-cache-service.js';
import { getUserWithRoleAndPermissions } from '../utils/mock-db-optimized.js';
import type { AuthenticatedEvent, User, Role, Permission } from '../types/index.js';

interface AuthMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  queryReduction: number;
}

class AuthMiddlewareOptimized {
  private static metrics: AuthMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    queryReduction: 0
  };

  /**
   * Authentification ultra-optimisée avec cache intelligent
   * AVANT: 4 requêtes systématiques (session, user, role, permissions)
   * APRÈS: 0 requête (cache hit) ou 1 requête optimisée (cache miss)
   */
  static async authenticateUser(event: AuthenticatedEvent): Promise<User> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const token = getCookie(event, "auth_token");
    
    if (!token) {
      throw createError({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: ERROR_MESSAGES.AUTH.TOKEN_REQUIRED
      });
    }

    // OPTIMISATION 1: Vérifier le cache d'abord - 0 requête DB
    const cachedAuth = authCache.getUserAuthBySession(token);
    if (cachedAuth) {
      // Cache HIT - Performance maximale !
      this.metrics.cacheHits++;
      
      event.context.user = cachedAuth.user;
      event.context.userRole = cachedAuth.role;
      event.context.permissions = cachedAuth.permissions;

      this.updateMetrics(startTime, true, 0);
      return cachedAuth.user;
    }

    // Cache MISS - Exécuter UNE SEULE requête optimisée
    this.metrics.cacheMisses++;
    
    try {
      // OPTIMISATION 2: Requête unique avec JOIN simulé - 1 requête au lieu de 4
      const authData = await getUserWithRoleAndPermissions(token);
      
      if (!authData) {
        throw createError({
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          message: ERROR_MESSAGES.AUTH.INVALID_SESSION
        });
      }

      const { user, role, permissions } = authData;

      // OPTIMISATION 3: Mise en cache pour les prochaines requêtes
      authCache.setUserAuth(user.id.toString(), token, user, role, permissions);

      // Définir le contexte de l'événement
      event.context.user = user;
      event.context.userRole = role;
      event.context.permissions = permissions;

      this.updateMetrics(startTime, false, 1);
      return user;

    } catch (error) {
      this.handleDatabaseError(error, "authentification optimisée");
      throw error; // TypeScript safety
    }
  }

  /**
   * Validation ID optimisée avec cache de regex
   */
  private static idRegexCache = /^\d+$/;
  
  static validateIdParameter(id: string | undefined, paramName: string = 'ID'): number {
    if (!id || !this.idRegexCache.test(id)) {
      throw createError({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `${paramName} invalide.`
      });
    }
    return parseInt(id);
  }

  /**
   * Gestion d'erreurs optimisée avec classification
   */
  static handleDatabaseError(error: any, operation: string = 'opération'): never {
    if (error.statusCode) {
      throw error; // Re-throw createError instances
    }
    
    // Classification des erreurs pour un debugging plus rapide
    if (error.name?.startsWith('Sequelize')) {
      console.error(`🔥 Erreur Sequelize lors de ${operation}:`, {
        message: error.message,
        sql: error.sql,
        parameters: error.parameters
      });
      
      throw createError({
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        message: ERROR_MESSAGES.DATABASE.SERVICE_UNAVAILABLE
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`🔌 Erreur de connexion DB lors de ${operation}:`, error.message);
      throw createError({
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        message: ERROR_MESSAGES.DATABASE.CONNECTION_ERROR
      });
    }
    
    console.error(`⚠️ Erreur non classifiée lors de ${operation}:`, error);
    throw createError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: `Erreur lors de ${operation}.`
    });
  }

  /**
   * Invalide le cache de manière intelligente
   */
  static invalidateUserCache(userId: string | number): void {
    authCache.invalidateUser(userId.toString());
  }

  static invalidateSessionCache(sessionId: string): void {
    authCache.invalidateSession(sessionId);
  }

  /**
   * Invalide le cache lors de changements de permissions
   */
  static invalidateRoleCache(roleId: string | number): void {
    // Invalider tous les utilisateurs avec ce rôle
    // En production, on pourrait avoir un index role -> users
    authCache.clear(); // Solution simple mais efficace
  }

  /**
   * Mise à jour des métriques de performance
   */
  private static updateMetrics(startTime: number, wasFromCache: boolean, queryCount: number): void {
    const responseTime = Date.now() - startTime;
    
    // Mise à jour de la moyenne avec algorithme de moyenne mobile
    const alpha = 0.1; // Facteur de lissage
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
    
    // Calcul de la réduction de requêtes (base: 4 requêtes)
    const baselineQueries = 4;
    const reduction = ((baselineQueries - queryCount) / baselineQueries) * 100;
    this.metrics.queryReduction = 
      this.metrics.queryReduction * (1 - alpha) + reduction * alpha;
  }

  /**
   * Statistiques de performance détaillées
   */
  static getPerformanceMetrics(): AuthMetrics & {
    cacheEfficiency: number;
    requestsPerSecond: number;
    cacheSizeInfo: any;
  } {
    const cacheStats = authCache.getStats();
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheEfficiency = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
    
    return {
      ...this.metrics,
      cacheEfficiency: Math.round(cacheEfficiency * 100) / 100,
      requestsPerSecond: this.metrics.totalRequests / 60, // Approximation
      cacheSizeInfo: cacheStats
    };
  }

  /**
   * Reset des métriques pour les tests
   */
  static resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      queryReduction: 0
    };
  }

  /**
   * Pré-chargement intelligent du cache
   */
  static async warmupCache(userIds: number[]): Promise<{
    success: number;
    failed: number;
    totalTime: number;
  }> {
    const startTime = Date.now();
    let success = 0;
    let failed = 0;

    console.log(`🔥 Pré-chargement du cache d'authentification pour ${userIds.length} utilisateurs...`);

    for (const userId of userIds) {
      try {
        const authData = await getUserWithRoleAndPermissions(userId.toString());
        if (authData) {
          const { user, role, permissions } = authData;
          authCache.setUserAuth(
            userId.toString(), 
            `warmup-${userId}`, 
            user, 
            role, 
            permissions
          );
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.warn(`Erreur pré-chargement utilisateur ${userId}:`, error);
        failed++;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Cache pré-chargé: ${success} succès, ${failed} échecs en ${totalTime}ms`);

    return { success, failed, totalTime };
  }

  /**
   * Monitoring temps réel des performances
   */
  static startPerformanceMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      
      if (metrics.totalRequests > 0) {
        console.log(`📊 Auth Performance: ${metrics.cacheEfficiency.toFixed(1)}% cache hit, ${metrics.averageResponseTime.toFixed(1)}ms avg, ${metrics.queryReduction.toFixed(1)}% query reduction`);
        
        // Alertes de performance
        if (metrics.cacheEfficiency < 60) {
          console.warn('⚠️ Cache d\'authentification inefficace (<60% hit rate)');
        }
        
        if (metrics.averageResponseTime > 100) {
          console.warn('⚠️ Temps de réponse d\'authentification élevé (>100ms)');
        }
      }
    }, intervalMs);
  }
}

// Fonctions exports pour compatibilité
export const authenticateUser = AuthMiddlewareOptimized.authenticateUser.bind(AuthMiddlewareOptimized);
export const validateIdParameter = AuthMiddlewareOptimized.validateIdParameter.bind(AuthMiddlewareOptimized);
export const handleDatabaseError = AuthMiddlewareOptimized.handleDatabaseError.bind(AuthMiddlewareOptimized);

// Exports pour monitoring et cache
export const invalidateUserCache = AuthMiddlewareOptimized.invalidateUserCache.bind(AuthMiddlewareOptimized);
export const invalidateSessionCache = AuthMiddlewareOptimized.invalidateSessionCache.bind(AuthMiddlewareOptimized);
export const getAuthPerformanceMetrics = AuthMiddlewareOptimized.getPerformanceMetrics.bind(AuthMiddlewareOptimized);
export const warmupAuthCache = AuthMiddlewareOptimized.warmupCache.bind(AuthMiddlewareOptimized);
export const startAuthPerformanceMonitoring = AuthMiddlewareOptimized.startPerformanceMonitoring.bind(AuthMiddlewareOptimized);

export default AuthMiddlewareOptimized;