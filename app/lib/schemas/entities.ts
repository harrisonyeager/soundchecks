import { z } from 'zod'

// Search parameters schema
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  autocomplete: z.coerce.boolean().default(false)
})

// Artist schemas
export const artistSchema = z.object({
  id: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(1).optional()
})

export const artistCreateSchema = z.object({
  name: z.string().min(1).max(255)
})

// Venue schemas  
export const venueSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  confidence: z.number().min(0).max(1).optional()
})

export const venueCreateSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().min(1).max(255)
})

// Concert schemas
export const concertSchema = z.object({
  id: z.string(),
  artistName: z.string(),
  venueName: z.string(),
  venueCity: z.string(),
  date: z.date(),
  confidence: z.number().min(0).max(1).optional()
})

export const concertCreateSchema = z.object({
  artistName: z.string().min(1).max(255),
  venueName: z.string().min(1).max(255),
  venueCity: z.string().min(1).max(255),
  date: z.string().datetime().transform((str) => new Date(str))
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
})

// Response schemas
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: paginationSchema
  })

export const artistSearchResponseSchema = paginatedResponseSchema(artistSchema)
export const venueSearchResponseSchema = paginatedResponseSchema(venueSchema)
export const concertSearchResponseSchema = paginatedResponseSchema(concertSchema)

// Error schema
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status: z.number()
})

// Type exports from schemas
export type SearchParams = z.infer<typeof searchParamsSchema>
export type Artist = z.infer<typeof artistSchema>
export type ArtistCreate = z.infer<typeof artistCreateSchema>
export type Venue = z.infer<typeof venueSchema>
export type VenueCreate = z.infer<typeof venueCreateSchema>
export type Concert = z.infer<typeof concertSchema>
export type ConcertCreate = z.infer<typeof concertCreateSchema>
export type PaginatedResponse<T> = {
  data: T[]
  pagination: z.infer<typeof paginationSchema>
}
export type ApiError = z.infer<typeof apiErrorSchema>