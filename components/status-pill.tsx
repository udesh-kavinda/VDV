import { cn } from '@/lib/utils'
import { getExpiryStatus, daysUntil } from '@/lib/expiry'

const styles = {
  ok:      'bg-green-50 text-green-800 border border-green-200',
  warn:    'bg-amber-50 text-amber-800 border border-amber-200',
  danger:  'bg-red-50 text-red-800 border border-red-200',
  expired: 'bg-red-100 text-red-900 border border-red-300',
}

const labels: Record<string, (days: number) => string> = {
  ok:      (days: number) => `${days}d`,
  warn:    (days: number) => `${days}d`,
  danger:  (days: number) => days <= 0 ? 'Today' : `${days}d`,
  expired: () => 'Expired',
}

export function StatusPill({ expiresAt }: { expiresAt: string }) {
  const status = getExpiryStatus(expiresAt)
  const days = daysUntil(expiresAt)
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', styles[status])}>
      {labels[status](days)}
    </span>
  )
}
