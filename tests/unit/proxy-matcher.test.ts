import { describe, expect, it } from 'vitest'
import { config } from '@/proxy'

// Next compiles a simple matcher entry like '/((?!a|b).*)' into an anchored RegExp (path-to-regexp),
// so a negative-lookahead entry is equivalent to ^/((?!a|b).*)$ over the pathname.
const [i18nEntry, apiEntry] = config.matcher
const i18n = new RegExp(`^${i18nEntry}$`)
const api = /^\/api(?:\/(.*))?$/ // '/api/:path*'

describe('proxy matcher', () => {
  it('keeps the expected entries', () => {
    expect(apiEntry).toBe('/api/:path*')
  })

  it.each(['/', '/es', '/en/pricing', '/fr/projects/foo', '/contact'])('runs next-intl on %s', (path) => {
    expect(i18n.test(path)).toBe(true)
  })

  it.each([
    '/api/x',
    '/admin',
    '/next/preview',
    '/_next/static/a.js',
    '/favicon.ico',
    '/robots.txt',
    '/es/opengraph-image',
  ])('does not run the i18n entry on %s', (path) => {
    expect(i18n.test(path)).toBe(false)
  })

  it('matches the locked-documents API through the /api entry', () => {
    expect(api.test('/api/payload-locked-documents')).toBe(true)
  })
})
