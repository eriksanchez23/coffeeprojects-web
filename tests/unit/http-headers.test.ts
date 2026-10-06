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
