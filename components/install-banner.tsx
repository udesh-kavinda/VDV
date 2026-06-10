'use client'
import { useEffect, useState } from 'react'
import { X, Share, Download, Smartphone } from 'lucide-react'

type Mode = 'android-prompt' | 'android-manual' | 'ios' | null

export function InstallBanner() {
  const [mode, setMode] = useState<Mode>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Already installed — don't show
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) return

    // Already dismissed
    if (sessionStorage.getItem('install-dismissed')) return

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isIosSafari = isIos && !/crios|fxios/i.test(ua)

    if (isIosSafari) {
      setMode('ios')
      return
    }

    // Android/Chrome — wait up to 3s for beforeinstallprompt
    const timer = setTimeout(() => {
      // Prompt didn't fire — show manual instructions
      setMode('android-manual')
    }, 3000)

    function onPrompt(e: Event) {
      clearTimeout(timer)
      e.preventDefault()
      setDeferredPrompt(e)
      setMode('android-prompt')
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setDeferredPrompt(null)
  }

  if (dismissed || !mode) return null

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-[#2d2d2d] bg-[#1a1a1a] text-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Install Vehicle Vault</p>
          {mode === 'ios' && (
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Tap the <span className="text-white font-medium">Share</span> button{' '}
              <Share className="w-3 h-3 inline" /> at the bottom of Safari, then tap{' '}
              <span className="text-white font-medium">"Add to Home Screen"</span>
            </p>
          )}
          {mode === 'android-prompt' && (
            <p className="text-xs text-white/60 mt-1">Add to your home screen for the best experience.</p>
          )}
          {mode === 'android-manual' && (
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Tap the <span className="text-white font-medium">⋮ menu</span> in Chrome, then{' '}
              <span className="text-white font-medium">"Add to Home screen"</span>
            </p>
          )}
          {mode === 'android-prompt' && (
            <button
              onClick={install}
              className="mt-2.5 flex items-center gap-1.5 bg-white text-[#1a1a1a] text-xs font-bold px-3.5 py-1.5 rounded-lg active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5" /> Install now
            </button>
          )}
        </div>
        <button onClick={dismiss} className="text-white/40 active:text-white flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
