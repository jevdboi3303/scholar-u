import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ExternalLink, DollarSign, GraduationCap, Calendar,
  AlertCircle, RefreshCw, ClipboardList, Users, BookOpen
} from 'lucide-react'
import { cn, formatAmount, formatDeadline, daysUntilDeadline, deadlineUrgency } from '@/lib/utils'
import type { Scholarship } from '@/types'
import SaveButton from './SaveButton'

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
}

const TYPE_COLORS: Record<string, string> = {
  'Entrance':  'bg-violet-100 text-violet-700 border-violet-200',
  'In-Course': 'bg-blue-100 text-blue-700 border-blue-200',
  'Travel':    'bg-amber-100 text-amber-700 border-amber-200',
}

export default async function ScholarshipDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: scholarship }, { data: { user } }] = await Promise.all([
    supabase.from('scholarships').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!scholarship) notFound()

  const s = scholarship as Scholarship

  // Load saved state if logged in
  let isSaved = false
  if (user) {
    const { data } = await supabase
      .from('saved_scholarships')
      .select('id')
      .eq('user_id', user.id)
      .eq('scholarship_id', id)
      .maybeSingle()
    isSaved = !!data
  }

  // Related scholarships (same faculty or type, excluding this one)
  const { data: related } = await supabase
    .from('scholarships')
    .select('id, name, amount, scholarship_type, faculty')
    .neq('id', id)
    .or(
      [
        s.faculty ? `faculty.ilike.%${s.faculty.split(', ')[0]}%` : null,
        s.scholarship_type ? `scholarship_type.eq.${s.scholarship_type}` : null,
      ].filter(Boolean).join(',')
    )
    .limit(4)

  const days = daysUntilDeadline(s.deadline)
  const urgency = deadlineUrgency(days)
  const typeColor = TYPE_COLORS[s.scholarship_type ?? ''] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to scholarships
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {s.scholarship_type && (
                  <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', typeColor)}>
                    {s.scholarship_type}
                  </span>
                )}
                {s.application_required === false && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                    No application needed
                  </span>
                )}
                {s.application_required === true && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                    Application required
                  </span>
                )}
                {s.renewable && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Renewable
                  </span>
                )}
                {s.indigenous && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                    Indigenous students
                  </span>
                )}
                {s.disability && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                    Students with disabilities
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 leading-snug mb-4">
                {s.name}
              </h1>

              {/* Key stats row */}
              <div className="flex flex-wrap gap-4 text-sm mb-5">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className={cn('font-semibold', s.amount ? 'text-emerald-700' : 'text-slate-500')}>
                    {formatAmount(s.amount)}
                  </span>
                  {s.quantity && s.quantity !== '1' && (
                    <span className="text-slate-400">× {s.quantity}</span>
                  )}
                </div>
                {s.faculty && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <GraduationCap className="w-4 h-4" />
                    {s.faculty}
                  </div>
                )}
                {s.gpa && s.gpa > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <BookOpen className="w-4 h-4" />
                    GPA ≥ {s.gpa}
                  </div>
                )}
              </div>

              {/* Deadline */}
              {(s.deadline || s.deadline_text) && (
                <div className={cn(
                  'inline-flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-5',
                  s.deadline && urgency === 'overdue' && 'bg-red-50 text-red-700',
                  s.deadline && urgency === 'urgent'  && 'bg-amber-50 text-amber-700',
                  s.deadline && urgency === 'soon'    && 'bg-yellow-50 text-yellow-700',
                  (!s.deadline || urgency === 'upcoming') && 'bg-slate-100 text-slate-600',
                )}>
                  {s.deadline && (urgency === 'urgent' || urgency === 'overdue')
                    ? <AlertCircle className="w-4 h-4" />
                    : <Calendar className="w-4 h-4" />
                  }
                  {s.deadline
                    ? urgency === 'overdue' ? 'Deadline has passed'
                      : urgency === 'urgent' ? `Due in ${days} days — ${formatDeadline(s.deadline)}`
                      : formatDeadline(s.deadline)
                    : s.deadline_text
                  }
                </div>
              )}

              {/* Description */}
              {s.description && (
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {s.description}
                </p>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* CTA card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              {s.source_url && (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center gap-2"
                >
                  Apply on UVic
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <SaveButton
                scholarshipId={s.id}
                initialSaved={isSaved}
                isLoggedIn={!!user}
              />
            </div>

            {/* Details card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Details</h2>
              <dl className="space-y-2.5 text-sm">
                {s.scholarship_type && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Type</dt>
                    <dd className="text-slate-800 font-medium text-right">{s.scholarship_type}</dd>
                  </div>
                )}
                {s.amount && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Value</dt>
                    <dd className="text-slate-800 font-medium">{formatAmount(s.amount)}</dd>
                  </div>
                )}
                {s.quantity && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Number awarded</dt>
                    <dd className="text-slate-800 font-medium">{s.quantity}</dd>
                  </div>
                )}
                {s.faculty && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Faculty</dt>
                    <dd className="text-slate-800 font-medium text-right">{s.faculty}</dd>
                  </div>
                )}
                {s.year && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Year</dt>
                    <dd className="text-slate-800 font-medium">Year {s.year}</dd>
                  </div>
                )}
                {s.gpa && s.gpa > 0 && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Min GPA</dt>
                    <dd className="text-slate-800 font-medium">{s.gpa}</dd>
                  </div>
                )}
                {s.gender && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Gender</dt>
                    <dd className="text-slate-800 font-medium">{s.gender}</dd>
                  </div>
                )}
                {s.nationality && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Nationality</dt>
                    <dd className="text-slate-800 font-medium">{s.nationality}</dd>
                  </div>
                )}
                {s.renewable !== null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Renewable
                    </dt>
                    <dd className="text-slate-800 font-medium">{s.renewable ? 'Yes' : 'No'}</dd>
                  </div>
                )}
                {s.application_required !== null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Application
                    </dt>
                    <dd className="text-slate-800 font-medium">{s.application_required ? 'Required' : 'Not required'}</dd>
                  </div>
                )}
                {(s.indigenous || s.disability) && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Focus
                    </dt>
                    <dd className="text-slate-800 font-medium text-right">
                      {[s.indigenous && 'Indigenous', s.disability && 'Disability'].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Related scholarships */}
            {related && related.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Related scholarships</h2>
                <ul className="space-y-2">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/scholarships/${r.id}`}
                        className="text-sm text-primary-600 hover:text-primary-800 hover:underline leading-snug block"
                      >
                        {r.name}
                      </Link>
                      {r.amount && (
                        <span className="text-xs text-slate-400">{formatAmount(r.amount)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
