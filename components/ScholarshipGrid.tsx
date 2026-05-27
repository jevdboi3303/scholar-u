'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import ScholarshipCard from './ScholarshipCard'
import FilterPanel from './FilterPanel'
import { createClient } from '@/lib/supabase/client'
import type { Scholarship, ScholarshipFilters } from '@/types'

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
  year: '',
  applicationRequired: null,
  renewable: null,
  indigenous: false,
  disability: false,
}

const PAGE_SIZE = 24

export default function ScholarshipGrid({ scholarships, faculties, types }: Props) {
  const [filters, setFilters] = useState<ScholarshipFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  // Check auth + load saved scholarships
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setIsLoggedIn(true)
      const { data } = await supabase
        .from('saved_scholarships')
        .select('scholarship_id')
        .eq('user_id', user.id)
      setSavedIds(new Set((data ?? []).map((r) => r.scholarship_id)))
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
    return scholarships.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q))
        return false
      if (filters.type && s.scholarship_type !== filters.type) return false
      if (filters.faculty && s.faculty !== filters.faculty) return false
      if (filters.year) {
        // Year field in DB can be like "03-Apr" (meaning year 3-4) or "1", "2", etc.
        const yr = filters.year
        if (!s.year?.includes(yr)) return false
      }
      if (filters.minGpa) {
        const min = parseFloat(filters.minGpa)
        if (s.gpa !== null && s.gpa < min) return false
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
  }, [scholarships, filters])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [filters])

  const paginated = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page]
  )

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'query') return false
    if (typeof v === 'boolean') return v
    if (v === null || v === '') return false
    return true
  }).length

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
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
              <span className="font-medium text-slate-700">{filtered.length}</span> scholarships
            </p>
          </div>

          {filtered.length === 0 ? (
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

              {paginated.length < filtered.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary px-8"
                  >
                    Load more ({filtered.length - paginated.length} remaining)
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
