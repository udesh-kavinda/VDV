import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

Deno.serve(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thresholds = [1, 7, 14, 30]

  for (const days of thresholds) {
    const target = new Date(today)
    target.setDate(target.getDate() + days)
    const targetStr = target.toISOString().split('T')[0]

    const { data: docs } = await supabase
      .from('documents')
      .select('id, expires_at, user_id, type, label')
      .eq('expires_at', targetStr)

    if (!docs) continue

    for (const doc of docs) {
      const { data: logged } = await supabase
        .from('notification_log')
        .select('id')
        .eq('document_id', doc.id)
        .eq('threshold_days', days)
        .eq('expires_at_snapshot', doc.expires_at)
        .maybeSingle()

      if (logged) continue

      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', doc.user_id)

      if (!subs?.length) continue

      const label = doc.label ?? doc.type.replace('_', ' ')
      const body = `${label} expires in ${days} day${days > 1 ? 's' : ''}`

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({ title: 'Vehicle Vault', body })
          )
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      }

      await supabase.from('notification_log').insert({
        document_id: doc.id,
        threshold_days: days,
        expires_at_snapshot: doc.expires_at,
      })
    }
  }

  return new Response('ok')
})
