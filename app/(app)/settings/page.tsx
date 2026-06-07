'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/lib/notifications'

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    isPushSubscribed().then(setPushEnabled)
  }, [])

  async function togglePush() {
    if (pushEnabled) {
      await unsubscribeFromPush()
      setPushEnabled(false)
    } else {
      const ok = await subscribeToPush(vapidKey)
      if (ok) setPushEnabled(true)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get push alerts 30, 14, 7, and 1 day before a document expires.
          </p>
          <Button
            variant={pushEnabled ? 'outline' : 'default'}
            className="w-full"
            onClick={togglePush}
          >
            {pushEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => alert('To delete your account, contact support.')}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
