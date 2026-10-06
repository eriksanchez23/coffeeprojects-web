import { buildCsp } from './csp'

type Header = { key: string; value: string }
type Rule = { source: string; headers: Header[] }

const NOINDEX: Header = { key: 'X-Robots-Tag', value: 'noindex, nofollow' }

export function responseHeaders(siteEnv: 'development' | 'staging' | 'production'): Rule[] {
  const security: Header[] = [
    { key: 'Content-Security-Policy', value: buildCsp({ dev: process.env.NODE_ENV === 'development' }) },
    // No 'preload': submitting to the HSTS preload list is hard to undo and needs a team decision before go-live (R25).
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
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

// Old-site URLs, permanently redirected. Lives here (not inline in next.config.ts) so it is unit-testable
// without loading the Payload/SWC-bound config.
export const legacyRedirects = [
  { source: '/legal', destination: '/aviso-legal', statusCode: 301 as const },
  { source: '/en/legal', destination: '/en/legal-notice', statusCode: 301 as const },
]
