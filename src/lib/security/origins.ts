// Pure helpers for Payload's serverURL / CSRF / CORS and auth-cookie settings.
// Deliberately does not import `@/lib/env`: that module parses env at import time and would make the
// payload CLI (migrate, generate:types) crash when NEXT_PUBLIC_SITE_URL is not set.

const DEV_ORIGIN = 'http://localhost:3000'

type Source = Record<string, string | undefined>

export type SiteOrigins = {
  /** Public origin of the site (no trailing slash), or undefined when NEXT_PUBLIC_SITE_URL is unset (non-production only: production throws). */
  serverURL: string | undefined
  /** Origins allowed to send the Payload auth cookie (csrf) and to call the API cross-origin (cors). */
  origins: string[]
}

const isIpHost = (hostname: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')

/** True for a registrable apex such as `coffeeprojects.es` (two labels, not an IP, not localhost). */
const isApexHost = (hostname: string) =>
  !isIpHost(hostname) && hostname !== 'localhost' && hostname.split('.').length === 2

export function siteOrigins(source: Source): SiteOrigins {
  const raw = source.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) {
    // Payload treats an empty `csrf` list as "no allow-list" (any Origin is accepted), so a production boot
    // without the site URL would silently fail open. The deploy env always sets it, CLI included.
    if (source.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SITE_URL is required in production (CSRF/CORS allow-list and absolute URLs)')
    }
    return { serverURL: undefined, origins: [] }
  }

  const url = new URL(raw) // throws on an invalid URL: a misconfigured origin must not boot silently
  const origins = [url.origin]
  if (isApexHost(url.hostname)) origins.push(`${url.protocol}//www.${url.host}`)

  const siteEnv = source.NEXT_PUBLIC_SITE_ENV?.trim() || 'development'
  if (siteEnv === 'development' && !origins.includes(DEV_ORIGIN)) origins.push(DEV_ORIGIN)

  return { serverURL: url.origin, origins }
}

export type AuthCookies = { secure: boolean; sameSite: 'Lax' }

/**
 * Payload auth cookie flags. `Lax` (not `Strict`) so links to /admin from notification emails keep the
 * session; `Secure` whenever the app runs as a production build (HTTPS via Cloudflare + NPM).
 */
export function authCookies(nodeEnv: string | undefined = process.env.NODE_ENV): AuthCookies {
  return { secure: nodeEnv === 'production', sameSite: 'Lax' }
}
