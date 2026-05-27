import { createClient } from '@/lib/supabase/server'
import ScholarshipGrid from '@/components/ScholarshipGrid'
import type { Scholarship } from '@/types'

export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createClient()

  const { data: scholarships } = await supabase
    .from('scholarships')
    .select('*')
    .order('name')

  const list = (scholarships ?? []) as Scholarship[]

  const faculties = [
    ...new Set(
      list.map((s) => s.faculty).filter((f): f is string => !!f && f !== 'N/A')
    ),
  ].sort()

  const types = [
    ...new Set(
      list.map((s) => s.scholarship_type).filter((t): t is string => !!t)
    ),
  ].sort()

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-3">
              University of Victoria
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Find your scholarship
            </h1>
            <p className="text-primary-100 text-lg mb-6">
              Browse {list.length} UVic scholarships totalling millions in available funding.
              Filter by faculty, year, GPA, and more.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-2xl font-bold">{list.length}</span>
                <span className="text-primary-200">Scholarships</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-2xl font-bold">{faculties.length}</span>
                <span className="text-primary-200">Faculties</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-2xl font-bold">{types.length}</span>
                <span className="text-primary-200">Types</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Grid */}
      <ScholarshipGrid scholarships={list} faculties={faculties} types={types} />
    </div>
  )
}
