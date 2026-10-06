import { describe, expect, it } from 'vitest'
import { responseHeaders } from '@/lib/http-headers'

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
  it('sends security headers on public routes but not on the admin', () => {
    const rules = responseHeaders('production')
    const site = rules.find((r) => r.source === '/((?!admin).*)')
    const keys = site?.headers.map((h) => h.key)
    expect(keys).toEqual(expect.arrayContaining(['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']))
    const admin = rules.find((r) => r.source === '/admin/:path*')
    expect(admin?.headers.map((h) => h.key)).not.toContain('Content-Security-Policy')
  })
  it('only allows eval in the development CSP', () => {
    const csp = (env: 'development' | 'staging' | 'production') =>
      responseHeaders(env).find((r) => r.source === '/((?!admin).*)')?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
    expect(csp('development')).toContain("'unsafe-eval'")
    expect(csp('staging')).not.toContain("'unsafe-eval'")
    expect(csp('production')).not.toContain("'unsafe-eval'")
  })
})
