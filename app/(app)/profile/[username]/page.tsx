import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { FollowButton } from '@/components/follow-button'
import type { ConcertLog } from '@prisma/client'

export default async function ProfilePage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const { userId } = await auth()

  const profile = await prisma.profile.findUnique({
    where: { username },
    include: {
      logs: {
        orderBy: { date: 'desc' },
        take: 20
      },
      _count: {
        select: {
          followers: true,
          following: true,
          logs: true
        }
      }
    }
  })

  if (!profile) {
    notFound()
  }

  // Check if current user is following this profile
  let isFollowing = false
  let isOwnProfile = false

  if (userId) {
    const currentUserProfile = await prisma.profile.findUnique({
      where: { clerkId: userId }
    })

    if (currentUserProfile) {
      isOwnProfile = currentUserProfile.id === profile.id

      if (!isOwnProfile) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserProfile.id,
              followingId: profile.id
            }
          }
        })
        isFollowing = !!follow
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            {profile.bio && <p className="text-gray-600 mt-2">{profile.bio}</p>}

            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="font-semibold">{profile._count.logs}</span> concerts
              </div>
              <div>
                <span className="font-semibold">{profile._count.followers}</span> followers
              </div>
              <div>
                <span className="font-semibold">{profile._count.following}</span> following
              </div>
            </div>
          </div>

          {!isOwnProfile && userId && (
            <FollowButton username={username} initialFollowing={isFollowing} />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Concerts</h2>
        {profile.logs.length === 0 ? (
          <p className="text-gray-500">No concerts logged yet</p>
        ) : (
          profile.logs.map((log: ConcertLog) => (
            <div key={log.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{log.artist}</h3>
              <p className="text-gray-600">
                {log.venue} • {log.city} • {new Date(log.date).toLocaleDateString()}
              </p>
              {log.rating && <p>{'⭐'.repeat(Math.floor(log.rating))}</p>}
              {log.notes && <p className="mt-2 text-gray-700">{log.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}