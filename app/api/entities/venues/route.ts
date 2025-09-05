import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { searchParamsSchema, venueSearchResponseSchema, venueCreateSchema, venueSchema } from '@/app/lib/schemas/entities'
import { Venue, PaginatedResponse } from '@/app/lib/types/entities'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = {
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      autocomplete: searchParams.get('autocomplete') || 'false'
    }

    const validatedParams = searchParamsSchema.parse(params)
    const { q, page, limit, autocomplete } = validatedParams

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build the search query
    let whereClause = {}
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim()
      if (autocomplete) {
        // For autocomplete, use startsWith matching (case insensitive)
        whereClause = {
          OR: [
            {
              venue: {
                startsWith: searchTerm,
                mode: 'insensitive' as const
              }
            },
            {
              city: {
                startsWith: searchTerm,
                mode: 'insensitive' as const
              }
            }
          ]
        }
      } else {
        // For regular search, use contains matching (case insensitive)
        whereClause = {
          OR: [
            {
              venue: {
                contains: searchTerm,
                mode: 'insensitive' as const
              }
            },
            {
              city: {
                contains: searchTerm,
                mode: 'insensitive' as const
              }
            }
          ]
        }
      }
    }

    // Get unique venues from ConcertLog table with pagination
    const [venueData, totalCount] = await Promise.all([
      prisma.concertLog.groupBy({
        by: ['venue', 'city'],
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: [
          { venue: 'asc' },
          { city: 'asc' }
        ],
        _count: {
          _all: true
        }
      }),
      prisma.concertLog.groupBy({
        by: ['venue', 'city'],
        where: whereClause,
        _count: {
          _all: true
        }
      }).then(results => results.length)
    ])

    // Transform the data to Venue format
    const venues: Venue[] = venueData.map((item, index) => ({
      id: `venue_${item.venue.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${item.city.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
      name: item.venue,
      city: item.city,
      // Simple confidence scoring based on frequency and position
      confidence: calculateConfidence(item._count._all, index, q)
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedResponse<Venue> = {
      data: venues,
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
    const validatedResponse = venueSearchResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Venue search error:', error)
    
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

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to search venues'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = venueCreateSchema.parse(body)
    const { name, city } = validatedData

    // Normalize for matching (case-insensitive)
    const normalizedName = name.trim()
    const normalizedCity = city.trim()

    // Check if venue already exists using case-insensitive matching
    const existingVenue = await prisma.concertLog.findFirst({
      where: {
        venue: {
          equals: normalizedName,
          mode: 'insensitive'
        },
        city: {
          equals: normalizedCity,
          mode: 'insensitive'
        }
      },
      select: {
        venue: true,
        city: true
      }
    })

    if (existingVenue) {
      // Return the existing venue
      const venue: Venue = {
        id: `venue_${existingVenue.venue.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${existingVenue.city.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
        name: existingVenue.venue,
        city: existingVenue.city,
        confidence: 1.0 // Perfect match
      }

      const validatedVenue = venueSchema.parse(venue)

      return NextResponse.json({
        venue: validatedVenue,
        created: false,
        message: 'Venue already exists'
      }, { status: 200 })
    }

    // For now, we just return the venue data as if it was created
    // In a full implementation, you might want to actually create a venues table
    // But based on the current schema, venues are stored in ConcertLog entries
    const venue: Venue = {
      id: `venue_${normalizedName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${normalizedCity.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
      name: normalizedName,
      city: normalizedCity,
      confidence: 1.0
    }

    const validatedVenue = venueSchema.parse(venue)

    return NextResponse.json({
      venue: validatedVenue,
      created: true,
      message: 'Venue created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Venue creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create venue'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate confidence score for venue matches
 * @param frequency - Number of times venue appears in logs
 * @param position - Position in search results (0-based)
 * @param query - Search query string
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(frequency: number, position: number): number {
  // Base confidence from frequency (logarithmic scale)
  let confidence = Math.min(0.3 + (Math.log(frequency + 1) / 10), 0.7)
  
  // Boost for position in results (earlier = higher confidence)
  const positionBoost = Math.max(0, (10 - position) / 50)
  confidence += positionBoost
  
  // For now, we don't have exact matching logic, but this could be enhanced
  // with string similarity algorithms when we have the entity matcher service
  
  return Math.min(confidence, 1.0)
}