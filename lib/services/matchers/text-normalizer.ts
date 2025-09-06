/**
 * Text normalization utilities for consistent string matching
 * Handles accents, diacritics, punctuation, case, and unicode characters
 */

/**
 * Configuration for text normalization
 */
export interface NormalizationConfig {
  /** Remove accents and diacritics */
  removeAccents: boolean
  /** Convert to lowercase */
  lowercase: boolean
  /** Remove common punctuation */
  removePunctuation: boolean
  /** Normalize whitespace (trim, collapse multiple spaces) */
  normalizeWhitespace: boolean
  /** Remove common stop words */
  removeStopWords: boolean
  /** Remove articles (a, an, the) */
  removeArticles: boolean
  /** Convert unicode characters to ASCII equivalents */
  convertUnicode: boolean
}

/**
 * Default normalization configuration
 */
export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  removeAccents: true,
  lowercase: true,
  removePunctuation: true,
  normalizeWhitespace: true,
  removeStopWords: false,
  removeArticles: true,
  convertUnicode: true
}

/**
 * Common stop words to remove (if enabled)
 */
export const STOP_WORDS = new Set([
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'among', 'under', 'over', 'against', 'within', 'without'
])

/**
 * Common articles to remove
 */
export const ARTICLES = new Set(['a', 'an', 'the'])

/**
 * Unicode to ASCII mapping for common characters
 */
export const UNICODE_MAP: Record<string, string> = {
  // Accented characters
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'ç': 'c',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ñ': 'n',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'œ': 'oe',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y',
  
  // German
  'ß': 'ss',
  
  // Scandinavian
  'ð': 'd', 'þ': 'th',
  
  // Eastern European
  'č': 'c', 'ć': 'c', 'ď': 'd', 'đ': 'd',
  'ě': 'e', 'ę': 'e', 'ė': 'e',
  'ğ': 'g',
  'ħ': 'h',
  'ı': 'i', 'į': 'i',
  'ł': 'l', 'ľ': 'l', 'ĺ': 'l',
  'ň': 'n', 'ń': 'n', 'ņ': 'n',
  'ř': 'r', 'ŕ': 'r',
  'š': 's', 'ś': 's', 'ş': 's',
  'ť': 't', 'ţ': 't',
  'ů': 'u', 'ű': 'u', 'ų': 'u',
  'ž': 'z', 'ź': 'z', 'ż': 'z',
  
  // Cyrillic common transliterations
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
}

/**
 * Remove accents and diacritics from text
 */
export function removeAccents(text: string): string {
  // First try the built-in normalization
  let normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Then apply our custom mapping for characters that don't normalize well
  for (const [accented, plain] of Object.entries(UNICODE_MAP)) {
    normalized = normalized.replace(new RegExp(accented, 'g'), plain)
  }
  
  return normalized
}

/**
 * Remove punctuation from text, keeping only alphanumeric characters and spaces
 */
export function removePunctuation(text: string): string {
  // Keep alphanumeric characters, spaces, and common separators
  return text.replace(/[^\w\s'-]/g, ' ')
    .replace(/[-']+/g, ' ') // Convert hyphens and apostrophes to spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Normalize whitespace by trimming and collapsing multiple spaces
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Remove stop words from text
 */
export function removeStopWords(text: string): string {
  return text
    .split(/\s+/)
    .filter(word => !STOP_WORDS.has(word.toLowerCase()))
    .join(' ')
}

/**
 * Remove articles (a, an, the) from text
 */
export function removeArticles(text: string): string {
  const words = text.split(/\s+/)
  
  // Remove articles, but only if they're not the only word
  if (words.length > 1) {
    return words
      .filter(word => !ARTICLES.has(word.toLowerCase()))
      .join(' ')
  }
  
  return text
}

/**
 * Convert unicode characters to ASCII equivalents
 */
export function convertUnicode(text: string): string {
  let result = text
  
  for (const [unicode, ascii] of Object.entries(UNICODE_MAP)) {
    result = result.replace(new RegExp(unicode, 'gi'), ascii)
  }
  
  return result
}

/**
 * Main text normalization function
 */
export function normalizeText(text: string, config: Partial<NormalizationConfig> = {}): string {
  const fullConfig = { ...DEFAULT_NORMALIZATION_CONFIG, ...config }
  let normalized = text
  
  // Apply normalizations in order
  if (fullConfig.convertUnicode) {
    normalized = convertUnicode(normalized)
  }
  
  if (fullConfig.removeAccents) {
    normalized = removeAccents(normalized)
  }
  
  if (fullConfig.lowercase) {
    normalized = normalized.toLowerCase()
  }
  
  if (fullConfig.removePunctuation) {
    normalized = removePunctuation(normalized)
  }
  
  if (fullConfig.normalizeWhitespace) {
    normalized = normalizeWhitespace(normalized)
  }
  
  if (fullConfig.removeArticles) {
    normalized = removeArticles(normalized)
  }
  
  if (fullConfig.removeStopWords) {
    normalized = removeStopWords(normalized)
  }
  
  // Final whitespace normalization
  return normalizeWhitespace(normalized)
}

/**
 * Normalize text for matching (strict normalization)
 */
export function normalizeForMatching(text: string): string {
  return normalizeText(text, {
    removeAccents: true,
    lowercase: true,
    removePunctuation: true,
    normalizeWhitespace: true,
    removeStopWords: false,
    removeArticles: true,
    convertUnicode: true
  })
}

/**
 * Normalize text for display (preserves more original formatting)
 */
export function normalizeForDisplay(text: string): string {
  return normalizeText(text, {
    removeAccents: false,
    lowercase: false,
    removePunctuation: false,
    normalizeWhitespace: true,
    removeStopWords: false,
    removeArticles: false,
    convertUnicode: false
  })
}

/**
 * Generate multiple normalized variations of text for fuzzy matching
 */
export function generateNormalizedVariations(text: string): string[] {
  const variations = new Set<string>()
  
  // Original text
  variations.add(text)
  
  // Lowercase
  variations.add(text.toLowerCase())
  
  // Remove accents
  variations.add(removeAccents(text))
  variations.add(removeAccents(text.toLowerCase()))
  
  // Remove punctuation
  const noPunct = removePunctuation(text)
  variations.add(noPunct)
  variations.add(noPunct.toLowerCase())
  
  // Full normalization
  variations.add(normalizeForMatching(text))
  
  // Without articles
  const noArticles = removeArticles(text.toLowerCase())
  variations.add(noArticles)
  variations.add(normalizeForMatching(noArticles))
  
  // Remove empty strings and return unique variations
  return Array.from(variations).filter(v => v.trim().length > 0)
}

/**
 * Calculate text similarity using Levenshtein distance
 * Returns a score from 0-100 (100 being identical)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeForMatching(text1)
  const normalized2 = normalizeForMatching(text2)
  
  if (normalized1 === normalized2) return 100
  if (normalized1.length === 0 || normalized2.length === 0) return 0
  
  const maxLength = Math.max(normalized1.length, normalized2.length)
  const distance = levenshteinDistance(normalized1, normalized2)
  
  return Math.round((1 - distance / maxLength) * 100)
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j
  }
  
  // Fill matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }
  
  return matrix[str1.length][str2.length]
}