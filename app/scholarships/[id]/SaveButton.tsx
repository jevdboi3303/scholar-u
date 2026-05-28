'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  scholarshipId: string
  initialSaved: boolean
  isLoggedIn: boolean
}

export default function SaveButton({ scholarshipId, initialSaved, isLoggedIn }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isLoggedIn) {
      window.location.href = '/auth/login'
      return
    }
    setLoading(true)
    const res = await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: scholarshipId, action: saved ? 'unsave' : 'save' }),
    })
    if (res.ok) setSaved((v) => !v)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
        saved
          ? 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
          : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-700'
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {saved ? 'Saved' : 'Save scholarship'}
    </button>
  )
}
