'use client'
import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

type Platform = 'android' | 'ios' | null

export function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) return

    // Don't show if user already dismissed
    if (localStorage.getItem('install-banner-dismissed')) return

    const ua = navigator.userAgent

    // iOS Safari detection (not Chrome/Firefox on iOS — those can't install)
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isIosSafari = isIos && /safari/i.test(ua) && !/crios|fxios/i.test(ua)

    if (isIosSafari) {
      setPlatform('ios')
      return
    }

    // Android / Chrome — capture beforeinstallprompt
    function handlePrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e)
      setPlatform('android')
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  function dismiss() {
    localStorage.setItem('install-banner-dismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setDeferredPrompt(null)
  }

  if (dismissed || !platform) return null

  return (
    <div className="mx-4 mb-3 bg-[#1a1a1a] text-white rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
        {platform === 'ios' ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Install Vehicle Vault</p>
        {platform === 'ios' ? (
          <p className="text-xs text-white/60 mt-0.5">
            Tap <Share className="w-3 h-3 inline mx-0.5" /> then <strong className="text-white/80">Add to Home Screen</strong>
          </p>
        ) : (
          <p className="text-xs text-white/60 mt-0.5">Add to your home screen for quick access</p>
        )}
      </div>

      {platform === 'android' && (
        <button
          onClick={install}
          className="flex-shrink-0 bg-white text-[#1a1a1a] text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
        >
          Install
        </button>
      )}

      <button onClick={dismiss} className="flex-shrink-0 text-white/40 active:text-white/80 ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
