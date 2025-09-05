import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { targetUsername } = await request.json()

  const [profile, targetProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { clerkId: userId } }),
    prisma.profile.findUnique({ where: { username: targetUsername } })
  ])

  if (!profile || !targetProfile) {
    return new Response('Profile not found', { status: 404 })
  }

  if (profile.id === targetProfile.id) {
    return new Response('Cannot follow yourself', { status: 400 })
  }

  try {
    await prisma.follow.create({
      data: {
        followerId: profile.id,
        followingId: targetProfile.id
      }
    })
    return NextResponse.json({ success: true, message: 'Followed successfully' })
  } catch (error) {
    // Already following
    return new Response('Already following', { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { targetUsername } = await request.json()

  const [profile, targetProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { clerkId: userId } }),
    prisma.profile.findUnique({ where: { username: targetUsername } })
  ])

  if (!profile || !targetProfile) {
    return new Response('Profile not found', { status: 404 })
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: profile.id,
      followingId: targetProfile.id
    }
  })

  return NextResponse.json({ success: true, message: 'Unfollowed 
successfully' })
}