import { describe, expect, it } from 'vitest'
import { consentCookieString, parseConsent, serializeConsent } from '@/features/tracking/consent'

describe('consent', () => {
  it('round-trips a consent value', () => {
    const c = { v: 1 as const, marketing: true, ts: 1_700_000_000_000 }
    expect(parseConsent(serializeConsent({ ...c, ts: Date.now() }))).toEqual({ ...c, ts: expect.any(Number) })
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
  it('builds a 6-month, lax, path=/ cookie', () => {
    const s = consentCookieString({ v: 1, marketing: false, ts: Date.now() })
    expect(s).toMatch(/^cp_consent=/)
    expect(s).toContain('Max-Age=15552000')
    expect(s).toContain('Path=/')
    expect(s).toContain('SameSite=Lax')
  })
})
