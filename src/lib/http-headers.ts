import { buildCsp } from './csp'

type Header = { key: string; value: string }
type Rule = { source: string; headers: Header[] }

const NOINDEX: Header = { key: 'X-Robots-Tag', value: 'noindex, nofollow' }

export function responseHeaders(siteEnv: 'development' | 'staging' | 'production'): Rule[] {
  const security: Header[] = [
    { key: 'Content-Security-Policy', value: buildCsp({ dev: siteEnv === 'development' }) },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ]
  // The admin keeps Payload's own needs (eval/inline styles), so no CSP there; it is auth-protected and noindex.
  const rules: Rule[] = [
    { source: '/((?!admin).*)', headers: security },
    { source: '/admin/:path*', headers: [NOINDEX, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
  ]
  if (siteEnv !== 'production') rules.push({ source: '/:path*', headers: [NOINDEX] })
  return rules
}
