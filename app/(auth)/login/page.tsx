'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { ArrowRight, Shield, Bell, Link, Mail } from 'lucide-react'
import { Logo } from '@/components/logo'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        // Email confirmation disabled — user is immediately logged in
        router.push('/dashboard')
      } else {
        // Email confirmation required
        setConfirmSent(true)
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f5f0eb] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="mb-6 drop-shadow-lg">
          <Logo size={80} />
        </div>

        <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight mb-2">Vehicle Vault</h1>
        <p className="text-[#9a8f84] text-center text-sm max-w-xs leading-relaxed">
          Keep all your vehicle documents in one place. Never miss a renewal again.
        </p>

        <div className="flex flex-wrap gap-2 justify-center mt-6 mb-10">
          {[
            { icon: Shield, label: 'Insurance' },
            { icon: Bell, label: 'Expiry alerts' },
            { icon: Link, label: 'Quick renewals' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white border border-[#ede8e0] rounded-full px-3 py-1.5 text-xs font-medium text-[#5a5a5a]">
              <Icon className="w-3 h-3 text-[#9a8f84]" />
              {label}
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#ede8e0] p-6 shadow-sm">
          {confirmSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <p className="font-semibold text-[#1a1a1a] mb-1">Check your inbox</p>
              <p className="text-sm text-[#9a8f84]">Confirm your email at <span className="font-medium text-[#2d2d2d]">{email}</span> then sign in.</p>
              <button
                type="button"
                onClick={() => { setConfirmSent(false); setMode('signin') }}
                className="mt-4 text-xs text-[#9a8f84] underline underline-offset-2"
              >
                Back to sign in
              </button>
            </div>
          ) : (
          <>
          {/* Tab toggle */}
          <div className="flex bg-[#f5f0eb] rounded-xl p-1 mb-5">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mode === m ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#9a8f84]'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#f9f7f5] border-[#ede8e0] h-11 text-sm placeholder:text-[#c4b9ae]"
            />
            <Input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[#f9f7f5] border-[#ede8e0] h-11 text-sm placeholder:text-[#c4b9ae]"
            />
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading ? 'Please wait…' : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          {mode === 'signin' && (
            <div className="text-center mt-3">
              <a href="/forgot-password" className="text-xs text-[#9a8f84] hover:text-[#2d2d2d] underline underline-offset-2 transition-colors">
                Forgot password?
              </a>
            </div>
          )}
          </>
          )}
        </div>
      </div>

      <div className="py-6 text-center">
        <p className="text-xs text-[#c4b9ae]">Vehicle Vault · Your documents, always ready</p>
      </div>
    </main>
  )
}
