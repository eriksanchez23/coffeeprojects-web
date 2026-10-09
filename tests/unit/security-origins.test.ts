import { describe, expect, it } from 'vitest'
import { authCookies, siteOrigins } from '@/lib/security/origins'

describe('siteOrigins', () => {
  it('trusts the apex origin and its www variant in production', () => {
    expect(
      siteOrigins({ NEXT_PUBLIC_SITE_URL: 'https://coffeeprojects.es/', NEXT_PUBLIC_SITE_ENV: 'production' }),
    ).toEqual({
      serverURL: 'https://coffeeprojects.es',
      origins: ['https://coffeeprojects.es', 'https://www.coffeeprojects.es'],
    })
  })

  it('does not add a www variant for a subdomain host', () => {
    expect(
      siteOrigins({ NEXT_PUBLIC_SITE_URL: 'https://staging.coffeeprojects.es', NEXT_PUBLIC_SITE_ENV: 'staging' }),
    ).toEqual({ serverURL: 'https://staging.coffeeprojects.es', origins: ['https://staging.coffeeprojects.es'] })
  })

  it('keeps localhost:3000 working in development', () => {
    expect(siteOrigins({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).toEqual({
      serverURL: 'http://localhost:3000',
      origins: ['http://localhost:3000'],
    })
    expect(
      siteOrigins({ NEXT_PUBLIC_SITE_URL: 'https://coffeeprojects.es', NEXT_PUBLIC_SITE_ENV: 'development' }).origins,
    ).toContain('http://localhost:3000')
  })

  it('never trusts localhost outside development', () => {
    const { origins } = siteOrigins({
      NEXT_PUBLIC_SITE_URL: 'https://coffeeprojects.es',
      NEXT_PUBLIC_SITE_ENV: 'production',
    })
    expect(origins).not.toContain('http://localhost:3000')
  })

  it('does not add www to an IP address host', () => {
    expect(
      siteOrigins({ NEXT_PUBLIC_SITE_URL: 'http://192.168.1.90:3000', NEXT_PUBLIC_SITE_ENV: 'staging' }).origins,
    ).toEqual(['http://192.168.1.90:3000'])
  })

  it('returns no allow-list when the site URL is unset (payload CLI without env)', () => {
    expect(siteOrigins({})).toEqual({ serverURL: undefined, origins: [] })
  })

  it('rejects an invalid site URL', () => {
    expect(() => siteOrigins({ NEXT_PUBLIC_SITE_URL: 'not a url' })).toThrow()
  })
})

describe('authCookies', () => {
  it('marks the auth cookie Secure in production', () => {
    expect(authCookies('production')).toEqual({ secure: true, sameSite: 'Lax' })
  })

  it('allows plain http outside production (local dev)', () => {
    expect(authCookies('development')).toEqual({ secure: false, sameSite: 'Lax' })
    expect(authCookies(undefined)).toEqual({ secure: false, sameSite: 'Lax' })
  })
})

describe('Users auth cookie wiring', () => {
  it('uses SameSite=Lax (Strict would drop the session on /admin links from emails)', async () => {
    const { Users } = await import('@/collections/Users')
    const auth = Users.auth as { cookies?: { sameSite?: unknown; secure?: unknown } }
    expect(auth.cookies).toEqual({ secure: false, sameSite: 'Lax' }) // NODE_ENV=test
  })
})
