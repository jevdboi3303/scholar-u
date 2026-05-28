import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/DashboardContent'
import type { SavedScholarship, UserProfile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: savedScholarships }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('saved_scholarships')
      .select('*, scholarship:scholarships(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Count scholarships that match the user's profile
  let matchCount = 0
  if (profile) {
    try {
      let q = supabase.from('scholarships').select('*', { count: 'exact', head: true })
      if (!profile.indigenous) q = q.or('indigenous.is.null,indigenous.eq.false')
      if (!profile.disability)  q = q.or('disability.is.null,disability.eq.false')
      if (profile.faculty)      q = q.or(`faculty.is.null,faculty.ilike.%${profile.faculty}%`)
      if (profile.gpa && profile.gpa > 0) q = q.or(`gpa.is.null,gpa.lte.${profile.gpa}`)
      const { count } = await q
      matchCount = count ?? 0
    } catch { /* non-critical */ }
  }

  return (
    <DashboardContent
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile as UserProfile | null}
      savedScholarships={(savedScholarships ?? []) as SavedScholarship[]}
      matchCount={matchCount}
    />
  )
}
