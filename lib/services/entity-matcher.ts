import { calculateConfidence, scoreEntities } from './matchers/confidence-scorer'
import {
  DEFAULT_MATCH_CONFIG,
  type MatchConfig,
  type MatchResult,
  type ArtistMatch,
  type VenueMatch,
  type MatchableArtist,
  type MatchableVenue
} from '../types/matcher.types'

/**
 * Main entity matching service that coordinates all matching functionality
 * Optimized for <100ms response time for autocomplete use cases
 */
export class EntityMatcher {
  private config: MatchConfig

  constructor(config: Partial<MatchConfig> = {}) {
    this.config = { ...DEFAULT_MATCH_CONFIG, ...config }
  }

  /**
   * Match artists by name with confidence scoring
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

    const scored = scoreEntities(query.trim(), artists, this.config)
    const matches: ArtistMatch[] = scored.map(artist => ({
      id: artist.id,
      name: artist.name,
      confidence: artist.confidence.weighted,
      breakdown: artist.confidence
    }))

    const duration = performance.now() - startTime
    if (duration > 100) {
      console.warn(`Artist matching took ${duration.toFixed(2)}ms, consider optimizing`)
    }

    return matches
  }

  /**
   * Match venues by name with optional city filtering
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

    // Filter by city if provided
    let filteredVenues = venues
    if (cityFilter?.trim()) {
      filteredVenues = venues.filter(venue => 
        venue.city.toLowerCase().includes(cityFilter.toLowerCase())
      )
    }

    const scored = scoreEntities(query.trim(), filteredVenues, this.config)
    const matches: VenueMatch[] = scored.map(venue => ({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      confidence: venue.confidence.weighted,
      breakdown: venue.confidence
    }))

    const duration = performance.now() - startTime
    if (duration > 100) {
      console.warn(`Venue matching took ${duration.toFixed(2)}ms, consider optimizing`)
    }

    return matches
  }

  /**
   * Find the single best match for an artist
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
   * Find the single best match for a venue
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
   * Check if a query would likely match an entity (for autocomplete optimization)
   * @param query Search query
   * @param entityName Entity name to check against
   * @param aliases Optional aliases to check
   * @returns True if likely to match above minimum threshold
   */
  public isLikelyMatch(
    query: string,
    entityName: string,
    aliases: string[] = []
  ): boolean {
    if (!query?.trim() || !entityName?.trim()) {
      return false
    }

    // Quick check for obvious matches
    const normalizedQuery = query.toLowerCase().trim()
    const normalizedName = entityName.toLowerCase().trim()

    // Check if query is a substring of the name (fast check)
    if (normalizedName.includes(normalizedQuery) || 
        normalizedQuery.includes(normalizedName)) {
      return true
    }

    // Check aliases quickly
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().trim()
      if (normalizedAlias.includes(normalizedQuery) || 
          normalizedQuery.includes(normalizedAlias)) {
        return true
      }
    }

    // For very short queries, be more permissive
    if (normalizedQuery.length <= 2) {
      return normalizedName.startsWith(normalizedQuery)
    }

    // For longer queries, do a quick similarity check
    if (normalizedQuery.length >= 3) {
      const confidence = calculateConfidence(query, entityName, aliases, this.config)
      return confidence.weighted >= (this.config.minConfidence * 0.7) // Lower threshold for pre-filtering
    }

    return false
  }

  /**
   * Update matcher configuration
   * @param config Partial configuration to merge with current settings
   */
  public updateConfig(config: Partial<MatchConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current matcher configuration
   * @returns Current configuration
   */
  public getConfig(): MatchConfig {
    return { ...this.config }
  }

  /**
   * Batch match multiple queries (for bulk operations)
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
    const results: Record<string, { artists: ArtistMatch[]; venues: VenueMatch[] }> = {}
    
    for (const query of queries) {
      if (query?.trim()) {
        results[query] = {
          artists: this.matchArtists(query, artists),
          venues: this.matchVenues(query, venues)
        }
      }
    }

    return results
  }

  /**
   * Get performance optimized configuration for autocomplete
   * @returns Configuration optimized for speed
   */
  public static getAutocompleteConfig(): MatchConfig {
    return {
      ...DEFAULT_MATCH_CONFIG,
      minSimilarity: 50,
      minConfidence: 60,
      maxResults: 5,
      // Weights optimized for speed - favor exact and alias matches
      exactMatchWeight: 1.0,
      fuzzyMatchWeight: 0.7,
      aliasMatchWeight: 0.95
    }
  }

  /**
   * Get configuration optimized for precise search results
   * @returns Configuration optimized for accuracy
   */
  public static getPrecisionConfig(): MatchConfig {
    return {
      ...DEFAULT_MATCH_CONFIG,
      minSimilarity: 70,
      minConfidence: 80,
      maxResults: 20,
      // Weights optimized for precision
      exactMatchWeight: 1.0,
      fuzzyMatchWeight: 0.85,
      aliasMatchWeight: 0.9
    }
  }
}