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

  return (
    <DashboardContent
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile as UserProfile | null}
      savedScholarships={(savedScholarships ?? []) as SavedScholarship[]}
    />
  )
}
