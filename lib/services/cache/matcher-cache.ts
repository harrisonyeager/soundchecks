import { LRUCache, type LRUCacheConfig } from './lru-cache'
import type {
  ArtistMatch,
  VenueMatch,
  MatchableArtist,
  MatchableVenue,
  MatchConfig
} from '../../types/matcher.types'

/**
 * Cache configuration specifically for entity matching
 */
export interface MatcherCacheConfig extends Partial<LRUCacheConfig> {
  /** Cache TTL for artist searches (ms) */
  artistCacheTTL: number
  /** Cache TTL for venue searches (ms) */
  venueCacheTTL: number
  /** Cache TTL for alias lookups (ms) */
  aliasCacheTTL: number
  /** Enable cache warming for common searches */
  enableWarming: boolean
  /** Popular search terms to warm cache with */
  warmingQueries: string[]
}

export const DEFAULT_MATCHER_CACHE_CONFIG: MatcherCacheConfig = {
  maxSize: 5000,
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 120000, // 2 minutes
  enableMetrics: true,
  artistCacheTTL: 600000, // 10 minutes
  venueCacheTTL: 300000, // 5 minutes (venues change more frequently)
  aliasCacheTTL: 900000, // 15 minutes (aliases are stable)
  enableWarming: true,
  warmingQueries: [
    'the', 'a', 'and', 'of', 'to', 'in', 'for', 'with', 'on', 'at',
    'taylor swift', 'the beatles', 'rolling stones', 'pink floyd',
    'madison square garden', 'hollywood bowl', 'red rocks'
  ]
}

/**
 * Performance metrics specific to entity matching cache
 */
export interface MatcherCacheMetrics {
  artistCache: {
    hits: number
    misses: number
    hitRate: number
    averageResponseTime: number
  }
  venueCache: {
    hits: number
    misses: number
    hitRate: number
    averageResponseTime: number
  }
  aliasCache: {
    hits: number
    misses: number
    hitRate: number
    averageResponseTime: number
  }
  overallPerformance: {
    totalRequests: number
    cacheHitRate: number
    averageResponseTime: number
    sub100msRate: number // Percentage of requests under 100ms
  }
}

/**
 * Specialized cache for entity matching results with performance optimization
 * Maintains separate caches for artists, venues, and aliases
 */
export class MatcherCache {
  private artistCache: LRUCache<ArtistMatch[]>
  private venueCache: LRUCache<VenueMatch[]>
  private aliasCache: LRUCache<string[]>
  private config: MatcherCacheConfig
  private metrics: MatcherCacheMetrics = this.getDefaultMetrics()
  private responseTimes: number[] = []

  constructor(config: Partial<MatcherCacheConfig> = {}) {
    this.config = { ...DEFAULT_MATCHER_CACHE_CONFIG, ...config }
    
    // Initialize metrics first
    this.initializeMetrics()
    
    // Initialize separate caches with specific configurations
    this.artistCache = new LRUCache<ArtistMatch[]>({
      maxSize: Math.floor(this.config.maxSize! * 0.5), // 50% for artists
      defaultTTL: this.config.artistCacheTTL,
      cleanupInterval: this.config.cleanupInterval,
      enableMetrics: this.config.enableMetrics
    })

    this.venueCache = new LRUCache<VenueMatch[]>({
      maxSize: Math.floor(this.config.maxSize! * 0.4), // 40% for venues
      defaultTTL: this.config.venueCacheTTL,
      cleanupInterval: this.config.cleanupInterval,
      enableMetrics: this.config.enableMetrics
    })

    this.aliasCache = new LRUCache<string[]>({
      maxSize: Math.floor(this.config.maxSize! * 0.1), // 10% for aliases
      defaultTTL: this.config.aliasCacheTTL,
      cleanupInterval: this.config.cleanupInterval,
      enableMetrics: this.config.enableMetrics
    })

    if (this.config.enableWarming) {
      this.scheduleWarmup()
    }
  }

  /**
   * Get cached artist search results
   * @param query Search query
   * @param matchConfig Matching configuration
   * @returns Cached results or undefined if not found
   */
  public getArtistMatches(query: string, matchConfig: MatchConfig): ArtistMatch[] | undefined {
    const startTime = performance.now()
    const cacheKey = this.generateArtistCacheKey(query, matchConfig)
    const result = this.artistCache.get(cacheKey)
    
    this.recordResponse('artist', startTime)
    return result
  }

  /**
   * Cache artist search results
   * @param query Search query
   * @param matchConfig Matching configuration
   * @param matches Search results to cache
   */
  public setArtistMatches(query: string, matchConfig: MatchConfig, matches: ArtistMatch[]): void {
    const cacheKey = this.generateArtistCacheKey(query, matchConfig)
    this.artistCache.set(cacheKey, matches)
  }

  /**
   * Get cached venue search results
   * @param query Search query
   * @param matchConfig Matching configuration
   * @param cityFilter Optional city filter
   * @returns Cached results or undefined if not found
   */
  public getVenueMatches(query: string, matchConfig: MatchConfig, cityFilter?: string): VenueMatch[] | undefined {
    const startTime = performance.now()
    const cacheKey = this.generateVenueCacheKey(query, matchConfig, cityFilter)
    const result = this.venueCache.get(cacheKey)
    
    this.recordResponse('venue', startTime)
    return result
  }

  /**
   * Cache venue search results
   * @param query Search query
   * @param matchConfig Matching configuration
   * @param matches Search results to cache
   * @param cityFilter Optional city filter
   */
  public setVenueMatches(query: string, matchConfig: MatchConfig, matches: VenueMatch[], cityFilter?: string): void {
    const cacheKey = this.generateVenueCacheKey(query, matchConfig, cityFilter)
    this.venueCache.set(cacheKey, matches)
  }

  /**
   * Get cached alias resolution results
   * @param entityId Entity ID
   * @returns Cached aliases or undefined if not found
   */
  public getAliases(entityId: string): string[] | undefined {
    const startTime = performance.now()
    const result = this.aliasCache.get(entityId)
    
    this.recordResponse('alias', startTime)
    return result
  }

  /**
   * Cache alias resolution results
   * @param entityId Entity ID
   * @param aliases Aliases to cache
   */
  public setAliases(entityId: string, aliases: string[]): void {
    this.aliasCache.set(entityId, aliases)
  }

  /**
   * Warm cache with common search queries
   * @param artists Artist dataset for warming
   * @param venues Venue dataset for warming
   * @param matcher Entity matcher instance for warming
   */
  public async warmCache(
    artists: MatchableArtist[],
    venues: MatchableVenue[],
    matcher: { matchArtists: (q: string, a: MatchableArtist[]) => ArtistMatch[]; matchVenues: (q: string, v: MatchableVenue[]) => VenueMatch[] }
  ): Promise<void> {
    if (!this.config.enableWarming) {
      return
    }

    const warmingPromises = this.config.warmingQueries.map(async (query) => {
      try {
        // Warm artist cache
        if (artists.length > 0) {
          const artistMatches = matcher.matchArtists(query, artists)
          this.setArtistMatches(query, { 
            minSimilarity: 60, 
            minConfidence: 70, 
            maxResults: 10,
            exactMatchWeight: 1.0,
            fuzzyMatchWeight: 0.8,
            aliasMatchWeight: 0.9
          }, artistMatches)
        }

        // Warm venue cache
        if (venues.length > 0) {
          const venueMatches = matcher.matchVenues(query, venues)
          this.setVenueMatches(query, {
            minSimilarity: 60,
            minConfidence: 70,
            maxResults: 10,
            exactMatchWeight: 1.0,
            fuzzyMatchWeight: 0.8,
            aliasMatchWeight: 0.9
          }, venueMatches)
        }
      } catch (error) {
        console.warn(`Failed to warm cache for query "${query}":`, error)
      }
    })

    await Promise.allSettled(warmingPromises)
  }

  /**
   * Invalidate cache entries for a specific entity
   * @param entityType Type of entity ('artist' | 'venue')
   * @param entityId Entity ID to invalidate
   */
  public invalidateEntity(entityType: 'artist' | 'venue', entityId: string): void {
    const cache = entityType === 'artist' ? this.artistCache : this.venueCache
    const keys = cache.keys()
    
    // Remove any cache entries that might contain this entity
    // This is a broad invalidation - in practice, you might want more granular control
    keys.forEach(key => {
      if (key.includes(entityId)) {
        cache.delete(key)
      }
    })
  }

  /**
   * Clear all caches
   */
  public clear(): void {
    this.artistCache.clear()
    this.venueCache.clear()
    this.aliasCache.clear()
    this.initializeMetrics()
  }

  /**
   * Get comprehensive cache metrics
   * @returns Current performance metrics
   */
  public getMetrics(): MatcherCacheMetrics {
    const artistMetrics = this.artistCache.getMetrics()
    const venueMetrics = this.venueCache.getMetrics()
    const aliasMetrics = this.aliasCache.getMetrics()

    const totalRequests = artistMetrics.hits + artistMetrics.misses + 
                         venueMetrics.hits + venueMetrics.misses +
                         aliasMetrics.hits + aliasMetrics.misses

    const totalHits = artistMetrics.hits + venueMetrics.hits + aliasMetrics.hits
    const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0

    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0

    const sub100msCount = this.responseTimes.filter(time => time < 100).length
    const sub100msRate = this.responseTimes.length > 0 
      ? (sub100msCount / this.responseTimes.length) * 100
      : 0

    return {
      artistCache: {
        hits: artistMetrics.hits,
        misses: artistMetrics.misses,
        hitRate: artistMetrics.hitRate,
        averageResponseTime: this.metrics.artistCache.averageResponseTime
      },
      venueCache: {
        hits: venueMetrics.hits,
        misses: venueMetrics.misses,
        hitRate: venueMetrics.hitRate,
        averageResponseTime: this.metrics.venueCache.averageResponseTime
      },
      aliasCache: {
        hits: aliasMetrics.hits,
        misses: aliasMetrics.misses,
        hitRate: aliasMetrics.hitRate,
        averageResponseTime: this.metrics.aliasCache.averageResponseTime
      },
      overallPerformance: {
        totalRequests,
        cacheHitRate: overallHitRate,
        averageResponseTime,
        sub100msRate
      }
    }
  }

  /**
   * Get cache utilization statistics
   */
  public getUtilization(): {
    artist: { size: number; maxSize: number; utilization: number }
    venue: { size: number; maxSize: number; utilization: number }
    alias: { size: number; maxSize: number; utilization: number }
    overall: { totalSize: number; maxSize: number; utilization: number }
  } {
    const artistStats = this.artistCache.getStats()
    const venueStats = this.venueCache.getStats()
    const aliasStats = this.aliasCache.getStats()

    return {
      artist: {
        size: artistStats.size,
        maxSize: artistStats.maxSize,
        utilization: artistStats.utilization
      },
      venue: {
        size: venueStats.size,
        maxSize: venueStats.maxSize,
        utilization: venueStats.utilization
      },
      alias: {
        size: aliasStats.size,
        maxSize: aliasStats.maxSize,
        utilization: aliasStats.utilization
      },
      overall: {
        totalSize: artistStats.size + venueStats.size + aliasStats.size,
        maxSize: artistStats.maxSize + venueStats.maxSize + aliasStats.maxSize,
        utilization: ((artistStats.size + venueStats.size + aliasStats.size) / 
                     (artistStats.maxSize + venueStats.maxSize + aliasStats.maxSize)) * 100
      }
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  public destroy(): void {
    this.artistCache.destroy()
    this.venueCache.destroy()
    this.aliasCache.destroy()
  }

  private generateArtistCacheKey(query: string, config: MatchConfig): string {
    const configHash = this.hashConfig(config)
    return `artist:${query.toLowerCase().trim()}:${configHash}`
  }

  private generateVenueCacheKey(query: string, config: MatchConfig, cityFilter?: string): string {
    const configHash = this.hashConfig(config)
    const city = cityFilter ? `:${cityFilter.toLowerCase().trim()}` : ''
    return `venue:${query.toLowerCase().trim()}${city}:${configHash}`
  }

  private hashConfig(config: MatchConfig): string {
    // Simple hash of configuration for cache key
    const configString = `${config.minSimilarity}:${config.minConfidence}:${config.maxResults}:${config.exactMatchWeight}:${config.fuzzyMatchWeight}:${config.aliasMatchWeight}`
    return Buffer.from(configString).toString('base64').slice(0, 8)
  }

  private recordResponse(cacheType: 'artist' | 'venue' | 'alias', startTime: number): void {
    const responseTime = performance.now() - startTime
    this.responseTimes.push(responseTime)
    
    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }

    // Update cache-specific metrics
    this.updateCacheMetrics(cacheType, responseTime)
  }

  private updateCacheMetrics(cacheType: 'artist' | 'venue' | 'alias', responseTime: number): void {
    type CacheKey = 'artistCache' | 'venueCache' | 'aliasCache'
    const cacheKey: CacheKey = `${cacheType}Cache` as CacheKey
    const cacheMetrics = this.metrics[cacheKey]
    
    // Update average response time (rolling average)
    if (cacheMetrics.averageResponseTime === 0) {
      cacheMetrics.averageResponseTime = responseTime
    } else {
      cacheMetrics.averageResponseTime = (cacheMetrics.averageResponseTime * 0.9) + (responseTime * 0.1)
    }
  }

  private initializeMetrics(): void {
    this.metrics = {
      artistCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageResponseTime: 0
      },
      venueCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageResponseTime: 0
      },
      aliasCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageResponseTime: 0
      },
      overallPerformance: {
        totalRequests: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        sub100msRate: 0
      }
    }
    this.responseTimes = []
  }

  private getDefaultMetrics(): MatcherCacheMetrics {
    return {
      artistCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageResponseTime: 0
      },
      venueCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageResponseTime: 0
      },
      aliasCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageResponseTime: 0
      },
      overallPerformance: {
        totalRequests: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        sub100msRate: 0
      }
    }
  }

  private scheduleWarmup(): void {
    // Schedule cache warming to run periodically
    setTimeout(() => {
      // In a real application, you would trigger cache warming here
      // For now, we just log that it's scheduled
      console.log('Cache warming scheduled - implement warming logic in application startup')
    }, 5000) // 5 seconds after initialization
  }
}