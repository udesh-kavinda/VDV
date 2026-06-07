'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DocumentType } from '@/lib/documents'

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'insurance',  label: 'Insurance',   icon: '🛡' },
  { value: 'licence',    label: 'Licence',      icon: '📄' },
  { value: 'emission',   label: 'Emission',     icon: '💨' },
  { value: 'fuel_pass',  label: 'Fuel Pass',    icon: '⛽' },
  { value: 'roadworthy', label: 'Roadworthy',   icon: '🔧' },
  { value: 'custom',     label: 'Custom',       icon: '📌' },
]

export function DocumentForm({
  initial,
  onSubmit,
}: {
  initial?: { type: DocumentType; label?: string; expires_at: string; notes?: string }
  onSubmit: (data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) => Promise<void>
}) {
  const [type, setType] = useState<DocumentType>(initial?.type ?? 'insurance')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ type, label: label || undefined, expires_at: expiresAt, notes: notes || undefined })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {DOC_TYPES.map(t => (
            <button
              key={t.value} type="button" onClick={() => setType(t.value)}
              className={`rounded-xl p-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                type === t.value ? 'bg-foreground text-background' : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {type === 'custom' && (
        <div className="space-y-1">
          <Label htmlFor="label">Custom Name</Label>
          <Input id="label" required={type === 'custom'} placeholder="e.g. Road Tax" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="expires">Expiry Date</Label>
        <Input id="expires" type="date" required value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea id="notes" rows={3} placeholder="Policy number, provider, etc." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Save Document'}
      </Button>
    </form>
  )
}
