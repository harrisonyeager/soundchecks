import * as levenshtein from 'fast-levenshtein'

/**
 * Calculate similarity percentage between two strings using Levenshtein distance
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Similarity percentage (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  // Handle edge cases
  if (!str1 || !str2) return 0
  if (str1 === str2) return 100

  // Normalize strings for comparison
  const normalizedStr1 = normalizeString(str1)
  const normalizedStr2 = normalizeString(str2)

  // Handle exact match after normalization
  if (normalizedStr1 === normalizedStr2) return 100

  // Calculate Levenshtein distance
  const distance = levenshtein.get(normalizedStr1, normalizedStr2)
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length)

  // Convert distance to similarity percentage
  const similarity = ((maxLength - distance) / maxLength) * 100
  return Math.max(0, Math.round(similarity))
}

/**
 * Calculate similarity with case-sensitive option
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @param caseSensitive Whether to preserve case in comparison
 * @returns Similarity percentage (0-100)
 */
export function calculateSimilarityWithCase(
  str1: string,
  str2: string,
  caseSensitive = false
): number {
  // Handle edge cases
  if (!str1 || !str2) return 0
  if (str1 === str2) return 100

  let processedStr1 = str1.trim()
  let processedStr2 = str2.trim()

  if (!caseSensitive) {
    processedStr1 = processedStr1.toLowerCase()
    processedStr2 = processedStr2.toLowerCase()
  }

  // Handle exact match after processing
  if (processedStr1 === processedStr2) return 100

  // Calculate Levenshtein distance
  const distance = levenshtein.get(processedStr1, processedStr2)
  const maxLength = Math.max(processedStr1.length, processedStr2.length)

  // Convert distance to similarity percentage
  const similarity = ((maxLength - distance) / maxLength) * 100
  return Math.max(0, Math.round(similarity))
}

/**
 * Find the best match from a list of strings
 * @param query The string to match against
 * @param candidates List of candidate strings
 * @param minSimilarity Minimum similarity threshold (0-100)
 * @returns Best match with similarity score, or null if no match above threshold
 */
export function findBestMatch(
  query: string,
  candidates: string[],
  minSimilarity = 60
): { match: string; similarity: number } | null {
  if (!query || !candidates.length) return null

  let bestMatch: string | null = null
  let bestSimilarity = 0

  for (const candidate of candidates) {
    const similarity = calculateSimilarity(query, candidate)
    if (similarity > bestSimilarity && similarity >= minSimilarity) {
      bestMatch = candidate
      bestSimilarity = similarity
    }
  }

  return bestMatch ? { match: bestMatch, similarity: bestSimilarity } : null
}

/**
 * Get similarity scores for all candidates
 * @param query The string to match against
 * @param candidates List of candidate strings
 * @returns Array of matches with similarity scores, sorted by similarity (desc)
 */
export function getAllMatches(
  query: string,
  candidates: string[],
  minSimilarity = 0
): Array<{ match: string; similarity: number }> {
  if (!query || !candidates.length) return []

  const matches = candidates
    .map(candidate => ({
      match: candidate,
      similarity: calculateSimilarity(query, candidate)
    }))
    .filter(match => match.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)

  return matches
}

/**
 * Normalize string for consistent comparison
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove special characters that don't affect meaning
 * @param str String to normalize
 * @returns Normalized string
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Remove common punctuation that doesn't affect meaning
    .replace(/[.,;:!?'"()-]/g, '')
    // Remove leading/trailing "the", "a", "an" for better matching
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+(the|a|an)$/i, '')
    .trim()
}

/**
 * Check if two strings are an exact match after normalization
 * @param str1 First string
 * @param str2 Second string
 * @returns True if strings match exactly after normalization
 */
export function isExactMatch(str1: string, str2: string): boolean {
  if (!str1 || !str2) return false
  return normalizeString(str1) === normalizeString(str2)
}