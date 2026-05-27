'use client'

import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { cn, formatDeadline, daysUntilDeadline, deadlineUrgency } from '@/lib/utils'
import type { SavedScholarship } from '@/types'

interface Props {
  savedScholarships: SavedScholarship[]
}

export default function DeadlineTracker({ savedScholarships }: Props) {
  const withDeadlines = savedScholarships
    .filter((s) => s.scholarship.deadline)
    .map((s) => ({
      ...s,
      days: daysUntilDeadline(s.scholarship.deadline),
    }))
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))

  const upcoming = withDeadlines.filter((s) => (s.days ?? -1) >= 0)
  const overdue = withDeadlines.filter((s) => (s.days ?? 0) < 0)

  if (withDeadlines.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-400">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-slate-600">No deadlines to track</p>
        <p className="text-sm mt-1">Save scholarships with deadlines to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {overdue.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-2">Overdue</h3>
          {overdue.map((item) => (
            <DeadlineItem key={item.id} item={item} />
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Upcoming</h3>
          {upcoming.map((item) => (
            <DeadlineItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function DeadlineItem({ item }: { item: SavedScholarship & { days: number | null } }) {
  const urgency = deadlineUrgency(item.days)

  const icon = urgency === 'overdue'
    ? <AlertCircle className="w-4 h-4 text-red-500" />
    : urgency === 'urgent'
    ? <AlertCircle className="w-4 h-4 text-amber-500" />
    : item.status === 'applied'
    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
    : <Clock className="w-4 h-4 text-slate-400" />

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border text-sm mb-2',
      urgency === 'overdue' && 'bg-red-50 border-red-200',
      urgency === 'urgent' && 'bg-amber-50 border-amber-200',
      urgency === 'soon' && 'bg-yellow-50 border-yellow-100',
      urgency === 'upcoming' && 'bg-white border-slate-100',
    )}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{item.scholarship.name}</p>
        <p className={cn(
          'text-xs mt-0.5',
          urgency === 'overdue' ? 'text-red-600' : 'text-slate-500'
        )}>
          {urgency === 'overdue'
            ? `Passed ${Math.abs(item.days ?? 0)} day(s) ago`
            : urgency === 'urgent'
            ? `Due in ${item.days} day(s)`
            : formatDeadline(item.scholarship.deadline)
          }
        </p>
      </div>
      <span className={cn(
        'badge flex-shrink-0',
        item.status === 'applied' && 'bg-emerald-100 text-emerald-700',
        item.status === 'awarded' && 'bg-violet-100 text-violet-700',
        item.status === 'saved' && 'bg-slate-100 text-slate-600',
      )}>
        {item.status}
      </span>
    </div>
  )
}
