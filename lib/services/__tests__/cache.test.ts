import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { LRUCache, type LRUCacheConfig, DEFAULT_LRU_CONFIG } from '../cache/lru-cache'

describe('LRUCache', () => {
  let cache: LRUCache<string>

  beforeEach(() => {
    // Use shorter intervals for testing
    const testConfig: Partial<LRUCacheConfig> = {
      maxSize: 5,
      defaultTTL: 1000, // 1 second
      cleanupInterval: 100, // 100ms
      enableMetrics: true
    }
    cache = new LRUCache(testConfig)
  })

  afterEach(() => {
    cache.destroy()
  })

  describe('Constructor and Configuration', () => {
    test('should create cache with default config', () => {
      const defaultCache = new LRUCache<string>()
      
      expect(defaultCache.size()).toBe(0)
      expect(defaultCache.getMetrics().size).toBe(0)
      
      defaultCache.destroy()
    })

    test('should create cache with custom config', () => {
      const customConfig: Partial<LRUCacheConfig> = {
        maxSize: 10,
        defaultTTL: 2000,
        enableMetrics: false
      }
      
      const customCache = new LRUCache<number>(customConfig)
      expect(customCache.size()).toBe(0)
      
      customCache.destroy()
    })

    test('should merge custom config with defaults', () => {
      const partialConfig: Partial<LRUCacheConfig> = {
        maxSize: 100
      }
      
      const cache = new LRUCache<string>(partialConfig)
      
      // Should use custom maxSize but default other values
      cache.set('test1', 'value1')
      expect(cache.size()).toBe(1)
      
      cache.destroy()
    })
  })

  describe('Basic Cache Operations', () => {
    test('should set and get values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    test('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    test('should check if key exists', () => {
      cache.set('key1', 'value1')
      
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('nonexistent')).toBe(false)
    })

    test('should delete keys', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      
      expect(cache.delete('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
      expect(cache.delete('nonexistent')).toBe(false)
    })

    test('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      expect(cache.size()).toBe(2)
      
      cache.clear()
      
      expect(cache.size()).toBe(0)
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
    })

    test('should track cache size accurately', () => {
      expect(cache.size()).toBe(0)
      
      cache.set('key1', 'value1')
      expect(cache.size()).toBe(1)
      
      cache.set('key2', 'value2')
      expect(cache.size()).toBe(2)
      
      cache.delete('key1')
      expect(cache.size()).toBe(1)
      
      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('LRU Eviction', () => {
    test('should evict least recently used items when maxSize exceeded', () => {
      // Fill cache to capacity (maxSize: 5)
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4')
      cache.set('key5', 'value5')
      
      expect(cache.size()).toBe(5)
      
      // Adding 6th item should evict key1 (least recently used)
      cache.set('key6', 'value6')
      
      expect(cache.size()).toBe(5)
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key6')).toBe('value6')
    })

    test('should update access order on get', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4')
      cache.set('key5', 'value5')
      
      // Access key1 to make it most recently used
      cache.get('key1')
      
      // Add new item - should evict key2 (now least recently used)
      cache.set('key6', 'value6')
      
      expect(cache.get('key1')).toBe('value1') // Should still exist
      expect(cache.get('key2')).toBeUndefined() // Should be evicted
    })

    test('should update access order on set for existing keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4')
      cache.set('key5', 'value5')
      
      // Update key1 to make it most recently used
      cache.set('key1', 'updated_value1')
      
      // Add new item - should evict key2
      cache.set('key6', 'value6')
      
      expect(cache.get('key1')).toBe('updated_value1')
      expect(cache.get('key2')).toBeUndefined()
    })
  })

  describe('TTL (Time To Live)', () => {
    test('should expire entries after TTL', async () => {
      const shortTTLCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 50, // 50ms
        cleanupInterval: 0 // Disable automatic cleanup
      })
      
      shortTTLCache.set('key1', 'value1')
      expect(shortTTLCache.get('key1')).toBe('value1')
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(shortTTLCache.get('key1')).toBeUndefined()
      
      shortTTLCache.destroy()
    })

    test('should use custom TTL when provided', async () => {
      cache.set('key1', 'value1', 50) // Custom 50ms TTL
      cache.set('key2', 'value2') // Default 1000ms TTL
      
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
      
      // Wait for custom TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(cache.get('key1')).toBeUndefined() // Should be expired
      expect(cache.get('key2')).toBe('value2') // Should still exist
    })

    test('should handle entries with no TTL (TTL = 0)', () => {
      const noTTLCache = new LRUCache<string>({
        maxSize: 5,
        defaultTTL: 0 // No expiration
      })
      
      noTTLCache.set('key1', 'value1')
      expect(noTTLCache.get('key1')).toBe('value1')
      
      // Entry should not expire
      expect(noTTLCache.has('key1')).toBe(true)
      
      noTTLCache.destroy()
    })

    test('should remove expired entries on has() check', async () => {
      const shortTTLCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 50,
        cleanupInterval: 0
      })
      
      shortTTLCache.set('key1', 'value1')
      expect(shortTTLCache.has('key1')).toBe(true)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(shortTTLCache.has('key1')).toBe(false)
      expect(shortTTLCache.size()).toBe(0) // Should be cleaned up
      
      shortTTLCache.destroy()
    })
  })

  describe('Cleanup Operations', () => {
    test('should manually cleanup expired entries', async () => {
      const shortTTLCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 50,
        cleanupInterval: 0 // Disable automatic cleanup
      })
      
      shortTTLCache.set('key1', 'value1')
      shortTTLCache.set('key2', 'value2')
      shortTTLCache.set('key3', 'value3')
      
      expect(shortTTLCache.size()).toBe(3)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Size should still be 3 before cleanup
      expect(shortTTLCache.size()).toBe(3)
      
      // Manual cleanup should remove all expired entries
      const removedCount = shortTTLCache.cleanup()
      expect(removedCount).toBe(3)
      expect(shortTTLCache.size()).toBe(0)
      
      shortTTLCache.destroy()
    })

    test('should automatically cleanup expired entries with timer', async () => {
      const autoCleanupCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 50,
        cleanupInterval: 75 // Cleanup every 75ms
      })
      
      autoCleanupCache.set('key1', 'value1')
      autoCleanupCache.set('key2', 'value2')
      
      expect(autoCleanupCache.size()).toBe(2)
      
      // Wait for expiration and cleanup
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be automatically cleaned up
      expect(autoCleanupCache.size()).toBe(0)
      
      autoCleanupCache.destroy()
    })

    test('should not cleanup non-expired entries', async () => {
      const mixedTTLCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 200, // Long default TTL
        cleanupInterval: 0
      })
      
      mixedTTLCache.set('short', 'value1', 50) // Short TTL
      mixedTTLCache.set('long', 'value2') // Long TTL
      
      // Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const removedCount = mixedTTLCache.cleanup()
      expect(removedCount).toBe(1)
      expect(mixedTTLCache.size()).toBe(1)
      expect(mixedTTLCache.get('long')).toBe('value2')
      
      mixedTTLCache.destroy()
    })
  })

  describe('Metrics and Performance Tracking', () => {
    test('should track hits and misses', () => {
      cache.set('key1', 'value1')
      
      // Hit
      cache.get('key1')
      // Miss
      cache.get('nonexistent')
      
      const metrics = cache.getMetrics()
      expect(metrics.hits).toBe(1)
      expect(metrics.misses).toBe(1)
      expect(metrics.hitRate).toBeCloseTo(50, 1) // 50%
    })

    test('should track evictions', () => {
      // Fill cache beyond capacity to trigger evictions
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`)
      }
      
      const metrics = cache.getMetrics()
      expect(metrics.evictions).toBe(5) // Should evict 5 items (10 - 5 maxSize)
    })

    test('should track cache size in metrics', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      const metrics = cache.getMetrics()
      expect(metrics.size).toBe(2)
    })

    test('should calculate hit rate accurately', () => {
      cache.set('key1', 'value1')
      
      // 3 hits
      cache.get('key1')
      cache.get('key1')
      cache.get('key1')
      
      // 1 miss
      cache.get('nonexistent')
      
      const metrics = cache.getMetrics()
      expect(metrics.hits).toBe(3)
      expect(metrics.misses).toBe(1)
      expect(metrics.hitRate).toBeCloseTo(75, 1) // 75%
    })

    test('should reset metrics', () => {
      cache.set('key1', 'value1')
      cache.get('key1')
      cache.get('nonexistent')
      
      let metrics = cache.getMetrics()
      expect(metrics.hits).toBeGreaterThan(0)
      expect(metrics.misses).toBeGreaterThan(0)
      
      cache.resetMetrics()
      
      metrics = cache.getMetrics()
      expect(metrics.hits).toBe(0)
      expect(metrics.misses).toBe(0)
      expect(metrics.hitRate).toBe(0)
      expect(metrics.evictions).toBe(0)
    })
  })

  describe('Cache Statistics', () => {
    test('should provide detailed statistics', async () => {
      cache.set('key1', 'value1')
      
      // Wait a small amount to ensure there's measurable age
      await new Promise(resolve => setTimeout(resolve, 10))
      
      cache.set('key2', 'value2')
      
      const stats = cache.getStats()
      
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(5)
      expect(stats.utilization).toBeCloseTo(40, 1) // 2/5 * 100 = 40%
      expect(stats.oldestEntry).toBeGreaterThan(0)
      expect(stats.newestEntry).toBeGreaterThanOrEqual(0)
      expect(stats.averageAge).toBeGreaterThan(0)
    })

    test('should handle empty cache statistics', () => {
      const stats = cache.getStats()
      
      expect(stats.size).toBe(0)
      expect(stats.maxSize).toBe(5)
      expect(stats.utilization).toBe(0)
      expect(stats.oldestEntry).toBeNull()
      expect(stats.newestEntry).toBeNull()
      expect(stats.averageAge).toBe(0)
    })

    test('should track entry ages accurately', () => {
      cache.set('old', 'value1')
      
      // Wait a bit
      setTimeout(() => {
        cache.set('new', 'value2')
        
        const stats = cache.getStats()
        expect(stats.oldestEntry).toBeGreaterThan(stats.newestEntry!)
      }, 10)
    })
  })

  describe('Key Management', () => {
    test('should return all cache keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      const keys = cache.keys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    test('should return empty array for empty cache', () => {
      expect(cache.keys()).toHaveLength(0)
    })

    test('should update keys list when items are evicted', () => {
      // Fill cache
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`)
      }
      
      const keys = cache.keys()
      expect(keys).toHaveLength(5) // Should only have 5 keys due to maxSize
      
      // Should contain the most recent keys
      expect(keys).toContain('key9')
      expect(keys).toContain('key8')
      expect(keys).toContain('key7')
      expect(keys).toContain('key6')
      expect(keys).toContain('key5')
    })
  })

  describe('Type Safety and Generics', () => {
    test('should work with different data types', () => {
      const numberCache = new LRUCache<number>({ maxSize: 3 })
      const objectCache = new LRUCache<{ id: number, name: string }>({ maxSize: 3 })
      
      // Number cache
      numberCache.set('num1', 42)
      numberCache.set('num2', 100)
      expect(numberCache.get('num1')).toBe(42)
      
      // Object cache
      const obj = { id: 1, name: 'Test' }
      objectCache.set('obj1', obj)
      expect(objectCache.get('obj1')).toEqual(obj)
      
      numberCache.destroy()
      objectCache.destroy()
    })

    test('should maintain type safety', () => {
      const stringCache = new LRUCache<string>({ maxSize: 3 })
      
      stringCache.set('key1', 'string_value')
      const result = stringCache.get('key1')
      
      // TypeScript should infer result as string | undefined
      expect(typeof result).toBe('string')
      
      stringCache.destroy()
    })
  })

  describe('Concurrency and Lock Mechanism', () => {
    test('should handle concurrent operations safely', () => {
      // Simulate concurrent sets
      const promises = []
      for (let i = 0; i < 20; i++) {
        promises.push(Promise.resolve().then(() => {
          cache.set(`concurrent_key_${i}`, `value_${i}`)
        }))
      }
      
      return Promise.all(promises).then(() => {
        // Cache should maintain consistency
        expect(cache.size()).toBeLessThanOrEqual(5) // Respect maxSize
        
        const keys = cache.keys()
        keys.forEach(key => {
          expect(cache.get(key)).toBeDefined()
        })
      })
    })

    test('should handle concurrent get/set operations', () => {
      cache.set('shared_key', 'initial_value')
      
      const promises = []
      
      // Concurrent reads
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve().then(() => {
          return cache.get('shared_key')
        }))
      }
      
      // Concurrent writes
      for (let i = 0; i < 5; i++) {
        promises.push(Promise.resolve().then(() => {
          cache.set(`key_${i}`, `value_${i}`)
        }))
      }
      
      return Promise.all(promises).then(results => {
        // All reads should return a value (either initial or undefined if evicted)
        const readResults = results.slice(0, 10)
        readResults.forEach(result => {
          expect(typeof result === 'string' || result === undefined).toBe(true)
        })
        
        // Cache should still be in valid state
        expect(cache.size()).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Memory Management and Cleanup', () => {
    test('should properly destroy cache and cleanup resources', () => {
      const timerCache = new LRUCache<string>({
        maxSize: 5,
        cleanupInterval: 100
      })
      
      timerCache.set('key1', 'value1')
      expect(timerCache.size()).toBe(1)
      
      timerCache.destroy()
      
      // After destruction, cache should be cleared
      expect(timerCache.size()).toBe(0)
      
      // Should not throw when destroyed multiple times
      expect(() => timerCache.destroy()).not.toThrow()
    })

    test('should handle large datasets efficiently', () => {
      const largeCache = new LRUCache<string>({
        maxSize: 1000,
        enableMetrics: true
      })
      
      const startTime = performance.now()
      
      // Add many items
      for (let i = 0; i < 5000; i++) {
        largeCache.set(`key_${i}`, `value_${i}`)
      }
      
      const addDuration = performance.now() - startTime
      expect(addDuration).toBeLessThan(1000) // Should be fast
      
      // Cache should respect maxSize
      expect(largeCache.size()).toBe(1000)
      
      // Cleanup should be efficient
      const cleanupStart = performance.now()
      largeCache.clear()
      const cleanupDuration = performance.now() - cleanupStart
      
      expect(cleanupDuration).toBeLessThan(100)
      expect(largeCache.size()).toBe(0)
      
      largeCache.destroy()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty key strings', () => {
      cache.set('', 'empty_key_value')
      expect(cache.get('')).toBe('empty_key_value')
    })

    test('should handle very long keys', () => {
      const longKey = 'x'.repeat(1000)
      cache.set(longKey, 'long_key_value')
      expect(cache.get(longKey)).toBe('long_key_value')
    })

    test('should handle null and undefined values', () => {
      cache.set('null_key', null as any)
      cache.set('undefined_key', undefined as any)
      
      expect(cache.get('null_key')).toBe(null)
      expect(cache.get('undefined_key')).toBe(undefined)
      
      // Both should exist in cache
      expect(cache.has('null_key')).toBe(true)
      expect(cache.has('undefined_key')).toBe(true)
    })

    test('should handle zero maxSize gracefully', () => {
      const zeroSizeCache = new LRUCache<string>({ maxSize: 0 })
      
      zeroSizeCache.set('key1', 'value1')
      expect(zeroSizeCache.size()).toBe(0)
      expect(zeroSizeCache.get('key1')).toBeUndefined()
      
      zeroSizeCache.destroy()
    })

    test('should handle negative TTL values', () => {
      cache.set('key1', 'value1', -100)
      
      // Negative TTL should be treated as already expired
      expect(cache.get('key1')).toBeUndefined()
    })

    test('should maintain consistency after many operations', () => {
      const operations = 1000
      const keys = new Set<string>()
      
      // Perform many random operations
      for (let i = 0; i < operations; i++) {
        const key = `key_${Math.floor(Math.random() * 100)}`
        const operation = Math.random()
        
        if (operation < 0.7) { // 70% set operations
          cache.set(key, `value_${i}`)
          keys.add(key)
        } else if (operation < 0.9) { // 20% get operations
          cache.get(key)
        } else { // 10% delete operations
          cache.delete(key)
          keys.delete(key)
        }
      }
      
      // Cache should be in consistent state
      expect(cache.size()).toBeLessThanOrEqual(5) // Respect maxSize
      expect(cache.size()).toBeGreaterThanOrEqual(0) // Non-negative
      
      // All existing keys should be retrievable
      cache.keys().forEach(key => {
        expect(cache.get(key)).toBeDefined()
      })
    })
  })
})