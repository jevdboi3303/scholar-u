import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarship_id, action } = await request.json()

  if (action === 'save') {
    const { error } = await supabase
      .from('saved_scholarships')
      .upsert({ user_id: user.id, scholarship_id }, { onConflict: 'user_id,scholarship_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ saved: true })
  }

  if (action === 'unsave') {
    const { error } = await supabase
      .from('saved_scholarships')
      .delete()
      .eq('user_id', user.id)
      .eq('scholarship_id', scholarship_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ saved: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarship_id, status, notes } = await request.json()
  const update: Record<string, string> = {}
  if (status) update.status = status
  if (notes !== undefined) update.notes = notes

  const { error } = await supabase
    .from('saved_scholarships')
    .update(update)
    .eq('user_id', user.id)
    .eq('scholarship_id', scholarship_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
