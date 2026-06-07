import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getExpiryStatus, daysUntil } from '@/lib/expiry'

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06'))
  })

  it('returns positive days for future date', () => {
    expect(daysUntil('2026-07-06')).toBe(30)
  })

  it('returns 0 for today', () => {
    expect(daysUntil('2026-06-06')).toBe(0)
  })

  it('returns negative for past date', () => {
    expect(daysUntil('2026-06-01')).toBe(-5)
  })
})

describe('getExpiryStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06'))
  })

  it('returns expired for past date', () => {
    expect(getExpiryStatus('2026-06-05')).toBe('expired')
  })

  it('returns danger for ≤7 days', () => {
    expect(getExpiryStatus('2026-06-13')).toBe('danger')
  })

  it('returns warn for 8–30 days', () => {
    expect(getExpiryStatus('2026-06-20')).toBe('warn')
  })

  it('returns ok for >30 days', () => {
    expect(getExpiryStatus('2026-07-10')).toBe('ok')
  })
})
