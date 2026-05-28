'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, DollarSign, GraduationCap, Calendar, AlertCircle, ExternalLink } from 'lucide-react'
import { cn, formatAmount, formatDeadline, daysUntilDeadline, deadlineUrgency } from '@/lib/utils'
import type { Scholarship } from '@/types'

interface Props {
  scholarship: Scholarship
  saved?: boolean
  onSaveToggle?: (id: string, save: boolean) => void
  isLoggedIn: boolean
}

const TYPE_COLORS: Record<string, string> = {
  'Entrance': 'bg-violet-100 text-violet-700',
  'In-Course': 'bg-blue-100 text-blue-700',
  'Graduate': 'bg-emerald-100 text-emerald-700',
  'Exchange': 'bg-amber-100 text-amber-700',
}

export default function ScholarshipCard({ scholarship, saved = false, onSaveToggle, isLoggedIn }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [isSaved, setIsSaved] = useState(saved)
  const [saving, setSaving] = useState(false)

  const days = daysUntilDeadline(scholarship.deadline)
  const urgency = deadlineUrgency(days)

  async function handleSave() {
    if (!isLoggedIn) {
      window.location.href = '/auth/login'
      return
    }
    setSaving(true)
    const action = isSaved ? 'unsave' : 'save'
    const res = await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: scholarship.id, action }),
    })
    if (res.ok) {
      setIsSaved(!isSaved)
      onSaveToggle?.(scholarship.id, !isSaved)
    }
    setSaving(false)
  }

  const typeColor = TYPE_COLORS[scholarship.scholarship_type ?? ''] ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="card flex flex-col">
      <div className="p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {scholarship.scholarship_type && (
              <span className={cn('badge', typeColor)}>
                {scholarship.scholarship_type}
              </span>
            )}
            {scholarship.application_required && (
              <span className="badge bg-orange-100 text-orange-700">App Required</span>
            )}
            {scholarship.renewable && (
              <span className="badge bg-green-100 text-green-700">Renewable</span>
            )}
            {scholarship.indigenous && (
              <span className="badge bg-teal-100 text-teal-700">Indigenous</span>
            )}
            {scholarship.disability && (
              <span className="badge bg-purple-100 text-purple-700">Disability</span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            title={isSaved ? 'Unsave' : 'Save'}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg transition-colors',
              isSaved
                ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-base leading-snug mb-3">
          <Link
            href={`/scholarships/${scholarship.id}`}
            className="text-slate-900 hover:text-primary-600 transition-colors"
          >
            {scholarship.name}
          </Link>
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500 mb-3">
          {scholarship.amount ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <DollarSign className="w-3.5 h-3.5" />
              {formatAmount(scholarship.amount)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <DollarSign className="w-3.5 h-3.5" />
              Varies
            </span>
          )}
          {scholarship.faculty && scholarship.faculty !== 'N/A' && (
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {scholarship.faculty}
            </span>
          )}
          {scholarship.year && scholarship.year !== 'N/A' && (
            <span>Year {scholarship.year}</span>
          )}
          {scholarship.gpa && scholarship.gpa > 0 && (
            <span>GPA ≥ {scholarship.gpa}</span>
          )}
        </div>

        {/* Deadline */}
        {(scholarship.deadline || scholarship.deadline_text) && (
          <div className={cn(
            'flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 mb-3 w-fit',
            scholarship.deadline && urgency === 'overdue' && 'bg-red-50 text-red-700',
            scholarship.deadline && urgency === 'urgent' && 'bg-amber-50 text-amber-700',
            scholarship.deadline && urgency === 'soon' && 'bg-yellow-50 text-yellow-700',
            (!scholarship.deadline || urgency === 'upcoming') && 'bg-slate-50 text-slate-600',
          )}>
            {scholarship.deadline && (urgency === 'urgent' || urgency === 'overdue')
              ? <AlertCircle className="w-3.5 h-3.5" />
              : <Calendar className="w-3.5 h-3.5" />
            }
            {scholarship.deadline
              ? urgency === 'overdue'
                ? 'Deadline passed'
                : urgency === 'urgent'
                ? `Due in ${days} days`
                : formatDeadline(scholarship.deadline)
              : scholarship.deadline_text
            }
          </div>
        )}

        {/* Description */}
        {scholarship.description && (
          <div>
            <p className={cn(
              'text-sm text-slate-600 leading-relaxed',
              !expanded && 'line-clamp-3'
            )}>
              {scholarship.description}
            </p>
            {scholarship.description.length > 200 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-1.5 text-xs text-primary-600 hover:text-primary-800 flex items-center gap-0.5 font-medium"
              >
                {expanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> Read more</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {(scholarship.source_url || (scholarship.preference && scholarship.preference !== 'N/A')) && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center justify-between gap-3">
          {scholarship.preference && scholarship.preference !== 'N/A' && (
            <p className="text-xs text-slate-500 min-w-0 truncate">
              <span className="font-medium">Preference: </span>{scholarship.preference}
            </p>
          )}
          {scholarship.source_url && (
            <a
              href={scholarship.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium shrink-0 ml-auto"
            >
              View on UVic
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
