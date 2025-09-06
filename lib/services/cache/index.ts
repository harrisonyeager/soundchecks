/**
 * Entity matching cache services
 * 
 * This module provides caching capabilities for the entity matching system
 * to meet the <100ms response time requirement for autocomplete use cases.
 */

export { LRUCache, type CacheMetrics, type CacheEntry, type LRUCacheConfig, DEFAULT_LRU_CONFIG } from './lru-cache'
export { 
  MatcherCache, 
  type MatcherCacheConfig, 
  type MatcherCacheMetrics, 
  DEFAULT_MATCHER_CACHE_CONFIG 
} from './matcher-cache'
export { CachedEntityMatcher } from './cached-entity-matcher'