import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { searchParamsSchema, artistSearchResponseSchema } from '@/app/lib/schemas/entities'
import { Artist, PaginatedResponse } from '@/app/lib/types/entities'
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
          artist: {
            startsWith: searchTerm,
            mode: 'insensitive' as const
          }
        }
      } else {
        // For regular search, use contains matching (case insensitive)
        whereClause = {
          artist: {
            contains: searchTerm,
            mode: 'insensitive' as const
          }
        }
      }
    }

    // Get unique artists from ConcertLog table with pagination
    const [artistData, totalCount] = await Promise.all([
      prisma.concertLog.groupBy({
        by: ['artist'],
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          artist: 'asc'
        },
        _count: {
          _all: true
        }
      }),
      prisma.concertLog.groupBy({
        by: ['artist'],
        where: whereClause,
        _count: {
          _all: true
        }
      }).then(results => results.length)
    ])

    // Transform the data to Artist format
    const artists: Artist[] = artistData.map((item, index) => ({
      id: `artist_${item.artist.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
      name: item.artist,
      // Simple confidence scoring based on frequency and position
      confidence: calculateConfidence(item._count._all, index, q)
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedResponse<Artist> = {
      data: artists,
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
    const validatedResponse = artistSearchResponseSchema.parse(response)

    return NextResponse.json(validatedResponse)
  } catch (error) {
    console.error('Artist search error:', error)
    
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
        message: 'Failed to search artists'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate confidence score for artist matches
 * @param frequency - Number of times artist appears in logs
 * @param position - Position in search results (0-based)
 * @param query - Search query string
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(frequency: number, position: number, _query?: string): number {
  // Base confidence from frequency (logarithmic scale)
  let confidence = Math.min(0.3 + (Math.log(frequency + 1) / 10), 0.7)
  
  // Boost for position in results (earlier = higher confidence)
  const positionBoost = Math.max(0, (10 - position) / 50)
  confidence += positionBoost
  
  // For now, we don't have exact matching logic, but this could be enhanced
  // with string similarity algorithms when we have the entity matcher service
  
  return Math.min(confidence, 1.0)
}