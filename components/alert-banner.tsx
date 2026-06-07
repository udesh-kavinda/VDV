import { getExpiryStatus, daysUntil } from '@/lib/expiry'
import type { VehicleDocument } from '@/lib/documents'

export function AlertBanner({ documents }: { documents: VehicleDocument[] }) {
  const urgent = documents.filter(d => {
    const s = getExpiryStatus(d.expires_at)
    return s === 'danger' || s === 'expired' || s === 'warn'
  }).sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())

  if (urgent.length === 0) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-700 mb-1.5">
        ⚠ {urgent.length} item{urgent.length > 1 ? 's' : ''} need attention
      </p>
      <ul className="space-y-0.5">
        {urgent.slice(0, 3).map(d => {
          const days = daysUntil(d.expires_at)
          return (
            <li key={d.id} className="text-xs text-amber-600">
              · {d.label ?? d.type} — {days <= 0 ? 'expired' : `${days} days`}
            </li>
          )
        })}
        {urgent.length > 3 && (
          <li className="text-xs text-amber-500">+ {urgent.length - 3} more</li>
        )}
      </ul>
    </div>
  )
}
