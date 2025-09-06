import { calculateSimilarity, isExactMatch } from './levenshtein'
import type { ConfidenceBreakdown, MatchConfig } from '../../types/matcher.types'

/**
 * Calculate confidence score for a match with detailed breakdown
 * @param query The search query
 * @param targetName The name being matched against
 * @param aliases Optional aliases for the target entity
 * @param config Matching configuration
 * @returns Confidence breakdown with scores
 */
export function calculateConfidence(
  query: string,
  targetName: string,
  aliases: string[] = [],
  config: MatchConfig
): ConfidenceBreakdown {
  // Initialize breakdown with zero scores
  const breakdown: ConfidenceBreakdown = {
    exactMatch: 0,
    fuzzyMatch: 0,
    aliasMatch: 0,
    weighted: 0
  }

  // Handle edge cases
  if (!query || !targetName) {
    return breakdown
  }

  // Check for exact match
  if (isExactMatch(query, targetName)) {
    breakdown.exactMatch = 100
  }

  // Calculate fuzzy match score
  breakdown.fuzzyMatch = calculateSimilarity(query, targetName)

  // Check alias matches
  if (aliases && aliases.length > 0) {
    let bestAliasScore = 0
    for (const alias of aliases) {
      if (isExactMatch(query, alias)) {
        bestAliasScore = 100
        break
      }
      const aliasScore = calculateSimilarity(query, alias)
      bestAliasScore = Math.max(bestAliasScore, aliasScore)
    }
    breakdown.aliasMatch = bestAliasScore
  }

  // Calculate weighted final score
  breakdown.weighted = calculateWeightedScore(breakdown, config)

  return breakdown
}

/**
 * Calculate the final weighted confidence score
 * @param breakdown The confidence breakdown
 * @param config Matching configuration with weights
 * @returns Final weighted score (0-100)
 */
export function calculateWeightedScore(
  breakdown: ConfidenceBreakdown,
  config: MatchConfig
): number {
  // Take the highest individual score and apply weights
  let maxScore = 0
  let appliedWeight = 0

  // Check exact match first (highest priority)
  if (breakdown.exactMatch > 0) {
    maxScore = breakdown.exactMatch
    appliedWeight = config.exactMatchWeight
  }
  // Check alias match second (second priority)
  else if (breakdown.aliasMatch > 0) {
    maxScore = breakdown.aliasMatch
    appliedWeight = config.aliasMatchWeight
  }
  // Fall back to fuzzy match
  else {
    maxScore = breakdown.fuzzyMatch
    appliedWeight = config.fuzzyMatchWeight
  }

  // Apply weight and ensure result is within bounds
  const weightedScore = maxScore * appliedWeight
  return Math.min(100, Math.max(0, Math.round(weightedScore)))
}

/**
 * Determine if a match meets the minimum confidence threshold
 * @param breakdown Confidence breakdown
 * @param config Matching configuration
 * @returns True if the match meets the threshold
 */
export function meetsConfidenceThreshold(
  breakdown: ConfidenceBreakdown,
  config: MatchConfig
): boolean {
  return breakdown.weighted >= config.minConfidence
}

/**
 * Get a human-readable confidence level
 * @param confidence Confidence score (0-100)
 * @returns Confidence level description
 */
export function getConfidenceLevel(confidence: number): string {
  if (confidence >= 95) return 'Excellent'
  if (confidence >= 85) return 'High'
  if (confidence >= 75) return 'Good'
  if (confidence >= 65) return 'Fair'
  if (confidence >= 50) return 'Low'
  return 'Poor'
}

/**
 * Compare two confidence breakdowns and return the better match
 * @param a First confidence breakdown
 * @param b Second confidence breakdown
 * @returns The breakdown with higher confidence, or first if equal
 */
export function compareBestMatch(
  a: ConfidenceBreakdown,
  b: ConfidenceBreakdown
): ConfidenceBreakdown {
  if (b.weighted > a.weighted) return b
  if (a.weighted > b.weighted) return a
  
  // If weighted scores are equal, prefer exact matches
  if (b.exactMatch > a.exactMatch) return b
  if (a.exactMatch > b.exactMatch) return a
  
  // Then prefer alias matches
  if (b.aliasMatch > a.aliasMatch) return b
  if (a.aliasMatch > b.aliasMatch) return a
  
  // Finally compare fuzzy matches
  if (b.fuzzyMatch > a.fuzzyMatch) return b
  
  return a
}

/**
 * Score multiple entities and return sorted results
 * @param query The search query
 * @param entities Array of entities with name and optional aliases
 * @param config Matching configuration
 * @returns Array of scored entities sorted by confidence (descending)
 */
export function scoreEntities<T extends { id: string; name: string; aliases?: string[] }>(
  query: string,
  entities: T[],
  config: MatchConfig
): Array<T & { confidence: ConfidenceBreakdown }> {
  if (!query || !entities.length) return []

  const scored = entities
    .map(entity => ({
      ...entity,
      confidence: calculateConfidence(query, entity.name, entity.aliases, config)
    }))
    .filter(item => meetsConfidenceThreshold(item.confidence, config))
    .sort((a, b) => b.confidence.weighted - a.confidence.weighted)
    .slice(0, config.maxResults)

  return scored
}