'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    // Always show success — don't leak whether email exists
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f5f0eb] flex flex-col items-center justify-center px-6">
      <div className="mb-6">
        <Logo size={64} />
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#ede8e0] p-6 shadow-sm">
        <Link href="/login" className="flex items-center gap-1.5 text-xs text-[#9a8f84] mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-semibold text-[#1a1a1a] mb-1">Check your inbox</p>
            <p className="text-sm text-[#9a8f84]">
              If <span className="font-medium text-[#2d2d2d]">{email}</span> has an account, we've sent a reset link.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-5 w-full">Back to sign in</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-[#1a1a1a] mb-1">Reset your password</h1>
            <p className="text-sm text-[#9a8f84] mb-5">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-[#f9f7f5] border-[#ede8e0] h-11 text-sm placeholder:text-[#c4b9ae]"
              />
              <Button type="submit" size="lg" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
