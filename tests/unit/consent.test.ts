import { describe, expect, it } from 'vitest'
import { consentCookieString, parseConsent, serializeConsent } from '@/features/tracking/consent'

describe('consent', () => {
  it('round-trips a consent value', () => {
    const now = Date.now()
    const c = { v: 1 as const, marketing: true, ts: now }
    expect(parseConsent(serializeConsent(c))).toEqual({ v: 1, marketing: true, ts: now })
  })
  it('returns null for missing or malformed cookies', () => {
    expect(parseConsent(undefined)).toBeNull()
    expect(parseConsent('not-json')).toBeNull()
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: 2, marketing: true, ts: 1 })))).toBeNull()
  })
  it('expires after 6 months', () => {
    const old = { v: 1 as const, marketing: true, ts: Date.now() - 1000 * 60 * 60 * 24 * 190 }
    expect(parseConsent(serializeConsent(old))).toBeNull()
  })
  it('rejects timestamps in the future beyond a one-day skew', () => {
    const far = { v: 1 as const, marketing: true, ts: Date.now() + 1000 * 60 * 60 * 24 * 3 }
    const near = { v: 1 as const, marketing: true, ts: Date.now() + 1000 * 60 * 60 }
    expect(parseConsent(serializeConsent(far))).toBeNull()
    expect(parseConsent(serializeConsent(near))).not.toBeNull()
  })
  it('builds a 6-month, lax, path=/ cookie', () => {
    const s = consentCookieString({ v: 1, marketing: false, ts: Date.now() })
    expect(s).toMatch(/^cp_consent=/)
    expect(s).toContain('Max-Age=15552000')
    expect(s).toContain('Path=/')
    expect(s).toContain('SameSite=Lax')
  })
})
