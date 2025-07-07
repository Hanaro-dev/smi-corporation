/**
 * Service de queue intelligent pour le traitement d'images
 * Gère la concurrence et évite la surcharge du système
 */
import { EventEmitter } from 'events';
const { ImageWorker } = require('../workers/image-processor.js');
import type { ProcessingJob, ProcessingResult, QueueStats } from '../types/index.js';

interface ProcessingJob {
  id: string;
  type: 'variants' | 'crop' | 'optimize';
  imageBuffer: Buffer;
  filename: string;
  outputDir: string;
  cropOptions?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  priority: 'low' | 'normal' | 'high';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
}

interface ProcessingResult {
  jobId: string;
  success: boolean;
  results?: any;
  error?: string;
  processingTime: number;
  memoryUsage?: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  throughput: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export class ImageProcessingQueue extends EventEmitter {
  private queue: ProcessingJob[] = [];
  private processing = new Set<string>();
  private completed = new Map<string, ProcessingResult>();
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    averageProcessingTime: 0,
    throughput: 0,
    memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0 }
  };

  private readonly maxConcurrency: number;
  private readonly maxRetries: number;
  private readonly jobTimeout: number;
  private readonly cleanupInterval: number;
  private processingTimes: number[] = [];
  private lastThroughputUpdate = Date.now();
  private jobsCompletedSinceLastUpdate = 0;

  constructor(options: {
    maxConcurrency?: number;
    maxRetries?: number;
    jobTimeout?: number;
    cleanupInterval?: number;
  } = {}) {
    super();
    
    this.maxConcurrency = options.maxConcurrency || 3;
    this.maxRetries = options.maxRetries || 2;
    this.jobTimeout = options.jobTimeout || 60000; // 60 secondes
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    
    this.startCleanupTimer();
    this.startStatsUpdate();
    
    console.log(`🎯 Image Processing Queue initialisée: ${this.maxConcurrency} workers max`);
  }

  /**
   * Ajoute un job de traitement d'images à la queue
   */
  async addJob(
    type: ProcessingJob['type'],
    imageBuffer: Buffer,
    filename: string,
    outputDir: string,
    options: {
      cropOptions?: ProcessingJob['cropOptions'];
      priority?: ProcessingJob['priority'];
    } = {}
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ProcessingJob = {
      id: jobId,
      type,
      imageBuffer,
      filename,
      outputDir,
      cropOptions: options.cropOptions,
      priority: options.priority || 'normal',
      createdAt: Date.now(),
      retryCount: 0
    };

    // Insertion basée sur la priorité
    this.insertJobByPriority(job);
    this.updateStats();
    
    // Démarrer le traitement si possible
    this.processNext();
    
    this.emit('jobAdded', { jobId, type, priority: job.priority });
    
    return jobId;
  }

  /**
   * Récupère le statut d'un job
   */
  getJobStatus(jobId: string): {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
    progress?: number;
    result?: ProcessingResult;
    position?: number;
  } {
    // Vérifier si complété
    const result = this.completed.get(jobId);
    if (result) {
      return {
        status: result.success ? 'completed' : 'failed',
        result
      };
    }

    // Vérifier si en cours de traitement
    if (this.processing.has(jobId)) {
      return {
        status: 'processing',
        progress: 50 // Estimation simple
      };
    }

    // Vérifier si en attente
    const queuePosition = this.queue.findIndex(job => job.id === jobId);
    if (queuePosition >= 0) {
      return {
        status: 'pending',
        position: queuePosition + 1
      };
    }

    return { status: 'not_found' };
  }

  /**
   * Annule un job (si possible)
   */
  cancelJob(jobId: string): boolean {
    // Supprimer de la queue si en attente
    const queueIndex = this.queue.findIndex(job => job.id === jobId);
    if (queueIndex >= 0) {
      this.queue.splice(queueIndex, 1);
      this.updateStats();
      this.emit('jobCancelled', { jobId });
      return true;
    }

    // Impossible d'annuler un job en cours de traitement
    return false;
  }

  /**
   * Traite le prochain job dans la queue
   */
  private async processNext(): Promise<void> {
    if (this.processing.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.processing.add(job.id);
    job.startedAt = Date.now();
    this.updateStats();

    this.emit('jobStarted', { jobId: job.id, type: job.type });

    try {
      const result = await this.executeJob(job);
      this.handleJobSuccess(job, result);
    } catch (error) {
      this.handleJobError(job, error);
    }

    // Traiter le job suivant
    setImmediate(() => this.processNext());
  }

  /**
   * Exécute un job spécifique
   */
  private async executeJob(job: ProcessingJob): Promise<any> {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout')), this.jobTimeout);
    });

    const processing = this.executeJobType(job);

    return Promise.race([processing, timeout]);
  }

  /**
   * Exécute le job selon son type
   */
  private async executeJobType(job: ProcessingJob): Promise<any> {
    switch (job.type) {
      case 'variants':
        return await ImageWorker.processVariants(
          job.imageBuffer,
          job.filename,
          job.outputDir
        );
        
      case 'crop':
        if (!job.cropOptions) {
          throw new Error('Options de recadrage manquantes');
        }
        return await ImageWorker.processCrop(
          job.imageBuffer,
          job.cropOptions,
          job.filename,
          job.outputDir
        );
        
      default:
        throw new Error(`Type de job non supporté: ${job.type}`);
    }
  }

  /**
   * Gère le succès d'un job
   */
  private handleJobSuccess(job: ProcessingJob, results: any): void {
    const processingTime = Date.now() - (job.startedAt || job.createdAt);
    const memoryUsage = process.memoryUsage().heapUsed;

    const result: ProcessingResult = {
      jobId: job.id,
      success: true,
      results,
      processingTime,
      memoryUsage
    };

    this.completed.set(job.id, result);
    this.processing.delete(job.id);
    
    // Mise à jour des statistiques
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-50);
    }
    
    this.jobsCompletedSinceLastUpdate++;
    this.updateStats();

    this.emit('jobCompleted', { jobId: job.id, result });
    
    console.log(`✅ Job ${job.id} complété en ${processingTime}ms`);
  }

  /**
   * Gère l'échec d'un job
   */
  private handleJobError(job: ProcessingJob, error: any): void {
    console.error(`❌ Erreur job ${job.id}:`, error);

    // Retry logic
    if (job.retryCount < this.maxRetries) {
      job.retryCount++;
      job.startedAt = undefined;
      
      // Réinsérer dans la queue avec priorité réduite
      this.insertJobByPriority({ ...job, priority: 'low' });
      this.processing.delete(job.id);
      
      this.emit('jobRetry', { jobId: job.id, retryCount: job.retryCount });
      
      console.log(`🔄 Retry job ${job.id} (tentative ${job.retryCount}/${this.maxRetries})`);
      return;
    }

    // Échec définitif
    const processingTime = Date.now() - (job.startedAt || job.createdAt);
    
    const result: ProcessingResult = {
      jobId: job.id,
      success: false,
      error: error.message,
      processingTime
    };

    this.completed.set(job.id, result);
    this.processing.delete(job.id);
    this.updateStats();

    this.emit('jobFailed', { jobId: job.id, error: error.message });
  }

  /**
   * Insertion d'un job selon sa priorité
   */
  private insertJobByPriority(job: ProcessingJob): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[job.priority] < priorityOrder[this.queue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, job);
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    const memUsage = process.memoryUsage();
    
    this.stats = {
      pending: this.queue.length,
      processing: this.processing.size,
      completed: Array.from(this.completed.values()).filter(r => r.success).length,
      failed: Array.from(this.completed.values()).filter(r => !r.success).length,
      averageProcessingTime: this.processingTimes.length > 0 
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length 
        : 0,
      throughput: this.calculateThroughput(),
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      }
    };
  }

  /**
   * Calcule le débit (jobs/minute)
   */
  private calculateThroughput(): number {
    const now = Date.now();
    const elapsed = now - this.lastThroughputUpdate;
    
    if (elapsed >= 60000) { // Chaque minute
      const throughput = (this.jobsCompletedSinceLastUpdate / elapsed) * 60000;
      this.lastThroughputUpdate = now;
      this.jobsCompletedSinceLastUpdate = 0;
      return Math.round(throughput * 100) / 100;
    }
    
    return this.stats.throughput;
  }

  /**
   * Démarre le timer de nettoyage
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.cleanupInterval;
      const beforeSize = this.completed.size;
      
      for (const [jobId, result] of this.completed.entries()) {
        if (result.jobId && Date.now() - cutoff > this.cleanupInterval) {
          this.completed.delete(jobId);
        }
      }
      
      const cleaned = beforeSize - this.completed.size;
      if (cleaned > 0) {
        console.log(`🧹 Nettoyage: ${cleaned} jobs complétés supprimés du cache`);
      }
    }, this.cleanupInterval);
  }

  /**
   * Démarre la mise à jour périodique des stats
   */
  private startStatsUpdate(): void {
    setInterval(() => {
      this.updateStats();
      this.emit('statsUpdated', this.stats);
    }, 10000); // Toutes les 10 secondes
  }

  /**
   * Récupère les statistiques actuelles
   */
  getStats(): QueueStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Vide la queue (mode maintenance)
   */
  clear(): void {
    this.queue.length = 0;
    this.processing.clear();
    this.completed.clear();
    this.processingTimes.length = 0;
    this.updateStats();
    
    this.emit('queueCleared');
    console.log('🗑️ Queue d\'images vidée');
  }

  /**
   * Ferme proprement le service
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Arrêt du service de queue d\'images...');
    
    // Attendre que tous les jobs en cours se terminent
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout lors de l\'arrêt, forçage...');
    }, 30000);
    
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    clearTimeout(timeout);
    console.log('✅ Service de queue d\'images arrêté proprement');
  }
}

// Instance globale du service
export const imageProcessingQueue = new ImageProcessingQueue({
  maxConcurrency: 3,
  maxRetries: 2,
  jobTimeout: 60000,
  cleanupInterval: 300000
});

// Monitoring des événements
imageProcessingQueue.on('jobCompleted', ({ jobId, result }) => {
  console.log(`📸 Image traitée: ${jobId} en ${result.processingTime}ms`);
});

imageProcessingQueue.on('jobFailed', ({ jobId, error }) => {
  console.error(`💥 Échec traitement image: ${jobId} - ${error}`);
});

// Export pour tests et monitoring
export { ProcessingJob, ProcessingResult, QueueStats };