'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  username: string
  initialFollowing?: boolean
}

export function FollowButton({ username, initialFollowing = false }: 
FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFollow() {
    setLoading(true)

    const res = await fetch('/api/follow', {
      method: following ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUsername: username })
    })

    if (res.ok) {
      setFollowing(!following)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-medium ${
        following 
          ? 'bg-gray-200 text-black hover:bg-gray-300' 
          : 'bg-black text-white hover:bg-gray-800'
      } disabled:opacity-50`}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  )
}