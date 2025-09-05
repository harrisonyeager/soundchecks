'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewConcert() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    const res = await fetch('/api/concerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist: formData.get('artist'),
        venue: formData.get('venue'),
        city: formData.get('city'),
        date: formData.get('date'),
        rating: formData.get('rating') ? parseFloat(formData.get('rating') as string) : null,
        notes: formData.get('notes'),
      }),
    })

    if (res.ok) {
      router.push('/concerts')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Log a Concert</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="artist" className="block text-sm font-medium mb-1">
            Artist *
          </label>
          <input
            id="artist"
            name="artist"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="venue" className="block text-sm font-medium mb-1">
            Venue *
          </label>
          <input
            id="venue"
            name="venue"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            City *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium mb-1">
            Rating (0-5)
          </label>
          <input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.5"
            placeholder="Optional"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Optional thoughts about the show..."
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Concert'}
        </button>
      </form>
    </div>
  )
}