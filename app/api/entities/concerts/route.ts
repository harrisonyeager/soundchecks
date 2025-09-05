import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { concertSearchResponseSchema, concertCreateSchema, concertSchema } from '@/app/lib/schemas/entities'
import { Concert, PaginatedResponse } from '@/app/lib/types/entities'
import { z } from 'zod'

// Concert-specific search parameters schema
const concertSearchParamsSchema = z.object({
  // Basic pagination and search
  q: z.string().optional(), // General search query
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  autocomplete: z.coerce.boolean().default(false),
  
  // Concert-specific filters
  artist: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  
  // Date filtering
  date: z.string().optional(), // Specific date (YYYY-MM-DD)
  dateFrom: z.string().optional(), // Start of date range (YYYY-MM-DD)
  dateTo: z.string().optional(), // End of date range (YYYY-MM-DD)
})

type ConcertSearchParams = z.infer<typeof concertSearchParamsSchema>

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params: Record<string, string | null> = {}
    
    // Extract all possible parameters
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    
    const validatedParams = concertSearchParamsSchema.parse(params)
    const { 
      q, 
      page, 
      limit, 
      autocomplete, 
      artist, 
      venue, 
      city, 
      date, 
      dateFrom, 
      dateTo 
    } = validatedParams

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build the search query
    // Using a flexible type for Prisma where clause
    type StringFilter = {
      contains?: string
      startsWith?: string
      mode?: 'insensitive'
    }
    
    const whereClause: {
      date?: {
        gte?: Date
        lt?: Date
      }
      OR?: Array<{
        artist?: StringFilter
        venue?: StringFilter
        city?: StringFilter
      }>
      artist?: StringFilter
      venue?: StringFilter
      city?: StringFilter
    } = {}

    // General search query (searches across artist, venue, and city)
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim()
      const searchMode = autocomplete ? 'insensitive' as const : 'insensitive' as const
      
      if (autocomplete) {
        whereClause.OR = [
          {
            artist: {
              startsWith: searchTerm,
              mode: searchMode
            }
          },
          {
            venue: {
              startsWith: searchTerm,
              mode: searchMode
            }
          },
          {
            city: {
              startsWith: searchTerm,
              mode: searchMode
            }
          }
        ]
      } else {
        whereClause.OR = [
          {
            artist: {
              contains: searchTerm,
              mode: searchMode
            }
          },
          {
            venue: {
              contains: searchTerm,
              mode: searchMode
            }
          },
          {
            city: {
              contains: searchTerm,
              mode: searchMode
            }
          }
        ]
      }
    }

    // Specific field filters
    if (artist) {
      whereClause.artist = {
        contains: artist,
        mode: 'insensitive' as const
      }
    }

    if (venue) {
      whereClause.venue = {
        contains: venue,
        mode: 'insensitive' as const
      }
    }

    if (city) {
      whereClause.city = {
        contains: city,
        mode: 'insensitive' as const
      }
    }

    // Date filtering
    if (date) {
      // Specific date - match the entire day
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      whereClause.date = {
        gte: targetDate,
        lt: nextDay
      }
    } else {
      // Date range filtering
      if (dateFrom || dateTo) {
        const dateFilter: { gte?: Date; lt?: Date } = {}
        
        if (dateFrom) {
          dateFilter.gte = new Date(dateFrom)
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setDate(toDate.getDate() + 1) // Include the entire end date
          dateFilter.lt = toDate
        }
        
        whereClause.date = dateFilter
      }
    }

    // Get concerts with pagination
    const [concertData, totalCount] = await Promise.all([
      prisma.concertLog.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: [
          { date: 'desc' }, // Most recent concerts first
          { artist: 'asc' }
        ],
        select: {
          id: true,
          artist: true,
          venue: true,
          city: true,
          date: true,
        }
      }),
      prisma.concertLog.count({
        where: whereClause
      })
    ])

    // Transform the data to Concert format
    const concerts: Concert[] = concertData.map((item, index) => ({
      id: item.id,
      artistName: item.artist,
      venueName: item.venue,
      venueCity: item.city,
      date: item.date,
      // Calculate confidence score based on various factors
      confidence: calculateConfidence(item, index, validatedParams)
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedResponse<Concert> = {
      data: concerts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      }
    }

    // Validate the response structure
    const validatedResponse = concertSearchResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Concert search error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request parameters',
          details: error.issues
        },
        { status: 400 }
      )
    }

    // Handle date parsing errors
    if (error instanceof Error && error.message.includes('Invalid Date')) {
      return NextResponse.json(
        {
          error: 'Invalid Date Format',
          message: 'Date parameters must be in YYYY-MM-DD format'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to search concerts'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate confidence score for concert matches
 * @param concert - Concert data from database
 * @param position - Position in search results (0-based)
 * @param params - Search parameters used
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(
  concert: { artist: string; venue: string; city: string; date: Date },
  position: number,
  params: ConcertSearchParams
): number {
  let confidence = 0.5 // Base confidence

  // Boost confidence for exact matches
  if (params.artist && concert.artist.toLowerCase().includes(params.artist.toLowerCase())) {
    confidence += 0.2
  }
  
  if (params.venue && concert.venue.toLowerCase().includes(params.venue.toLowerCase())) {
    confidence += 0.2
  }
  
  if (params.city && concert.city.toLowerCase().includes(params.city.toLowerCase())) {
    confidence += 0.1
  }

  // Boost for position in results (earlier = higher confidence)
  const positionPenalty = Math.min(position * 0.02, 0.3)
  confidence -= positionPenalty

  // Boost for recent concerts (within last year gets higher confidence)
  const now = new Date()
  const concertDate = new Date(concert.date)
  const daysSinceEvent = Math.abs(now.getTime() - concertDate.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceEvent <= 365) {
    confidence += 0.1
  }

  // General search query matching
  if (params.q) {
    const queryLower = params.q.toLowerCase()
    const matchCount = [
      concert.artist.toLowerCase().includes(queryLower),
      concert.venue.toLowerCase().includes(queryLower),
      concert.city.toLowerCase().includes(queryLower)
    ].filter(Boolean).length
    
    confidence += matchCount * 0.1
  }

  return Math.max(0, Math.min(confidence, 1.0))
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = concertCreateSchema.parse(body)
    const { artistName, venueName, venueCity, date } = validatedData

    // Normalize the date to start of day for matching purposes
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Try to find existing concert with matching artist, venue, city, and date
    const existingConcert = await prisma.concertLog.findFirst({
      where: {
        artist: {
          equals: artistName,
          mode: 'insensitive'
        },
        venue: {
          equals: venueName,
          mode: 'insensitive'
        },
        city: {
          equals: venueCity,
          mode: 'insensitive'
        },
        date: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let concert: Concert
    let wasCreated = false

    if (existingConcert) {
      // Found existing concert
      concert = {
        id: generateConcertId(existingConcert.artist, existingConcert.venue, existingConcert.city, existingConcert.date),
        artistName: existingConcert.artist,
        venueName: existingConcert.venue,
        venueCity: existingConcert.city,
        date: existingConcert.date,
        confidence: 1.0 // Exact match has perfect confidence
      }
    } else {
      // For new concerts, we don't actually create a ConcertLog entry here
      // since we don't have a user profile context. Instead, we return the
      // concert data structure that would be created when a user logs this concert.
      // This endpoint serves as a "preview" of what the concert would look like.
      
      concert = {
        id: generateConcertId(artistName, venueName, venueCity, normalizedDate),
        artistName: artistName,
        venueName: venueName,
        venueCity: venueCity,
        date: normalizedDate,
        confidence: 1.0
      }
      wasCreated = true
    }

    // Validate the response structure
    const validatedConcert = concertSchema.parse(concert)

    return NextResponse.json(
      {
        concert: validatedConcert,
        created: wasCreated
      },
      { status: wasCreated ? 201 : 200 }
    )
  } catch (error) {
    console.error('Concert POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.issues
        },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Parse Error',
          message: 'Invalid JSON in request body'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create or find concert'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate a consistent concert ID based on artist, venue, city, and date
 * @param artist - Artist name
 * @param venue - Venue name
 * @param city - Venue city
 * @param date - Concert date
 * @returns Consistent concert ID string
 */
function generateConcertId(artist: string, venue: string, city: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
  const normalized = `${artist}_${venue}_${city}_${dateStr}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  
  return `concert_${normalized}`
}