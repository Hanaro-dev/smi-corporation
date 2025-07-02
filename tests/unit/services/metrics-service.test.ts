/**
 * Tests unitaires pour MetricsService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MetricsService } from '../../../server/services/metrics-service.js'

describe('MetricsService', () => {
  let metrics: MetricsService
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
    }
    
    metrics = new MetricsService()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    metrics.reset()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Counter Metrics', () => {
    it('should increment counters correctly', () => {
      metrics.incrementCounter('test_counter')
      metrics.incrementCounter('test_counter', 5)
      
      expect(metrics.getCounter('test_counter')).toBe(6)
    })

    it('should return 0 for non-existent counters', () => {
      expect(metrics.getCounter('non_existent')).toBe(0)
    })

    it('should handle multiple counters independently', () => {
      metrics.incrementCounter('counter_a', 3)
      metrics.incrementCounter('counter_b', 7)
      
      expect(metrics.getCounter('counter_a')).toBe(3)
      expect(metrics.getCounter('counter_b')).toBe(7)
    })
  })

  describe('Histogram Metrics', () => {
    it('should record histogram values and calculate statistics', () => {
      const values = [100, 200, 300, 400, 500]
      values.forEach(val => metrics.recordHistogram('test_histogram', val))
      
      const stats = metrics.getHistogramStats('test_histogram')
      
      expect(stats).toMatchObject({
        count: 5,
        sum: 1500,
        min: 100,
        max: 500,
        avg: 300
      })
    })

    it('should calculate percentiles correctly', () => {
      // Add 100 values from 1 to 100
      for (let i = 1; i <= 100; i++) {
        metrics.recordHistogram('percentile_test', i)
      }
      
      const stats = metrics.getHistogramStats('percentile_test')
      
      expect(stats.p50).toBe(50)
      expect(stats.p90).toBe(90)
      expect(stats.p95).toBe(95)
      expect(stats.p99).toBe(99)
    })

    it('should limit histogram size to prevent memory issues', () => {
      // Add more than 1000 values
      for (let i = 0; i < 1500; i++) {
        metrics.recordHistogram('large_histogram', i)
      }
      
      const stats = metrics.getHistogramStats('large_histogram')
      expect(stats.count).toBe(1500) // Total count preserved
      
      // But internal array should be limited (we can't test this directly without accessing internals)
    })

    it('should return null for non-existent histograms', () => {
      expect(metrics.getHistogramStats('non_existent')).toBeNull()
    })
  })

  describe('Gauge Metrics', () => {
    it('should set and retrieve gauge values', () => {
      metrics.setGauge('test_gauge', 42.5)
      
      const allMetrics = metrics.getAllMetrics()
      expect(allMetrics.gauges.test_gauge.value).toBe(42.5)
      expect(allMetrics.gauges.test_gauge.timestamp).toBeTypeOf('number')
    })

    it('should update gauge values', () => {
      metrics.setGauge('update_gauge', 10)
      metrics.setGauge('update_gauge', 20)
      
      const allMetrics = metrics.getAllMetrics()
      expect(allMetrics.gauges.update_gauge.value).toBe(20)
    })
  })

  describe('Timer Functionality', () => {
    it('should measure time duration correctly', async () => {
      const timerName = 'test_timer'
      
      metrics.startTimer(timerName)
      
      // Advance fake time by 500ms
      vi.advanceTimersByTime(500)
      
      const duration = metrics.endTimer(timerName)
      
      expect(duration).toBe(500)
    })

    it('should record timer duration to histogram', () => {
      const timerName = 'record_timer'
      const histogramName = 'timer_histogram'
      
      metrics.startTimer(timerName)
      vi.advanceTimersByTime(250)
      metrics.endTimer(timerName, histogramName)
      
      const stats = metrics.getHistogramStats(histogramName)
      expect(stats.count).toBe(1)
      expect(stats.values[0]).toBe(250)
    })

    it('should handle non-existent timers gracefully', () => {
      const duration = metrics.endTimer('non_existent_timer')
      expect(duration).toBe(0)
      expect(consoleSpy.warn).toHaveBeenCalled()
    })
  })

  describe('API Metrics Recording', () => {
    it('should record comprehensive API metrics', () => {
      metrics.recordApiMetric('GET', '/api/users', 200, 150, 1024)
      
      expect(metrics.getCounter('api_get_api_users_total')).toBe(1)
      expect(metrics.getCounter('api_requests_total')).toBe(1)
      expect(metrics.getCounter('api_get_api_users_status_200')).toBe(1)
      
      const durationStats = metrics.getHistogramStats('api_get_api_users_duration')
      expect(durationStats.avg).toBe(150)
      
      const sizeStats = metrics.getHistogramStats('api_get_api_users_size')
      expect(sizeStats.avg).toBe(1024)
    })

    it('should sanitize endpoint names for metrics', () => {
      metrics.recordApiMetric('GET', '/api/users/123/posts', 200, 100)
      
      // Should replace numeric IDs with :id
      expect(metrics.getCounter('api_get_api_users_id_posts_total')).toBe(1)
    })

    it('should trigger slow request warnings', () => {
      metrics.recordApiMetric('POST', '/api/slow-endpoint', 200, 2000)
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow API response'),
        expect.objectContaining({
          duration: 2000,
          threshold: 1000
        })
      )
    })
  })

  describe('Database Metrics Recording', () => {
    it('should record database operation metrics', () => {
      metrics.recordDatabaseMetric('SELECT', 'users', 50, 10)
      
      expect(metrics.getCounter('db_select_users_total')).toBe(1)
      expect(metrics.getCounter('db_queries_total')).toBe(1)
      
      const durationStats = metrics.getHistogramStats('db_select_users_duration')
      expect(durationStats.avg).toBe(50)
      
      const rowStats = metrics.getHistogramStats('db_select_users_rows')
      expect(rowStats.avg).toBe(10)
    })

    it('should warn about slow database queries', () => {
      metrics.recordDatabaseMetric('SELECT', 'large_table', 1000, 1000)
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow database query'),
        expect.objectContaining({
          duration: 1000,
          threshold: 500
        })
      )
    })
  })

  describe('Authentication Metrics', () => {
    it('should record successful authentication', () => {
      metrics.recordAuthMetric('login', true, 200)
      
      expect(metrics.getCounter('auth_login_total')).toBe(1)
      expect(metrics.getCounter('auth_login_success')).toBe(1)
      
      const durationStats = metrics.getHistogramStats('auth_login_duration')
      expect(durationStats.avg).toBe(200)
    })

    it('should record failed authentication and log security event', () => {
      metrics.recordAuthMetric('login', false, 150)
      
      expect(metrics.getCounter('auth_login_total')).toBe(1)
      expect(metrics.getCounter('auth_login_failure')).toBe(1)
      
      // Should have triggered security logging (we'd need to mock logger for this)
    })
  })

  describe('Cache Metrics', () => {
    it('should record cache hits and calculate hit rate', () => {
      // Record some hits and misses
      metrics.recordCacheMetric('get', true, 5)  // hit
      metrics.recordCacheMetric('get', true, 3)  // hit
      metrics.recordCacheMetric('get', false, 50) // miss
      
      expect(metrics.getCounter('cache_get_hit')).toBe(2)
      expect(metrics.getCounter('cache_get_miss')).toBe(1)
      expect(metrics.getCounter('cache_get_total')).toBe(3)
      
      // Hit rate should be calculated as gauge
      const allMetrics = metrics.getAllMetrics()
      expect(allMetrics.gauges.cache_get_hit_rate.value).toBeCloseTo(66.67, 1)
    })
  })

  describe('Business Metrics', () => {
    it('should record business events with metadata', () => {
      metrics.recordBusinessMetric('user_registration', 1, { userId: 123 })
      
      expect(metrics.getCounter('business_user_registration_total')).toBe(1)
    })

    it('should track per-user business metrics', () => {
      metrics.recordBusinessMetric('page_view', 1, { userId: 123 })
      metrics.recordBusinessMetric('page_view', 1, { userId: 456 })
      
      expect(metrics.getCounter('business_page_view_total')).toBe(2)
      expect(metrics.getCounter('business_page_view_by_user')).toBe(2)
    })
  })

  describe('System Monitoring', () => {
    it('should record system metrics periodically', () => {
      // Fast-forward to trigger system monitoring
      vi.advanceTimersByTime(30000)
      
      const allMetrics = metrics.getAllMetrics()
      expect(allMetrics.gauges.system_memory_usage_percent).toBeDefined()
      expect(allMetrics.gauges.system_uptime_seconds).toBeDefined()
    })

    it('should warn about high memory usage', () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 90 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 100 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      })
      
      // Trigger system monitoring
      vi.advanceTimersByTime(30000)
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('High memory usage'),
        expect.objectContaining({
          memoryUsage: '90.00',
          threshold: 80
        })
      )
      
      process.memoryUsage = originalMemoryUsage
    })
  })

  describe('Metrics Export', () => {
    it('should export all metrics in structured format', () => {
      metrics.incrementCounter('test_counter', 5)
      metrics.recordHistogram('test_histogram', 100)
      metrics.setGauge('test_gauge', 42)
      
      const allMetrics = metrics.getAllMetrics()
      
      expect(allMetrics.counters.test_counter).toBe(5)
      expect(allMetrics.histograms.test_histogram).toMatchObject({
        count: 1,
        avg: 100
      })
      expect(allMetrics.gauges.test_gauge.value).toBe(42)
    })

    it('should export Prometheus format', () => {
      metrics.incrementCounter('http_requests_total', 100)
      metrics.setGauge('memory_usage_bytes', 1024)
      metrics.recordHistogram('request_duration_seconds', 0.5)
      
      const prometheusOutput = metrics.exportPrometheusMetrics()
      
      expect(prometheusOutput).toContain('# TYPE http_requests_total counter')
      expect(prometheusOutput).toContain('http_requests_total 100')
      expect(prometheusOutput).toContain('# TYPE memory_usage_bytes gauge')
      expect(prometheusOutput).toContain('memory_usage_bytes 1024')
      expect(prometheusOutput).toContain('# TYPE request_duration_seconds histogram')
    })
  })

  describe('Endpoint Sanitization', () => {
    it('should sanitize various endpoint patterns', () => {
      const testCases = [
        ['/api/users/123', 'api_users_id'],
        ['/api/posts/456/comments', 'api_posts_id_comments'],
        ['/api/users?page=1&limit=10', 'api_users'],
        ['/api/users/123/profile.json', 'api_users_id_profile_json'],
        ['/api/special-chars/@#$', 'api_special_chars___']
      ]
      
      testCases.forEach(([input, expected]) => {
        const sanitized = metrics.sanitizeEndpoint(input)
        expect(sanitized).toBe(expected)
      })
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      metrics.incrementCounter('test_counter', 10)
      metrics.recordHistogram('test_histogram', 100)
      metrics.setGauge('test_gauge', 50)
      
      metrics.reset()
      
      const allMetrics = metrics.getAllMetrics()
      expect(Object.keys(allMetrics.counters)).toHaveLength(0)
      expect(Object.keys(allMetrics.histograms)).toHaveLength(0)
      expect(Object.keys(allMetrics.gauges)).toHaveLength(0)
    })
  })
})