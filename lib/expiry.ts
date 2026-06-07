export type ExpiryStatus = 'ok' | 'warn' | 'danger' | 'expired'

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(dateStr: string): ExpiryStatus {
  const days = daysUntil(dateStr)
  if (days < 0) return 'expired'
  if (days <= 7) return 'danger'
  if (days <= 30) return 'warn'
  return 'ok'
}
