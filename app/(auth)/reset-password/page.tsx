'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0eb] flex flex-col items-center justify-center px-6">
      <div className="mb-6">
        <Logo size={64} />
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#ede8e0] p-6 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f5f0eb] mx-auto mb-4">
          <KeyRound className="w-5 h-5 text-[#2d2d2d]" />
        </div>
        <h1 className="text-lg font-bold text-[#1a1a1a] text-center mb-1">Set new password</h1>
        <p className="text-sm text-[#9a8f84] text-center mb-5">Must be at least 6 characters.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              required
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[#f9f7f5] border-[#ede8e0] h-11 text-sm pr-10 placeholder:text-[#c4b9ae]"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8f84]">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            type={showPw ? 'text' : 'password'}
            required
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="bg-[#f9f7f5] border-[#ede8e0] h-11 text-sm placeholder:text-[#c4b9ae]"
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <Button type="submit" size="lg" className="w-full h-11 rounded-xl" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </main>
  )
}
