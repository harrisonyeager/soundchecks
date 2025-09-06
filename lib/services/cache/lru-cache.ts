/**
 * Generic LRU (Least Recently Used) cache implementation with TTL support
 * Thread-safe operations with configurable memory management
 */
export interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  size: number
  hitRate: number
}

export interface CacheEntry<T> {
  value: T
  timestamp: number
  expiresAt: number | null
  accessCount: number
}

export interface LRUCacheConfig {
  /** Maximum number of entries to store */
  maxSize: number
  /** Default TTL in milliseconds (0 = no TTL) */
  defaultTTL: number
  /** Cleanup interval for expired entries in milliseconds */
  cleanupInterval: number
  /** Enable performance metrics tracking */
  enableMetrics: boolean
}

export const DEFAULT_LRU_CONFIG: LRUCacheConfig = {
  maxSize: 1000,
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 60000, // 1 minute
  enableMetrics: true
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder = new Set<string>()
  private config: LRUCacheConfig
  private metrics: CacheMetrics
  private cleanupTimer: NodeJS.Timeout | null = null
  private readonly lock = new Set<string>() // Simple lock mechanism

  constructor(config: Partial<LRUCacheConfig> = {}) {
    this.config = { ...DEFAULT_LRU_CONFIG, ...config }
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0
    }

    if (this.config.cleanupInterval > 0) {
      this.startCleanupTimer()
    }
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found/expired
   */
  public get(key: string): T | undefined {
    // Wait for any ongoing operations on this key
    while (this.lock.has(key)) {
      // Simple spin lock - in real world, use proper async locks
    }

    const entry = this.cache.get(key)
    
    if (!entry) {
      this.recordMiss()
      return undefined
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      this.updateSize()
      this.recordMiss()
      return undefined
    }

    // Update access order (move to end)
    this.accessOrder.delete(key)
    this.accessOrder.add(key)
    entry.accessCount++
    
    this.recordHit()
    return entry.value
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (overrides default)
   */
  public set(key: string, value: T, ttl?: number): void {
    this.lock.add(key)

    try {
      const now = Date.now()
      const effectiveTTL = ttl ?? this.config.defaultTTL
      const expiresAt = effectiveTTL > 0 ? now + effectiveTTL : null

      const entry: CacheEntry<T> = {
        value,
        timestamp: now,
        expiresAt,
        accessCount: 1
      }

      // If key exists, just update it
      if (this.cache.has(key)) {
        this.cache.set(key, entry)
        // Move to end of access order
        this.accessOrder.delete(key)
        this.accessOrder.add(key)
        return
      }

      // Check if we need to evict entries
      if (this.cache.size >= this.config.maxSize) {
        this.evictLRU()
      }

      this.cache.set(key, entry)
      this.accessOrder.add(key)
      this.updateSize()
    } finally {
      this.lock.delete(key)
    }
  }

  /**
   * Check if key exists in cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      this.updateSize()
      return false
    }

    return true
  }

  /**
   * Delete entry from cache
   * @param key Cache key
   * @returns True if entry was deleted
   */
  public delete(key: string): boolean {
    this.lock.add(key)

    try {
      const deleted = this.cache.delete(key)
      if (deleted) {
        this.accessOrder.delete(key)
        this.updateSize()
      }
      return deleted
    } finally {
      this.lock.delete(key)
    }
  }

  /**
   * Clear all entries from cache
   */
  public clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.resetMetrics()
  }

  /**
   * Get current cache size
   * @returns Number of entries in cache
   */
  public size(): number {
    return this.cache.size
  }

  /**
   * Get cache metrics
   * @returns Current performance metrics
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics counters
   */
  public resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: this.cache.size,
      hitRate: 0
    }
  }

  /**
   * Get all cache keys (for debugging/monitoring)
   * @returns Array of cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Manual cleanup of expired entries
   * @returns Number of entries removed
   */
  public cleanup(): number {
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        this.accessOrder.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      this.updateSize()
    }

    return removed
  }

  /**
   * Get cache statistics
   * @returns Detailed cache statistics
   */
  public getStats(): {
    size: number
    maxSize: number
    utilization: number
    oldestEntry: number | null
    newestEntry: number | null
    averageAge: number
  } {
    if (this.cache.size === 0) {
      return {
        size: 0,
        maxSize: this.config.maxSize,
        utilization: 0,
        oldestEntry: null,
        newestEntry: null,
        averageAge: 0
      }
    }

    const now = Date.now()
    let oldestTimestamp = Infinity
    let newestTimestamp = 0
    let totalAge = 0

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp
      totalAge += age
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp)
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp)
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      utilization: (this.cache.size / this.config.maxSize) * 100,
      oldestEntry: oldestTimestamp === Infinity ? null : now - oldestTimestamp,
      newestEntry: now - newestTimestamp,
      averageAge: totalAge / this.cache.size
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt
  }

  private evictLRU(): void {
    // Get the least recently used key (first in the set)
    const lruKey = this.accessOrder.values().next().value
    
    if (lruKey) {
      this.cache.delete(lruKey)
      this.accessOrder.delete(lruKey)
      this.metrics.evictions++
      this.updateSize()
    }
  }

  private recordHit(): void {
    if (this.config.enableMetrics) {
      this.metrics.hits++
      this.updateHitRate()
    }
  }

  private recordMiss(): void {
    if (this.config.enableMetrics) {
      this.metrics.misses++
      this.updateHitRate()
    }
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0
  }

  private updateSize(): void {
    this.metrics.size = this.cache.size
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }
}