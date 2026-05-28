'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import type { ScholarshipFilters } from '@/types'

interface Props {
  filters: ScholarshipFilters
  faculties: string[]
  types: string[]
  onChange: (f: ScholarshipFilters) => void
  onReset: () => void
  activeCount: number
}

export default function FilterPanel({ filters, faculties, types, onChange, onReset, activeCount }: Props) {
  function set<K extends keyof ScholarshipFilters>(key: K, value: ScholarshipFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="badge bg-primary-100 text-primary-700">{activeCount}</span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Scholarship type */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Type
        </label>
        <select
          value={filters.type}
          onChange={(e) => set('type', e.target.value)}
          className="input-field text-sm"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Faculty */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Faculty / Department
        </label>
        <select
          value={filters.faculty}
          onChange={(e) => set('faculty', e.target.value)}
          className="input-field text-sm"
        >
          <option value="">All faculties</option>
          {faculties.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Year of Study
        </label>
        <select
          value={filters.year}
          onChange={(e) => set('year', e.target.value)}
          className="input-field text-sm"
        >
          <option value="">Any year</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {/* Amount range */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Award Amount ($)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="100"
            placeholder="Min"
            value={filters.minAmount}
            onChange={(e) => set('minAmount', e.target.value)}
            className="input-field text-sm w-full"
          />
          <span className="text-slate-400 text-sm flex-shrink-0">–</span>
          <input
            type="number"
            min="0"
            step="100"
            placeholder="Max"
            value={filters.maxAmount}
            onChange={(e) => set('maxAmount', e.target.value)}
            className="input-field text-sm w-full"
          />
        </div>
      </div>

      {/* Min GPA */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Minimum GPA
        </label>
        <input
          type="number"
          min="0"
          max="9"
          step="0.1"
          placeholder="e.g. 7.0"
          value={filters.minGpa}
          onChange={(e) => set('minGpa', e.target.value)}
          className="input-field text-sm"
        />
      </div>

      {/* Application required */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Application
        </label>
        <select
          value={filters.applicationRequired === null ? '' : String(filters.applicationRequired)}
          onChange={(e) =>
            set('applicationRequired', e.target.value === '' ? null : e.target.value === 'true')
          }
          className="input-field text-sm"
        >
          <option value="">Any</option>
          <option value="false">Automatic (no app)</option>
          <option value="true">Application required</option>
        </select>
      </div>

      {/* Renewable */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Renewable
        </label>
        <select
          value={filters.renewable === null ? '' : String(filters.renewable)}
          onChange={(e) =>
            set('renewable', e.target.value === '' ? null : e.target.value === 'true')
          }
          className="input-field text-sm"
        >
          <option value="">Any</option>
          <option value="true">Renewable only</option>
          <option value="false">One-time only</option>
        </select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2.5">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
          Eligibility
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.indigenous}
            onChange={(e) => set('indigenous', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-slate-300 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
            Indigenous students
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.disability}
            onChange={(e) => set('disability', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-slate-300 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
            Students with disabilities
          </span>
        </label>
      </div>
    </div>
  )
}
