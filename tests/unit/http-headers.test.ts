import { describe, expect, it, vi } from 'vitest'
import { nextSecurityConfig, responseHeaders, scopeClientHintsToAdmin } from '@/lib/http-headers'

const all = (env: 'staging' | 'production') => responseHeaders(env).flatMap((r) => r.headers)

describe('responseHeaders', () => {
  it('adds noindex on staging', () => {
    expect(all('staging')).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
  })
  it('does not noindex public pages in production', () => {
    expect(responseHeaders('production').find((r) => r.source === '/:path*')).toBeUndefined()
  })
  it('always noindexes the admin', () => {
    const admin = responseHeaders('production').find((r) => r.source === '/admin/:path*')
    expect(admin?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
  })
})

describe('security headers', () => {
  it('sends the full security headers on public routes and only a minimal CSP on the admin', () => {
    const rules = responseHeaders('production')
    const site = rules.find((r) => r.source === '/((?!admin).*)')
    const keys = site?.headers.map((h) => h.key)
    expect(keys).toEqual(expect.arrayContaining(['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']))
    expect(keys).toContain('Cross-Origin-Opener-Policy')
    const admin = rules.find((r) => r.source === '/admin/:path*')
    // Payload needs eval and inline styles: the admin CSP never restricts scripts or styles.
    const adminCsp = admin?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
    expect(adminCsp).toBe("frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'")
  })
  it('only allows eval when running the dev server, so staging and production share the strict CSP', () => {
    const csp = (nodeEnv: string, env: 'development' | 'staging' | 'production') => {
      vi.stubEnv('NODE_ENV', nodeEnv)
      return responseHeaders(env).find((r) => r.source === '/((?!admin).*)')?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
    }
    expect(csp('development', 'development')).toContain("'unsafe-eval'")
    const prod = csp('production', 'production')
    expect(csp('production', 'staging')).toBe(prod)
    expect(csp('production', 'development')).toBe(prod)
    expect(prod).not.toContain("'unsafe-eval'")
    vi.unstubAllEnvs()
  })
  it('hardens the admin too, keeping its noindex and SAMEORIGIN framing', () => {
    const admin = responseHeaders('production').find((r) => r.source === '/admin/:path*')
    expect(admin?.headers).toEqual(
      expect.arrayContaining([
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
      ]),
    )
    expect(admin?.headers.filter((h) => h.key === 'X-Frame-Options')).toHaveLength(1)
    expect(admin?.headers.filter((h) => h.key === 'Content-Security-Policy')).toHaveLength(1)
  })
  it('disables the X-Powered-By header (Next.js and Payload honour poweredByHeader: false)', () => {
    expect(nextSecurityConfig.poweredByHeader).toBe(false)
  })
  it('sends HSTS without preload', () => {
    const hsts = responseHeaders('production').flatMap((r) => r.headers).find((h) => h.key === 'Strict-Transport-Security')
    expect(hsts?.value).toBe('max-age=63072000; includeSubDomains')
  })
})

describe('scopeClientHintsToAdmin', () => {
  const payloadRule = {
    source: '/:path*',
    headers: [
      { key: 'Accept-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
      { key: 'Vary', value: 'Sec-CH-Prefers-Color-Scheme' },
      { key: 'Critical-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
      { key: 'X-Powered-By', value: 'Next.js, Payload' },
    ],
  }
  it('moves the Payload client hints to the admin and leaves the other headers on every path', () => {
    const site = { source: '/((?!admin).*)', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }
    expect(scopeClientHintsToAdmin([site, payloadRule])).toEqual([
      site,
      { source: '/:path*', headers: [{ key: 'X-Powered-By', value: 'Next.js, Payload' }] },
      { source: '/admin/:path*', headers: payloadRule.headers.slice(0, 3) },
    ])
  })
  it('never sends Critical-CH outside the admin', () => {
    const scoped = scopeClientHintsToAdmin([payloadRule])
    const critical = scoped.filter((r) => r.headers.some((h) => h.key === 'Critical-CH')).map((r) => r.source)
    expect(critical).toEqual(['/admin/:path*'])
  })
})
