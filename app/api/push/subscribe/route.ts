import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription, device_id, user_agent } = await req.json()
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    subscription,
    device_id,
    user_agent,
  }, { onConflict: 'user_id,device_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { device_id } = await req.json()
  await supabase.from('push_subscriptions')
    .delete().eq('user_id', user.id).eq('device_id', device_id)

  return NextResponse.json({ ok: true })
}
