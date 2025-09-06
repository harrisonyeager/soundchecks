export interface MatchConfig {
  /** Minimum similarity threshold for considering a match (0-100) */
  minSimilarity: number
  /** Minimum confidence threshold for returning results (0-100) */
  minConfidence: number
  /** Maximum number of results to return */
  maxResults: number
  /** Weight for exact name matches */
  exactMatchWeight: number
  /** Weight for fuzzy string matches */
  fuzzyMatchWeight: number
  /** Weight for alias matches */
  aliasMatchWeight: number
}

export interface MatchResult {
  /** The matched entity ID */
  id: string
  /** The matched entity name */
  name: string
  /** Overall confidence score (0-100) */
  confidence: number
  /** Detailed breakdown of confidence factors */
  breakdown: ConfidenceBreakdown
}

export interface ConfidenceBreakdown {
  /** Score for exact name match (0-100) */
  exactMatch: number
  /** Score for fuzzy string similarity (0-100) */
  fuzzyMatch: number
  /** Score for alias match (0-100) */
  aliasMatch: number
  /** Final weighted score (0-100) */
  weighted: number
}

export interface ArtistMatch extends MatchResult {
  /** Additional artist-specific fields if needed */
}

export interface VenueMatch extends MatchResult {
  /** City name for venue context */
  city: string
  /** Additional venue-specific fields if needed */
}

export interface MatchableEntity {
  id: string
  name: string
  /** Alternative names or aliases */
  aliases?: string[]
}

export interface MatchableArtist extends MatchableEntity {
  // Artist-specific fields
}

export interface MatchableVenue extends MatchableEntity {
  city: string
  // Venue-specific fields
}

/** Default configuration for matching */
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  minSimilarity: 60,
  minConfidence: 70,
  maxResults: 10,
  exactMatchWeight: 1.0,
  fuzzyMatchWeight: 0.8,
  aliasMatchWeight: 0.9
}