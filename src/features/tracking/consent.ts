export type Consent = { v: 1; marketing: boolean; ts: number }

export const CONSENT_COOKIE = 'cp_consent'
const MAX_AGE_S = 60 * 60 * 24 * 180
const MAX_FUTURE_SKEW_MS = 1000 * 60 * 60 * 24

export function serializeConsent(c: Consent): string {
  return encodeURIComponent(JSON.stringify(c))
}

export function parseConsent(raw: string | undefined): Consent | null {
  if (!raw) return null
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>
    if (c.v !== 1 || typeof c.marketing !== 'boolean' || typeof c.ts !== 'number') return null
    if (Date.now() - c.ts > MAX_AGE_S * 1000) return null
    if (c.ts - Date.now() > MAX_FUTURE_SKEW_MS) return null
    return { v: 1, marketing: c.marketing, ts: c.ts }
  } catch {
    return null
  }
}

export function consentCookieString(c: Consent): string {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  return `${CONSENT_COOKIE}=${serializeConsent(c)}; Max-Age=${MAX_AGE_S}; Path=/; SameSite=Lax${secure}`
}

export function readConsentFromDocument(): Consent | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((p) => p.startsWith(`${CONSENT_COOKIE}=`))
  return parseConsent(match?.slice(CONSENT_COOKIE.length + 1))
}
