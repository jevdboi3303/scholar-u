import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const profile = {
    id: user.id,
    name: body.name ?? null,
    faculty: body.faculty ?? null,
    year: body.year ?? null,
    gpa: body.gpa ? parseFloat(body.gpa) : null,
    gender: body.gender ?? null,
    nationality: body.nationality ?? null,
    indigenous: body.indigenous ?? false,
    disability: body.disability ?? false,
  }

  const { error } = await supabase
    .from('user_profiles')
    .upsert(profile, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
