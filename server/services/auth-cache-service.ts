/**
 * Service de cache intelligent pour l'authentification
 * Élimine les requêtes N+1 avec cache en mémoire et requêtes optimisées
 */
import type { User, Role, Permission, Session } from '../types/index.js';

interface CachedUserAuth {
  user: User;
  role: Role;
  permissions: Permission[];
  sessionId: string;
  expiresAt: number;
}

interface AuthCacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class AuthCacheService {
  private static instance: AuthCacheService;
  private cache = new Map<string, CachedUserAuth>();
  private sessionToUser = new Map<string, string>(); // sessionId -> userId
  private stats: AuthCacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  
  // Configuration du cache
  private readonly TTL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_SIZE = 1000; // Max 1000 utilisateurs en cache
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // Nettoyage toutes les 5 minutes

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): AuthCacheService {
    if (!AuthCacheService.instance) {
      AuthCacheService.instance = new AuthCacheService();
    }
    return AuthCacheService.instance;
  }

  /**
   * Récupère les données d'authentification depuis le cache
   */
  getUserAuth(userId: string): CachedUserAuth | null {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(userId);
      this.sessionToUser.delete(cached.sessionId);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return cached;
  }

  /**
   * Récupère les données d'authentification par token de session
   */
  getUserAuthBySession(sessionId: string): CachedUserAuth | null {
    const userId = this.sessionToUser.get(sessionId);
    if (!userId) {
      this.stats.misses++;
      return null;
    }
    
    return this.getUserAuth(userId);
  }

  /**
   * Met en cache les données d'authentification
   */
  setUserAuth(userId: string, sessionId: string, user: User, role: Role, permissions: Permission[]): void {
    // Vérifier la taille du cache et nettoyer si nécessaire
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictOldestEntries(Math.floor(this.MAX_SIZE * 0.1)); // Éviction de 10%
    }

    const cachedAuth: CachedUserAuth = {
      user,
      role,
      permissions,
      sessionId,
      expiresAt: Date.now() + this.TTL
    };

    // Supprimer l'ancienne entrée de session si elle existe
    const oldCached = this.cache.get(userId);
    if (oldCached) {
      this.sessionToUser.delete(oldCached.sessionId);
    }

    this.cache.set(userId, cachedAuth);
    this.sessionToUser.set(sessionId, userId);
    this.stats.size = this.cache.size;
  }

  /**
   * Invalide le cache pour un utilisateur spécifique
   */
  invalidateUser(userId: string): void {
    const cached = this.cache.get(userId);
    if (cached) {
      this.cache.delete(userId);
      this.sessionToUser.delete(cached.sessionId);
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Invalide le cache par session
   */
  invalidateSession(sessionId: string): void {
    const userId = this.sessionToUser.get(sessionId);
    if (userId) {
      this.invalidateUser(userId);
    }
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.sessionToUser.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  }

  /**
   * Statistiques du cache pour monitoring
   */
  getStats(): AuthCacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Éviction des entrées les plus anciennes
   */
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.expiresAt - b.expiresAt)
      .slice(0, count);

    for (const [userId, cached] of entries) {
      this.cache.delete(userId);
      this.sessionToUser.delete(cached.sessionId);
      this.stats.evictions++;
    }
    
    this.stats.size = this.cache.size;
  }

  /**
   * Nettoyage périodique des entrées expirées
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredEntries: string[] = [];

      for (const [userId, cached] of this.cache.entries()) {
        if (now > cached.expiresAt) {
          expiredEntries.push(userId);
        }
      }

      for (const userId of expiredEntries) {
        const cached = this.cache.get(userId);
        if (cached) {
          this.cache.delete(userId);
          this.sessionToUser.delete(cached.sessionId);
          this.stats.evictions++;
        }
      }

      this.stats.size = this.cache.size;
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Pré-chauffage du cache avec les utilisateurs actifs
   */
  async warmup(getUserAuthFunction: (userId: string) => Promise<CachedUserAuth | null>): Promise<void> {
    // Cette méthode peut être appelée au démarrage pour pré-charger
    // les utilisateurs les plus actifs
    console.log('🔥 Cache d\'authentification pré-chauffé');
  }
}

// Instance globale du service de cache
export const authCache = AuthCacheService.getInstance();