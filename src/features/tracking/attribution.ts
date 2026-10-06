export const ATTR_COOKIE = 'cp_attr'
const MAX_AGE_S = 60 * 60 * 24 * 30
const MAX_VALUE_LENGTH = 150

export type Attribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbclid?: string
  fbclidTs?: number
}

const STRING_KEYS = ['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm', 'fbclid'] as const

const map: [string, (typeof STRING_KEYS)[number]][] = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_content', 'utmContent'],
  ['utm_term', 'utmTerm'],
  ['fbclid', 'fbclid'],
]

export function extractAttribution(search: URLSearchParams, now: number): Attribution | null {
  const out: Attribution = {}
  for (const [param, key] of map) {
    const v = search.get(param)?.trim()
    if (v) out[key] = v.slice(0, MAX_VALUE_LENGTH)
  }
  if (out.fbclid) out.fbclidTs = now
  return Object.keys(out).length ? out : null
}

export function mergeAttribution(prev: Attribution | null, next: Attribution | null): Attribution | null {
  if (!prev) return next
  if (!next) return prev
  return { ...prev, ...next }
}

export function attributionCookieString(a: Attribution): string {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  return `${ATTR_COOKIE}=${encodeURIComponent(JSON.stringify(a))}; Max-Age=${MAX_AGE_S}; Path=/; SameSite=Lax${secure}`
}

export function expireAttributionCookieString(): string {
  return `${ATTR_COOKIE}=; Max-Age=0; Path=/`
}

// The cookie is client-writable, so only known keys with the expected types survive; the value may
// arrive URL-encoded (document.cookie) or already decoded (server cookie jar).
export function parseAttributionCookie(raw: string | undefined): Attribution | null {
  if (!raw) return null
  try {
    const v: unknown = JSON.parse(raw.startsWith('{') ? raw : decodeURIComponent(raw))
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null
    const src = v as Record<string, unknown>
    const out: Attribution = {}
    for (const key of STRING_KEYS) {
      const value = src[key]
      if (typeof value === 'string' && value !== '') out[key] = value.slice(0, MAX_VALUE_LENGTH)
    }
    if (typeof src.fbclidTs === 'number' && Number.isFinite(src.fbclidTs)) out.fbclidTs = src.fbclidTs
    return Object.keys(out).length ? out : null
  } catch {
    return null
  }
}
