'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X, Sparkles, ArrowUpDown } from 'lucide-react'
import ScholarshipCard from './ScholarshipCard'
import FilterPanel from './FilterPanel'
import { createClient } from '@/lib/supabase/client'
import type { Scholarship, ScholarshipFilters, SortOption, UserProfile } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  scholarships: Scholarship[]
  faculties: string[]
  types: string[]
}

const DEFAULT_FILTERS: ScholarshipFilters = {
  query: '',
  type: '',
  faculty: '',
  minGpa: '',
  minAmount: '',
  maxAmount: '',
  year: '',
  applicationRequired: null,
  renewable: null,
  indigenous: false,
  disability: false,
}

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Default',
  amount_desc: 'Highest amount',
  amount_asc: 'Lowest amount',
  deadline_asc: 'Soonest deadline',
  name_asc: 'A → Z',
}

const PAGE_SIZE = 24

// Returns true if the scholarship is plausibly eligible for this profile.
// We err on the side of inclusion — only exclude when we're confident the
// student doesn't qualify.
function matchesProfile(s: Scholarship, profile: UserProfile): boolean {
  // Faculty: if scholarship restricts to specific faculties, user must be in one of them
  if (s.faculty && profile.faculty) {
    const faculties = s.faculty.split(', ').map((f) => f.trim())
    if (!faculties.includes(profile.faculty)) return false
  }

  // GPA requirement: exclude only if scholarship requires higher GPA than user has
  if (s.gpa && s.gpa > 0 && profile.gpa !== null && profile.gpa < s.gpa) return false

  // Indigenous-only scholarships
  if (s.indigenous && !profile.indigenous) return false

  // Disability-only scholarships
  if (s.disability && !profile.disability) return false

  // Gender-restricted scholarships
  if (s.gender && profile.gender && s.gender !== profile.gender) return false

  // International-only scholarships
  if (s.nationality === 'International' && profile.nationality !== 'International') return false

  // Scholarship type vs year
  if (profile.year) {
    const yr = parseInt(profile.year)
    if (!isNaN(yr)) {
      if (yr === 1 && s.scholarship_type === 'In-Course') return false
      if (yr > 1 && s.scholarship_type === 'Entrance') return false
    }
  }

  return true
}

export default function ScholarshipGrid({ scholarships, faculties, types }: Props) {
  const [filters, setFilters] = useState<ScholarshipFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortOption>('default')
  const [forYou, setForYou] = useState(false)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  // Check auth, load saved IDs and profile
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setIsLoggedIn(true)
      const [{ data: saved }, { data: prof }] = await Promise.all([
        supabase.from('saved_scholarships').select('scholarship_id').eq('user_id', user.id),
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      ])
      setSavedIds(new Set((saved ?? []).map((r) => r.scholarship_id)))
      setProfile(prof as UserProfile | null)
    })
  }, [])

  const handleSaveToggle = useCallback((id: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      saved ? next.add(id) : next.delete(id)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase()
    const minAmt = filters.minAmount ? parseFloat(filters.minAmount) : null
    const maxAmt = filters.maxAmount ? parseFloat(filters.maxAmount) : null

    let result = scholarships.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q))
        return false
      if (filters.type && s.scholarship_type !== filters.type) return false
      if (filters.faculty) {
        // Match if the scholarship's faculty list includes the selected faculty
        if (!s.faculty) return false
        const facList = s.faculty.split(', ').map((f) => f.trim())
        if (!facList.includes(filters.faculty)) return false
      }
      if (filters.year) {
        if (!s.year?.includes(filters.year)) return false
      }
      if (filters.minGpa) {
        const min = parseFloat(filters.minGpa)
        if (s.gpa !== null && s.gpa < min) return false
      }
      if (minAmt !== null) {
        if (s.amount === null || s.amount < minAmt) return false
      }
      if (maxAmt !== null) {
        if (s.amount === null || s.amount > maxAmt) return false
      }
      if (filters.applicationRequired !== null) {
        if (s.application_required !== filters.applicationRequired) return false
      }
      if (filters.renewable !== null) {
        if (s.renewable !== filters.renewable) return false
      }
      if (filters.indigenous && !s.indigenous) return false
      if (filters.disability && !s.disability) return false
      return true
    })

    // For You: further filter by profile eligibility
    if (forYou && profile) {
      result = result.filter((s) => matchesProfile(s, profile))
    }

    return result
  }, [scholarships, filters, forYou, profile])

  // Sort
  const sorted = useMemo(() => {
    if (sort === 'default') return filtered
    return [...filtered].sort((a, b) => {
      if (sort === 'amount_desc') return (b.amount ?? -1) - (a.amount ?? -1)
      if (sort === 'amount_asc') {
        // nulls last for ascending
        if (a.amount === null && b.amount === null) return 0
        if (a.amount === null) return 1
        if (b.amount === null) return -1
        return a.amount - b.amount
      }
      if (sort === 'deadline_asc') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
        return da - db
      }
      if (sort === 'name_asc') return a.name.localeCompare(b.name)
      return 0
    })
  }, [filtered, sort])

  // Reset page when filters / sort / forYou change
  useEffect(() => { setPage(1) }, [filters, sort, forYou])

  const paginated = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page])

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'query') return false
    if (typeof v === 'boolean') return v
    if (v === null || v === '') return false
    return true
  }).length

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setSort('default')
    setForYou(false)
  }

  const profileComplete = profile && (profile.faculty || profile.year || profile.gpa !== null)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search + toolbar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search scholarships by name or description…"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            className="input-field pl-10 py-2.5"
          />
          {filters.query && (
            <button
              onClick={() => setFilters((f) => ({ ...f, query: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* For You button */}
        {isLoggedIn && (
          <button
            onClick={() => {
              if (!profileComplete) {
                window.location.href = '/dashboard'
                return
              }
              setForYou((v) => !v)
            }}
            title={profileComplete ? 'Filter to scholarships matching your profile' : 'Complete your profile to use this feature'}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0',
              forYou
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-700'
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">For You</span>
          </button>
        )}

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortMenu((s) => !s)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              sort !== 'default'
                ? 'bg-white border-primary-300 text-primary-700'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden py-1">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSort(value); setShowSortMenu(false) }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                      sort === value ? 'text-primary-600 font-medium' : 'text-slate-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`lg:hidden btn-secondary gap-2 py-2.5 ${activeCount > 0 ? 'border-primary-300 text-primary-700' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="badge bg-primary-100 text-primary-700 -mr-1">{activeCount}</span>
          )}
        </button>
      </div>

      {/* For You banner */}
      {forYou && profile && (
        <div className="mb-4 flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5 text-sm text-primary-700">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            Showing scholarships matched to your profile
            {profile.faculty ? ` (${profile.faculty}` : ''}
            {profile.year ? `, Year ${profile.year}` : ''}
            {profile.gpa ? `, GPA ${profile.gpa}` : ''}
            {profile.faculty || profile.year || profile.gpa ? ')' : ''}.{' '}
            <a href="/dashboard" className="underline hover:text-primary-900">Edit profile →</a>
          </span>
          <button onClick={() => setForYou(false)} className="ml-auto text-primary-400 hover:text-primary-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters — desktop always visible */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterPanel
            filters={filters}
            faculties={faculties}
            types={types}
            onChange={setFilters}
            onReset={resetFilters}
            activeCount={activeCount}
          />
        </aside>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setShowFilters(false)}>
            <div
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-5 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-1 rounded text-slate-500 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel
                filters={filters}
                faculties={faculties}
                types={types}
                onChange={setFilters}
                onReset={resetFilters}
                activeCount={activeCount}
              />
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-700">{paginated.length}</span> of{' '}
              <span className="font-medium text-slate-700">{sorted.length}</span> scholarships
              {forYou && <span className="ml-1 text-primary-600 font-medium">(matched for you)</span>}
            </p>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-slate-600">No scholarships match your filters</p>
              <button onClick={resetFilters} className="mt-3 text-sm text-primary-600 hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((s) => (
                  <ScholarshipCard
                    key={s.id}
                    scholarship={s}
                    saved={savedIds.has(s.id)}
                    onSaveToggle={handleSaveToggle}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>

              {paginated.length < sorted.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary px-8"
                  >
                    Load more ({sorted.length - paginated.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
