'use client'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { subscribeToPush, isPushSubscribed } from '@/lib/notifications'

export function PushPrompt() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

  useEffect(() => {
    isPushSubscribed().then(setSubscribed)
  }, [])

  if (subscribed === null || subscribed === true) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-border bg-secondary p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">Enable notifications</p>
        <p className="text-xs text-muted-foreground mt-0.5">Get alerts when your documents are about to expire.</p>
      </div>
      <Button size="sm" onClick={async () => {
        const ok = await subscribeToPush(vapidKey)
        if (ok) setSubscribed(true)
      }}>
        Enable
      </Button>
    </div>
  )
}
