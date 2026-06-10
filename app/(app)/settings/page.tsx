'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Download, Share } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/lib/notifications'

type InstallMode = 'android-prompt' | 'android-manual' | 'ios' | 'installed' | null

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [installMode, setInstallMode] = useState<InstallMode>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    isPushSubscribed().then(setPushEnabled)

    // Detect install state
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setInstallMode('installed')
      return
    }

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isIosSafari = isIos && !/crios|fxios/i.test(ua)

    if (isIosSafari) {
      setInstallMode('ios')
      return
    }

    const timer = setTimeout(() => setInstallMode('android-manual'), 3000)

    function onPrompt(e: Event) {
      clearTimeout(timer)
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallMode('android-prompt')
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
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

  async function installApp() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstallMode('installed')
    setDeferredPrompt(null)
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

      {installMode !== 'installed' && installMode !== null && (
        <Card>
          <CardHeader><CardTitle className="text-base">Install App</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {installMode === 'ios' && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tap the <Share className="w-3.5 h-3.5 inline" /> <strong className="text-foreground">Share</strong> button at the bottom of Safari, then tap <strong className="text-foreground">"Add to Home Screen"</strong>.
              </p>
            )}
            {installMode === 'android-manual' && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tap the <strong className="text-foreground">⋮ menu</strong> in Chrome, then tap <strong className="text-foreground">"Add to Home screen"</strong>.
              </p>
            )}
            {installMode === 'android-prompt' && (
              <>
                <p className="text-sm text-muted-foreground">Install Vehicle Vault on your home screen for the best experience.</p>
                <Button className="w-full" onClick={installApp}>
                  <Download className="w-4 h-4 mr-2" /> Install App
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
