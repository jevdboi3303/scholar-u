'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, BookMarked, Calendar, Loader2, Trash2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DeadlineTracker from './DeadlineTracker'
import type { UserProfile, SavedScholarship } from '@/types'
import { formatAmount } from '@/lib/utils'

interface Props {
  user: { id: string; email: string }
  profile: UserProfile | null
  savedScholarships: SavedScholarship[]
}

type Tab = 'saved' | 'deadlines' | 'profile'

const FACULTIES = [
  'Arts', 'Business', 'Education', 'Engineering', 'Fine Arts', 'Human & Social Development',
  'Humanities', 'Law', 'Music', 'Science', 'Social Sciences',
]

export default function DashboardContent({ user, profile, savedScholarships: initial }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('saved')
  const [saved, setSaved] = useState(initial)

  // Profile form state
  const [name, setName] = useState(profile?.name ?? '')
  const [faculty, setFaculty] = useState(profile?.faculty ?? '')
  const [year, setYear] = useState(profile?.year ?? '')
  const [gpa, setGpa] = useState(profile?.gpa?.toString() ?? '')
  const [gender, setGender] = useState(profile?.gender ?? '')
  const [indigenous, setIndigenous] = useState(profile?.indigenous ?? false)
  const [disability, setDisability] = useState(profile?.disability ?? false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, faculty, year, gpa, gender, indigenous, disability }),
    })
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  async function updateStatus(scholarshipId: string, status: string) {
    await fetch('/api/saved', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: scholarshipId, status }),
    })
    setSaved((prev) =>
      prev.map((s) => s.scholarship_id === scholarshipId ? { ...s, status: status as SavedScholarship['status'] } : s)
    )
  }

  async function unsave(scholarshipId: string) {
    await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarship_id: scholarshipId, action: 'unsave' }),
    })
    setSaved((prev) => prev.filter((s) => s.scholarship_id !== scholarshipId))
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'saved', label: 'Saved', icon: <BookMarked className="w-4 h-4" />, count: saved.length },
    { key: 'deadlines', label: 'Deadlines', icon: <Calendar className="w-4 h-4" /> },
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.name ? `Hi, ${profile.name.split(' ')[0]}` : 'My Dashboard'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
        </div>
        <button onClick={handleSignOut} className="btn-secondary text-sm">
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {icon}
            {label}
            {count !== undefined && count > 0 && (
              <span className="badge bg-primary-100 text-primary-700 ml-0.5">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Saved scholarships */}
      {tab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-slate-600">No saved scholarships yet</p>
              <p className="text-sm mt-1">Browse scholarships and bookmark the ones you&apos;re interested in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map((item) => (
                <div key={item.id} className="card p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm">{item.scholarship.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      {item.scholarship.amount && (
                        <span className="text-emerald-600 font-medium">
                          {formatAmount(item.scholarship.amount)}
                        </span>
                      )}
                      {item.scholarship.faculty && item.scholarship.faculty !== 'N/A' && (
                        <span>{item.scholarship.faculty}</span>
                      )}
                      {item.scholarship.deadline && (
                        <span>Due: {new Date(item.scholarship.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.scholarship_id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="awarded">Awarded</option>
                    </select>
                    <button
                      onClick={() => unsave(item.scholarship_id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deadlines */}
      {tab === 'deadlines' && (
        <DeadlineTracker savedScholarships={saved} />
      )}

      {/* Profile */}
      {tab === 'profile' && (
        <div className="card p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-5">Your profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Faculty</label>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select faculty</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="graduate">Graduate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">GPA (out of 9.0)</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  step="0.1"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input-field"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Woman">Woman</option>
                  <option value="Man">Man</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indigenous}
                  onChange={(e) => setIndigenous(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 border-slate-300"
                />
                <span className="text-sm text-slate-700">I identify as Indigenous</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disability}
                  onChange={(e) => setDisability(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 border-slate-300"
                />
                <span className="text-sm text-slate-700">I have a disability</span>
              </label>
            </div>

            <button type="submit" disabled={profileSaving} className="btn-primary w-full justify-center mt-2">
              {profileSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : profileSaved ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : (
                'Save profile'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
