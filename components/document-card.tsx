'use client'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pencil } from 'lucide-react'
import { StatusPill } from './status-pill'
import type { VehicleDocument } from '@/lib/documents'
import type { DocumentLink } from '@/lib/links'

const ICONS: Record<string, string> = {
  insurance: '🛡', licence: '📄', emission: '💨',
  fuel_pass: '⛽', roadworthy: '🔧', custom: '📌',
}

export function DocumentCard({
  document,
  links,
}: {
  document: VehicleDocument
  links: DocumentLink[]
}) {
  const router = useRouter()
  const label = document.label ?? document.type.replaceAll('_', ' ')

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/documents/${document.id}`)}
      onKeyDown={e => e.key === 'Enter' && router.push(`/documents/${document.id}`)}
      className="bg-white rounded-xl border border-border p-4 active:bg-secondary/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">
            {ICONS[document.type] ?? '📌'} {label.charAt(0).toUpperCase() + label.slice(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {document.expires_at ? `Expires ${new Date(document.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No expiry date'}
          </p>
          {document.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{document.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill expiresAt={document.expires_at} />
          <button
            onClick={e => { e.stopPropagation(); router.push(`/documents/${document.id}/edit`) }}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {links.map(link => (
            <button
              key={link.id}
              onClick={e => { e.stopPropagation(); window.open(link.url, '_blank', 'noopener,noreferrer') }}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 active:bg-amber-100 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
