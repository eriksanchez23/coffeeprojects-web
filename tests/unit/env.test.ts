import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/lib/env'

const base = {
  NEXT_PUBLIC_SITE_URL: 'https://coffeeprojects.es',
  NEXT_PUBLIC_SITE_ENV: 'production',
}

describe('parseEnv', () => {
  it('derives flags from SITE_ENV', () => {
    const env = parseEnv(base)
    expect(env.isProduction).toBe(true)
    expect(env.isStaging).toBe(false)
    expect(env.SITE_URL).toBe('https://coffeeprojects.es')
  })

  it('strips a trailing slash from SITE_URL', () => {
    expect(parseEnv({ ...base, NEXT_PUBLIC_SITE_URL: 'https://x.dev/' }).SITE_URL).toBe('https://x.dev')
  })

  it('defaults SITE_ENV to development', () => {
    const env = parseEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })
    expect(env.SITE_ENV).toBe('development')
  })

  it('rejects an invalid SITE_ENV', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SITE_ENV: 'prod' })).toThrow()
  })
})
