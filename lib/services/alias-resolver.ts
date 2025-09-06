/**
 * Alias resolution service for artists, venues, and cities
 * Provides fuzzy matching, confidence scoring, and batch processing capabilities
 */

import {
  ARTIST_ALIASES,
  VENUE_ALIASES,
  CITY_ALIASES,
  ALL_ALIASES,
  resolveAlias,
  getAliasesForCanonical
} from '../data/common-aliases'
import {
  normalizeText,
  normalizeForMatching,
  generateNormalizedVariations,
  calculateSimilarity
} from './matchers/text-normalizer'
import type {
  MatchConfig,
  MatchResult,
  ConfidenceBreakdown
} from '../types/matcher.types'
import { DEFAULT_MATCH_CONFIG } from '../types/matcher.types'

/**
 * Alias resolution result with additional metadata
 */
export interface AliasResolutionResult {
  /** Original input term */
  input: string
  /** Resolved canonical form (null if no match) */
  canonical: string | null
  /** Confidence score (0-100) */
  confidence: number
  /** How the alias was resolved */
  resolutionType: 'exact' | 'fuzzy' | 'normalized' | 'none'
  /** Alternative suggestions if no exact match */
  suggestions: string[]
}

/**
 * Batch resolution result
 */
export interface BatchResolutionResult {
  /** Results for each input term */
  results: AliasResolutionResult[]
  /** Summary statistics */
  summary: {
    totalInputs: number
    resolved: number
    unresolved: number
    averageConfidence: number
  }
}

/**
 * Custom alias entry for dynamic additions
 */
export interface CustomAlias {
  alias: string
  canonical: string
  category: 'artist' | 'venue' | 'city'
  confidence: number
}

/**
 * Main alias resolver class
 */
export class AliasResolver {
  private customAliases: Map<string, CustomAlias> = new Map()
  private config: MatchConfig

  constructor(config: Partial<MatchConfig> = {}) {
    this.config = { ...DEFAULT_MATCH_CONFIG, ...config }
  }

  /**
   * Add a custom alias dynamically
   */
  addCustomAlias(alias: string, canonical: string, category: 'artist' | 'venue' | 'city', confidence = 95): void {
    const normalizedAlias = normalizeForMatching(alias)
    this.customAliases.set(normalizedAlias, {
      alias: normalizedAlias,
      canonical,
      category,
      confidence
    })
  }

  /**
   * Remove a custom alias
   */
  removeCustomAlias(alias: string): boolean {
    const normalizedAlias = normalizeForMatching(alias)
    return this.customAliases.delete(normalizedAlias)
  }

  /**
   * Get all custom aliases
   */
  getCustomAliases(): CustomAlias[] {
    const aliases: CustomAlias[] = []
    this.customAliases.forEach(alias => aliases.push(alias))
    return aliases
  }

  /**
   * Resolve a single alias with confidence scoring
   */
  resolve(input: string, category?: 'artist' | 'venue' | 'city'): AliasResolutionResult {
    const normalizedInput = normalizeForMatching(input)
    
    // Check custom aliases first
    const customResult = this.resolveCustomAlias(normalizedInput, category)
    if (customResult.confidence >= this.config.minConfidence) {
      return customResult
    }

    // Check built-in exact aliases
    const exactResult = this.resolveExactAlias(input, category)
    if (exactResult.confidence >= this.config.minConfidence) {
      return exactResult
    }

    // Try fuzzy matching
    const fuzzyResult = this.resolveFuzzyAlias(input, category)
    if (fuzzyResult.confidence >= this.config.minConfidence) {
      return fuzzyResult
    }

    // No match found - provide suggestions
    const suggestions = this.generateSuggestions(input, category)
    
    return {
      input,
      canonical: null,
      confidence: 0,
      resolutionType: 'none',
      suggestions
    }
  }

  /**
   * Resolve artist alias
   */
  resolveArtist(input: string): AliasResolutionResult {
    return this.resolve(input, 'artist')
  }

  /**
   * Resolve venue alias
   */
  resolveVenue(input: string): AliasResolutionResult {
    return this.resolve(input, 'venue')
  }

  /**
   * Resolve city alias
   */
  resolveCity(input: string): AliasResolutionResult {
    return this.resolve(input, 'city')
  }

  /**
   * Batch resolve multiple aliases
   */
  resolveBatch(inputs: string[], category?: 'artist' | 'venue' | 'city'): BatchResolutionResult {
    const results = inputs.map(input => this.resolve(input, category))
    
    const resolved = results.filter(r => r.canonical !== null)
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0)
    
    return {
      results,
      summary: {
        totalInputs: inputs.length,
        resolved: resolved.length,
        unresolved: inputs.length - resolved.length,
        averageConfidence: inputs.length > 0 ? totalConfidence / inputs.length : 0
      }
    }
  }

  /**
   * Get all possible aliases for a canonical name
   */
  getAliasesFor(canonical: string, category?: 'artist' | 'venue' | 'city'): string[] {
    const builtInAliases = getAliasesForCanonical(canonical, category)
    
    // Add custom aliases
    const customAliases: string[] = []
    this.customAliases.forEach(ca => {
      if (ca.canonical.toLowerCase() === canonical.toLowerCase() && 
          (!category || ca.category === category)) {
        customAliases.push(ca.alias)
      }
    })
    
    const allAliases = builtInAliases.concat(customAliases)
    return Array.from(new Set(allAliases))
  }

  /**
   * Check if a term has any aliases
   */
  hasAliases(term: string, category?: 'artist' | 'venue' | 'city'): boolean {
    return this.resolve(term, category).canonical !== null
  }

  /**
   * Get resolution statistics
   */
  getStats(): {
    builtInAliases: { artists: number, venues: number, cities: number, total: number }
    customAliases: { artists: number, venues: number, cities: number, total: number }
  } {
    const customByCategory = { artist: 0, venue: 0, city: 0 }
    this.customAliases.forEach(alias => {
      customByCategory[alias.category]++
    })

    return {
      builtInAliases: {
        artists: Object.keys(ARTIST_ALIASES).length,
        venues: Object.keys(VENUE_ALIASES).length,
        cities: Object.keys(CITY_ALIASES).length,
        total: Object.keys(ALL_ALIASES).length
      },
      customAliases: {
        artists: customByCategory.artist,
        venues: customByCategory.venue,
        cities: customByCategory.city,
        total: this.customAliases.size
      }
    }
  }

  /**
   * Resolve custom alias
   */
  private resolveCustomAlias(normalizedInput: string, category?: 'artist' | 'venue' | 'city'): AliasResolutionResult {
    const customAlias = this.customAliases.get(normalizedInput)
    
    if (customAlias && (!category || customAlias.category === category)) {
      return {
        input: normalizedInput,
        canonical: customAlias.canonical,
        confidence: customAlias.confidence,
        resolutionType: 'exact',
        suggestions: []
      }
    }

    return {
      input: normalizedInput,
      canonical: null,
      confidence: 0,
      resolutionType: 'none',
      suggestions: []
    }
  }

  /**
   * Resolve exact alias from built-in database
   */
  private resolveExactAlias(input: string, category?: 'artist' | 'venue' | 'city'): AliasResolutionResult {
    // Try direct lookup
    const directMatch = resolveAlias(input, category)
    if (directMatch) {
      return {
        input,
        canonical: directMatch,
        confidence: 100,
        resolutionType: 'exact',
        suggestions: []
      }
    }

    // Try normalized lookup
    const normalizedInput = normalizeForMatching(input)
    const normalizedMatch = resolveAlias(normalizedInput, category)
    if (normalizedMatch) {
      return {
        input,
        canonical: normalizedMatch,
        confidence: 95,
        resolutionType: 'normalized',
        suggestions: []
      }
    }

    return {
      input,
      canonical: null,
      confidence: 0,
      resolutionType: 'none',
      suggestions: []
    }
  }

  /**
   * Resolve alias using fuzzy matching
   */
  private resolveFuzzyAlias(input: string, category?: 'artist' | 'venue' | 'city'): AliasResolutionResult {
    const normalizedInput = normalizeForMatching(input)
    const aliases = category ? this.getCategoryAliases(category) : ALL_ALIASES
    
    let bestMatch: { alias: string, canonical: string, similarity: number } | null = null
    
    // Check each alias for similarity
    for (const [alias, canonical] of Object.entries(aliases)) {
      const similarity = calculateSimilarity(normalizedInput, alias)
      
      if (similarity >= this.config.minSimilarity && 
          (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { alias, canonical, similarity }
      }
    }

    // Also check custom aliases
    this.customAliases.forEach(customAlias => {
      if (category && customAlias.category !== category) return
      
      const similarity = calculateSimilarity(normalizedInput, customAlias.alias)
      
      if (similarity >= this.config.minSimilarity && 
          (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { 
          alias: customAlias.alias, 
          canonical: customAlias.canonical, 
          similarity 
        }
      }
    })

    if (bestMatch && bestMatch.similarity >= this.config.minSimilarity) {
      const confidence = Math.min(bestMatch.similarity, 95) // Cap fuzzy matches at 95%
      
      return {
        input,
        canonical: bestMatch.canonical,
        confidence,
        resolutionType: 'fuzzy',
        suggestions: []
      }
    }

    return {
      input,
      canonical: null,
      confidence: 0,
      resolutionType: 'none',
      suggestions: []
    }
  }

  /**
   * Generate suggestions for unresolved aliases
   */
  private generateSuggestions(input: string, category?: 'artist' | 'venue' | 'city'): string[] {
    const normalizedInput = normalizeForMatching(input)
    const aliases = category ? this.getCategoryAliases(category) : ALL_ALIASES
    
    const suggestions: Array<{ canonical: string, similarity: number }> = []
    
    // Find similar aliases
    for (const [alias, canonical] of Object.entries(aliases)) {
      const similarity = calculateSimilarity(normalizedInput, alias)
      
      if (similarity >= 30 && similarity < this.config.minSimilarity) {
        suggestions.push({ canonical, similarity })
      }
    }

    // Sort by similarity and return top suggestions
    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(s => s.canonical)
  }

  /**
   * Get aliases for a specific category
   */
  private getCategoryAliases(category: 'artist' | 'venue' | 'city'): Record<string, string> {
    switch (category) {
      case 'artist':
        return ARTIST_ALIASES
      case 'venue':
        return VENUE_ALIASES
      case 'city':
        return CITY_ALIASES
      default:
        return {}
    }
  }
}

/**
 * Default alias resolver instance
 */
export const defaultAliasResolver = new AliasResolver()

/**
 * Convenience functions using the default resolver
 */
export const resolveArtistAlias = (input: string): AliasResolutionResult => 
  defaultAliasResolver.resolveArtist(input)

export const resolveVenueAlias = (input: string): AliasResolutionResult => 
  defaultAliasResolver.resolveVenue(input)

export const resolveCityAlias = (input: string): AliasResolutionResult => 
  defaultAliasResolver.resolveCity(input)

export const resolveAnyAlias = (input: string): AliasResolutionResult => 
  defaultAliasResolver.resolve(input)

export const resolveBatchAliases = (inputs: string[], category?: 'artist' | 'venue' | 'city'): BatchResolutionResult => 
  defaultAliasResolver.resolveBatch(inputs, category)