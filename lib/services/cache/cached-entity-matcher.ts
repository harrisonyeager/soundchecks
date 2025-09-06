import { EntityMatcher } from '../entity-matcher'
import { MatcherCache, type MatcherCacheConfig } from './matcher-cache'
import type {
  MatchConfig,
  ArtistMatch,
  VenueMatch,
  MatchableArtist,
  MatchableVenue
} from '../../types/matcher.types'

/**
 * Enhanced EntityMatcher with integrated caching for performance optimization
 * Maintains <100ms response time requirement through intelligent caching
 */
export class CachedEntityMatcher extends EntityMatcher {
  private cache: MatcherCache
  private performanceThreshold = 100 // milliseconds

  constructor(
    matchConfig: Partial<MatchConfig> = {},
    cacheConfig: Partial<MatcherCacheConfig> = {}
  ) {
    super(matchConfig)
    this.cache = new MatcherCache(cacheConfig)
  }

  /**
   * Match artists by name with caching
   * @param query Search query
   * @param artists Array of artist entities to search
   * @returns Array of artist matches sorted by confidence
   */
  public matchArtists(
    query: string,
    artists: MatchableArtist[]
  ): ArtistMatch[] {
    const startTime = performance.now()
    
    if (!query?.trim() || !artists.length) {
      return []
    }

    const config = this.getConfig()
    
    // Try cache first
    const cachedResult = this.cache.getArtistMatches(query, config)
    if (cachedResult !== undefined) {
      const duration = performance.now() - startTime
      this.logPerformance('Artist matching (cached)', duration)
      return cachedResult
    }

    // Cache miss - compute result
    const result = super.matchArtists(query, artists)
    
    // Cache the result
    this.cache.setArtistMatches(query, config, result)
    
    const duration = performance.now() - startTime
    this.logPerformance('Artist matching (computed)', duration)
    
    return result
  }

  /**
   * Match venues by name with caching
   * @param query Search query
   * @param venues Array of venue entities to search
   * @param cityFilter Optional city to filter venues
   * @returns Array of venue matches sorted by confidence
   */
  public matchVenues(
    query: string,
    venues: MatchableVenue[],
    cityFilter?: string
  ): VenueMatch[] {
    const startTime = performance.now()
    
    if (!query?.trim() || !venues.length) {
      return []
    }

    const config = this.getConfig()
    
    // Try cache first
    const cachedResult = this.cache.getVenueMatches(query, config, cityFilter)
    if (cachedResult !== undefined) {
      const duration = performance.now() - startTime
      this.logPerformance('Venue matching (cached)', duration)
      return cachedResult
    }

    // Cache miss - compute result
    const result = super.matchVenues(query, venues, cityFilter)
    
    // Cache the result
    this.cache.setVenueMatches(query, config, result, cityFilter)
    
    const duration = performance.now() - startTime
    this.logPerformance('Venue matching (computed)', duration)
    
    return result
  }

  /**
   * Find the single best match for an artist with caching
   * @param query Search query
   * @param artists Array of artist entities to search
   * @returns Best artist match or null if no match meets threshold
   */
  public findBestArtist(
    query: string,
    artists: MatchableArtist[]
  ): ArtistMatch | null {
    const matches = this.matchArtists(query, artists)
    return matches.length > 0 ? matches[0] : null
  }

  /**
   * Find the single best match for a venue with caching
   * @param query Search query
   * @param venues Array of venue entities to search
   * @param cityFilter Optional city to filter venues
   * @returns Best venue match or null if no match meets threshold
   */
  public findBestVenue(
    query: string,
    venues: MatchableVenue[],
    cityFilter?: string
  ): VenueMatch | null {
    const matches = this.matchVenues(query, venues, cityFilter)
    return matches.length > 0 ? matches[0] : null
  }

  /**
   * Batch match multiple queries with intelligent caching
   * @param queries Array of search queries
   * @param artists Array of artist entities
   * @param venues Array of venue entities
   * @returns Object with artist and venue matches for each query
   */
  public batchMatch(
    queries: string[],
    artists: MatchableArtist[] = [],
    venues: MatchableVenue[] = []
  ): Record<string, { artists: ArtistMatch[]; venues: VenueMatch[] }> {
    const startTime = performance.now()
    const results: Record<string, { artists: ArtistMatch[]; venues: VenueMatch[] }> = {}
    
    let cacheHits = 0
    let totalQueries = 0
    
    for (const query of queries) {
      if (query?.trim()) {
        totalQueries++
        const config = this.getConfig()
        
        // Check cache for both artist and venue results
        const cachedArtists = this.cache.getArtistMatches(query, config)
        const cachedVenues = this.cache.getVenueMatches(query, config)
        
        if (cachedArtists !== undefined && cachedVenues !== undefined) {
          // Both cached
          cacheHits++
          results[query] = {
            artists: cachedArtists,
            venues: cachedVenues
          }
        } else {
          // Compute missing results
          const artistResults = cachedArtists ?? this.matchArtists(query, artists)
          const venueResults = cachedVenues ?? this.matchVenues(query, venues)
          
          results[query] = {
            artists: artistResults,
            venues: venueResults
          }
          
          // Cache computed results
          if (cachedArtists === undefined) {
            this.cache.setArtistMatches(query, config, artistResults)
          }
          if (cachedVenues === undefined) {
            this.cache.setVenueMatches(query, config, venueResults)
          }
        }
      }
    }

    const duration = performance.now() - startTime
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0
    
    this.logBatchPerformance('Batch matching', duration, totalQueries, cacheHitRate)
    
    return results
  }

  /**
   * Warm the cache with common search patterns
   * @param artists Artist dataset for cache warming
   * @param venues Venue dataset for cache warming
   */
  public async warmCache(
    artists: MatchableArtist[],
    venues: MatchableVenue[]
  ): Promise<void> {
    const startTime = performance.now()
    
    await this.cache.warmCache(artists, venues, {
      matchArtists: (query, artistList) => super.matchArtists(query, artistList),
      matchVenues: (query, venueList) => super.matchVenues(query, venueList)
    })
    
    const duration = performance.now() - startTime
    console.log(`Cache warming completed in ${duration.toFixed(2)}ms`)
  }

  /**
   * Invalidate cache entries for a specific entity (when entity data changes)
   * @param entityType Type of entity ('artist' | 'venue')
   * @param entityId Entity ID to invalidate
   */
  public invalidateCache(entityType: 'artist' | 'venue', entityId: string): void {
    this.cache.invalidateEntity(entityType, entityId)
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get comprehensive cache performance metrics
   * @returns Current cache performance metrics
   */
  public getCacheMetrics() {
    return this.cache.getMetrics()
  }

  /**
   * Get cache utilization statistics
   * @returns Cache utilization data
   */
  public getCacheUtilization() {
    return this.cache.getUtilization()
  }

  /**
   * Check if cache performance meets the <100ms requirement
   * @returns Performance analysis
   */
  public analyzeCachePerformance(): {
    meetsRequirement: boolean
    averageResponseTime: number
    sub100msRate: number
    recommendations: string[]
  } {
    const metrics = this.cache.getMetrics()
    const overallPerf = metrics.overallPerformance
    
    const meetsRequirement = overallPerf.sub100msRate >= 95 // 95% of requests should be under 100ms
    const recommendations: string[] = []
    
    if (!meetsRequirement) {
      recommendations.push('Consider increasing cache size')
      recommendations.push('Review cache TTL settings')
      recommendations.push('Implement more aggressive cache warming')
    }
    
    if (overallPerf.cacheHitRate < 80) {
      recommendations.push('Cache hit rate below 80% - review cache strategy')
    }
    
    if (overallPerf.averageResponseTime > 50) {
      recommendations.push('Average response time above 50ms - optimize matching algorithms')
    }

    return {
      meetsRequirement,
      averageResponseTime: overallPerf.averageResponseTime,
      sub100msRate: overallPerf.sub100msRate,
      recommendations
    }
  }

  /**
   * Get optimized configuration for different use cases
   * @param useCase The specific use case
   * @returns Optimized configuration
   */
  public static getOptimizedConfig(useCase: 'autocomplete' | 'search' | 'import'): {
    matchConfig: Partial<MatchConfig>
    cacheConfig: Partial<MatcherCacheConfig>
  } {
    switch (useCase) {
      case 'autocomplete':
        return {
          matchConfig: EntityMatcher.getAutocompleteConfig(),
          cacheConfig: {
            maxSize: 10000,
            artistCacheTTL: 900000, // 15 minutes - longer for autocomplete
            venueCacheTTL: 600000, // 10 minutes
            aliasCacheTTL: 1800000, // 30 minutes
            enableWarming: true,
            warmingQueries: [
              // Common autocomplete patterns
              'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
              'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
              'the', 'a ', 'an', 'and', 'of', 'to', 'in', 'for', 'with'
            ]
          }
        }
      
      case 'search':
        return {
          matchConfig: EntityMatcher.getPrecisionConfig(),
          cacheConfig: {
            maxSize: 5000,
            artistCacheTTL: 600000, // 10 minutes
            venueCacheTTL: 300000, // 5 minutes
            aliasCacheTTL: 900000, // 15 minutes
            enableWarming: false // Search patterns are too diverse
          }
        }
      
      case 'import':
        return {
          matchConfig: {
            minSimilarity: 80,
            minConfidence: 85,
            maxResults: 3,
            exactMatchWeight: 1.0,
            fuzzyMatchWeight: 0.9,
            aliasMatchWeight: 0.95
          },
          cacheConfig: {
            maxSize: 2000,
            artistCacheTTL: 3600000, // 1 hour - imports can be long-running
            venueCacheTTL: 3600000,
            aliasCacheTTL: 3600000,
            enableWarming: false
          }
        }
      
      default:
        return {
          matchConfig: {},
          cacheConfig: {}
        }
    }
  }

  /**
   * Destroy the cached matcher and cleanup resources
   */
  public destroy(): void {
    this.cache.destroy()
  }

  private logPerformance(operation: string, duration: number): void {
    if (duration > this.performanceThreshold) {
      console.warn(`${operation} took ${duration.toFixed(2)}ms (threshold: ${this.performanceThreshold}ms)`)
    } else {
      console.debug(`${operation} completed in ${duration.toFixed(2)}ms`)
    }
  }

  private logBatchPerformance(
    operation: string,
    duration: number,
    queryCount: number,
    cacheHitRate: number
  ): void {
    const avgPerQuery = queryCount > 0 ? duration / queryCount : 0
    
    console.debug(
      `${operation}: ${duration.toFixed(2)}ms total, ` +
      `${avgPerQuery.toFixed(2)}ms/query, ` +
      `${queryCount} queries, ` +
      `${cacheHitRate.toFixed(1)}% cache hit rate`
    )
    
    if (avgPerQuery > this.performanceThreshold) {
      console.warn(`Average per-query time exceeds ${this.performanceThreshold}ms threshold`)
    }
  }
}