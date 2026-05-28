'use client'

import { useEffect } from 'react'

interface Item {
  id: string
  name: string
  amount: number | null
  scholarship_type: string | null
}

export default function TrackView({ item }: { item: Item }) {
  useEffect(() => {
    try {
      const key = 'scholar-u:recently-viewed'
      const existing: Item[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      const deduped = existing.filter((s) => s.id !== item.id)
      localStorage.setItem(key, JSON.stringify([item, ...deduped].slice(0, 8)))
    } catch { /* localStorage unavailable */ }
  }, [item.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
