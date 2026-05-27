import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` is set by OAuthButtons to redirect after OAuth; default to /dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Seed user_profiles from OAuth provider metadata (Google, Microsoft, Apple)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta = user.user_metadata ?? {}
      // Google sends full_name; Microsoft sends name; Apple sends name.firstName + name.lastName
      const appleName = [meta.given_name, meta.family_name].filter(Boolean).join(' ') || null
      const oauthName: string | null = meta.full_name ?? meta.name ?? appleName

      // Check if a profile already exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('id', user.id)
        .single()

      if (!existing) {
        // First sign-in — create the profile
        await supabase.from('user_profiles').insert({
          id: user.id,
          name: oauthName,
          indigenous: false,
          disability: false,
        })
      } else if (!existing.name && oauthName) {
        // Profile exists but name is blank — fill it in from OAuth
        await supabase.from('user_profiles').update({ name: oauthName }).eq('id', user.id)
      }
    }
  }

  // Only allow relative paths to prevent open-redirect attacks
  const redirectTo = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
