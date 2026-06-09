'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, ExternalLink, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusPill } from '@/components/status-pill'

const ICONS: Record<string, string> = {
  insurance: '🛡', licence: '📄', emission: '💨',
  fuel_pass: '⛽', roadworthy: '🔧', custom: '📌',
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [doc, setDoc]       = useState<any>(null)
  const [links, setLinks]   = useState<any[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [pdfs, setPdfs]     = useState<string[]>([])

  useEffect(() => {
    supabase.from('documents').select('*').eq('id', id).single()
      .then(({ data }) => { if (!data) router.replace('/dashboard'); else setDoc(data) })
    supabase.from('document_links').select('*').eq('document_id', id)
      .order('is_preset', { ascending: false })
      .then(({ data }) => setLinks(data ?? []))
    supabase.from('document_images').select('id, storage_path').eq('document_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data?.length) return
        const imgs: string[] = [], docs: string[] = []
        data.forEach(img => {
          const { data: pub } = supabase.storage.from('document-images').getPublicUrl(img.storage_path)
          img.storage_path.toLowerCase().endsWith('.pdf')
            ? docs.push(pub.publicUrl)
            : imgs.push(pub.publicUrl)
        })
        setPhotos(imgs)
        setPdfs(docs)
      })
  }, [id])

  if (!doc) return null

  const label = doc.label ?? doc.type.replaceAll('_', ' ')
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1)
  const backHref = doc.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'

  return (
    <div className="pb-16">

      {/* Full-screen image — takes entire viewport height */}
      {photos.length > 0 && (
        <div className="relative w-full" style={{ height: '100svh' }}>
          <div className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-none">
            {photos.map((url, i) => (
              <div key={i} className="flex-shrink-0 w-full h-full snap-center">
                <img src={url} alt="" className="w-full h-full object-contain bg-black" />
              </div>
            ))}
          </div>

          {/* Back + edit floating over image */}
          <div className="absolute top-4 inset-x-0 flex items-center justify-between px-4">
            <Link href={backHref}>
              <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            </Link>
            <Link href={`/documents/${id}/edit`}>
              <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </button>
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
            {photos.length > 1 && (
              <div className="flex gap-1.5 mb-2">
                {photos.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />)}
              </div>
            )}
            <p className="text-white/60 text-xs">Scroll down for details</p>
            <div className="w-px h-6 bg-white/30" />
          </div>
        </div>
      )}

      {/* Header when no photo */}
      {photos.length === 0 && (
        <div className="flex items-center justify-between px-4 pt-4 mb-4">
          <div className="flex items-center gap-3">
            <Link href={backHref}>
              <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <h1 className="text-xl font-bold">{ICONS[doc.type] ?? '📌'} {displayLabel}</h1>
          </div>
          <Link href={`/documents/${id}/edit`}>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}

      {/* Details */}
      <div className="px-4 pt-6">
        {photos.length > 0 && (
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {ICONS[doc.type] ?? '📌'} {displayLabel}
          </h1>
        )}

        <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden mt-3">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
            <StatusPill expiresAt={doc.expires_at} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Expiry</p>
            <p className="text-sm font-semibold">
              {new Date(doc.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {doc.notes && (
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Notes</p>
              <p className="text-sm">{doc.notes}</p>
            </div>
          )}
        </div>

        {pdfs.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Attachments</p>
            <div className="space-y-2">
              {pdfs.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3 active:bg-secondary transition-colors">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Document {i + 1}.pdf</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Renewal Links</p>
            <div className="space-y-2">
              {links.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3 active:bg-secondary transition-colors">
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium flex-1">{link.label}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {(() => { try { return new URL(link.url).hostname } catch { return '' } })()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
