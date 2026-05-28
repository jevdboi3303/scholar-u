'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { formatAmount } from '@/lib/utils'

interface Item {
  id: string
  name: string
  amount: number | null
  scholarship_type: string | null
}

const TYPE_COLORS: Record<string, string> = {
  'Entrance':  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'In-Course': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Travel':    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('scholar-u:recently-viewed')
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
        <Clock className="w-4 h-4" />
        Recently viewed
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/scholarships/${item.id}`}
            className="flex-shrink-0 w-56 card p-4 hover:shadow-md transition-shadow"
          >
            {item.scholarship_type && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block ${TYPE_COLORS[item.scholarship_type] ?? 'bg-slate-100 text-slate-600'}`}>
                {item.scholarship_type}
              </span>
            )}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
              {item.name}
            </p>
            {item.amount && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                {formatAmount(item.amount)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
