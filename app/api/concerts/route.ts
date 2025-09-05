import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()

  // Get or create profile
  let profile = await prisma.profile.findUnique({
    where: { clerkId: userId }
  })

  if (!profile) {
    const user = await (await clerkClient()).users.getUser(userId)
    profile = await prisma.profile.create({
      data: {
        clerkId: userId,
        email: user.emailAddresses[0].emailAddress,
        username: user.username || user.firstName || userId.slice(-6),
      }
    })
  }

  const log = await prisma.concertLog.create({
    data: {
      profileId: profile.id,
      artist: body.artist,
      venue: body.venue,
      city: body.city,
      date: new Date(body.date),
      rating: body.rating,
      notes: body.notes,
    }
  })

  return NextResponse.json(log)
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { clerkId: userId },
    include: {
      logs: {
        orderBy: { date: 'desc' }
      }
    }
  })

  return NextResponse.json(profile?.logs || [])
}