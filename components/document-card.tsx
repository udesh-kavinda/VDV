import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'
import { StatusPill } from './status-pill'
import { Button } from '@/components/ui/button'
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
  const label = document.label ?? document.type.replace('_', ' ')

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">
            {ICONS[document.type] ?? '📌'} {label.charAt(0).toUpperCase() + label.slice(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Expires {new Date(document.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
          </p>
          {document.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{document.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill expiresAt={document.expires_at} />
          <Link href={`/documents/${document.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {links.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
