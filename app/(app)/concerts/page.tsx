'use client'

  import { useEffect, useState } from 'react'
  import Link from 'next/link'

  export default function ConcertsPage() {
    const [concerts, setConcerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      fetch('/api/concerts')
        .then(res => res.json())
        .then(data => {
          setConcerts(data)
          setLoading(false)
        })
    }, [])

    if (loading) {
      return <div className="max-w-4xl mx-auto p-6">Loading...</div>
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Concerts</h1>
          <Link
            href="/concerts/new"
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Log Concert
          </Link>
        </div>

        {concerts.length === 0 ? (
          <p className="text-gray-500">No concerts logged yet. Log your first show!</p>
        ) : (
          <div className="space-y-4">
            {concerts.map((concert: any) => (
              <div key={concert.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{concert.artist}</h2>
                    <p className="text-gray-600">
                      {concert.venue} • {concert.city}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(concert.date).toLocaleDateString()}
                    </p>
                  </div>
                  {concert.rating && (
                    <div className="text-2xl">
                      {'⭐'.repeat(Math.floor(concert.rating))}
                    </div>
                  )}
                </div>
                {concert.notes && (
                  <p className="mt-2 text-gray-700">{concert.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }