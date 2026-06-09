'use client'
import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ExternalLink, Paperclip, X, FileText, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { DocumentType } from '@/lib/documents'

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'insurance',  label: 'Insurance',  icon: '🛡' },
  { value: 'licence',    label: 'Licence',    icon: '📄' },
  { value: 'emission',   label: 'Emission',   icon: '💨' },
  { value: 'fuel_pass',  label: 'Fuel Pass',  icon: '⛽' },
  { value: 'roadworthy', label: 'Roadworthy', icon: '🔧' },
  { value: 'custom',     label: 'Custom',     icon: '📌' },
]

type PendingLink = { label: string; url: string }
type AttachedFile = { file: File; preview: string | null }

function NewDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicleId')
  const supabase = createClient()

  // Document fields
  const [type, setType] = useState<DocumentType>('insurance')
  const [label, setLabel] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  // Links
  const [links, setLinks] = useState<PendingLink[]>([])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl]   = useState('')

  // Files
  const [files, setFiles] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const backHref = vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'

  function addLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return
    setLinks(prev => [...prev, { label: linkLabel.trim(), url: linkUrl.trim() }])
    setLinkLabel('')
    setLinkUrl('')
  }

  function removeLink(i: number) {
    setLinks(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    const newFiles: AttachedFile[] = picked.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  function removeFile(i: number) {
    setFiles(prev => {
      if (prev[i].preview) URL.revokeObjectURL(prev[i].preview!)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Create document
    const { data: doc } = await supabase
      .from('documents')
      .insert({ type, label: label || undefined, expires_at: type === 'fuel_pass' ? null : expiresAt, notes: notes || undefined, vehicle_id: vehicleId ?? null, user_id: user!.id })
      .select('id').single()

    if (!doc) { setLoading(false); return }

    // 2. Insert preset links for doc type
    await supabase.rpc('insert_preset_links', { doc_id: doc.id, doc_type: type })

    // 3. Save custom links
    if (links.length > 0) {
      await supabase.from('document_links').insert(
        links.map(l => ({ document_id: doc.id, label: l.label, url: l.url, is_preset: false }))
      )
    }

    // 4. Upload files to Supabase Storage
    if (files.length > 0) {
      await Promise.all(files.map(async ({ file }) => {
        const ext = file.name.split('.').pop() ?? 'bin'
        const path = `${user!.id}/${doc.id}/${crypto.randomUUID()}.${ext}`
        const { data: upload } = await supabase.storage
          .from('document-images')
          .upload(path, file, { upsert: false })
        if (upload) {
          await supabase.from('document_images').insert({
            document_id: doc.id,
            user_id: user!.id,
            storage_path: upload.path,
          })
        }
      }))
    }

    router.push(backHref)
    router.refresh()
  }

  return (
    <div className="px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref}>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <h1 className="text-xl font-bold">Add Document</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* ── Type ── */}
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className={`relative rounded-xl p-3 flex flex-col items-center gap-1 text-xs font-medium transition-all duration-150 active:scale-90 ${
                  type === t.value
                    ? 'bg-[#2d2d2d] text-white ring-2 ring-[#2d2d2d] ring-offset-2 scale-105 shadow-md'
                    : 'bg-secondary hover:bg-secondary/70'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                {t.label}
                {type === t.value && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Custom label ── */}
        {type === 'custom' && (
          <div className="space-y-1">
            <Label htmlFor="label">Custom Name</Label>
            <Input id="label" required placeholder="e.g. Road Tax" value={label} onChange={e => setLabel(e.target.value)} />
          </div>
        )}

        {/* ── Expiry date ── */}
        {type !== 'fuel_pass' && (
          <div className="space-y-1">
            <Label htmlFor="expires">Expiry Date</Label>
            <Input id="expires" type="date" required value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        )}

        {/* ── Notes ── */}
        <div className="space-y-1">
          <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Textarea id="notes" rows={3} placeholder="Policy number, provider, etc." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* ── Renewal Links ── */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Renewal Links</Label>
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{l.label}</p>
                <p className="text-xs text-muted-foreground truncate">{l.url}</p>
              </div>
              <button type="button" onClick={() => removeLink(i)} className="p-1 text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="space-y-2">
            <Input placeholder="Label (e.g. AIA Portal)" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} />
            <Input placeholder="https://" type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
            <Button type="button" variant="outline" className="w-full" onClick={addLink}>
              <Plus className="w-4 h-4 mr-1" /> Add Link
            </Button>
          </div>
        </div>

        {/* ── Attachments ── */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Attachments</Label>
          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {files.map((f, i) => (
                <div key={i} className="relative group">
                  {f.preview ? (
                    <img src={f.preview} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-secondary border border-border flex flex-col items-center justify-center gap-1">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground truncate w-16 text-center px-1">{f.file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2d2d2d] rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-4 h-4 mr-1" /> Attach Photo or PDF
          </Button>
          <p className="text-xs text-muted-foreground">Photos of the physical document, PDF copies, etc.</p>
        </div>

        {/* ── Submit ── */}
        <Button type="submit" size="lg" className="w-full h-12 text-base rounded-xl" disabled={loading}>
          {loading ? 'Saving…' : 'Save Document'}
        </Button>

      </form>
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense>
      <NewDocumentContent />
    </Suspense>
  )
}
