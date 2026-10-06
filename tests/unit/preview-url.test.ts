import { afterEach, describe, expect, it, vi } from 'vitest'
import { previewUrl } from '@/lib/cms/preview-url'

describe('previewUrl', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('builds the preview link with an encoded path and secret', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    vi.stubEnv('PREVIEW_SECRET', 's e&c')
    expect(previewUrl('/en/services/x')).toBe(
      'http://localhost:3000/next/preview?path=%2Fen%2Fservices%2Fx&secret=s%20e%26c',
    )
  })
  it('returns null when the site URL is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('PREVIEW_SECRET', 's')
    expect(previewUrl('/x')).toBeNull()
  })
  it('returns null when the secret is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    vi.stubEnv('PREVIEW_SECRET', '')
    expect(previewUrl('/x')).toBeNull()
  })
})
