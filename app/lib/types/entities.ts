export interface Artist {
  id: string
  name: string
  // Add confidence score for search results
  confidence?: number
}

export interface Venue {
  id: string
  name: string
  city: string
  confidence?: number
}

export interface Concert {
  id: string
  artistName: string
  venueName: string
  venueCity: string
  date: Date
  confidence?: number
}

// Search/Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SearchParams extends PaginationParams {
  q?: string
  autocomplete?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API Response types
export type ArtistSearchResponse = PaginatedResponse<Artist>
export type VenueSearchResponse = PaginatedResponse<Venue>
export type ConcertSearchResponse = PaginatedResponse<Concert>

// Error types
export interface ApiError {
  error: string
  message: string
  status: number
}