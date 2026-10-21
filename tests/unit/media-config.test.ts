import { describe, expect, it } from 'vitest'
import { Media, mediaStaticDir } from '@/collections/Media'

const mimeTypes = () => (typeof Media.upload === 'object' ? Media.upload.mimeTypes : undefined) ?? []

describe('Media uploads', () => {
  it('accept only raster images', () => {
    expect([...mimeTypes()].sort()).toEqual(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'])
  })
  it('never accept SVG (scriptable) or a wildcard that would include it', () => {
    expect(mimeTypes()).not.toContain('image/svg+xml')
    expect(mimeTypes().some((m) => m.includes('*'))).toBe(false)
  })
})

describe('Media storage directory', () => {
  it('uses MEDIA_DIR when set (absolute path outside the checkout)', () => {
    expect(mediaStaticDir({ MEDIA_DIR: '/var/lib/coffeeprojects/media' })).toBe('/var/lib/coffeeprojects/media')
  })
  it("falls back to Payload's default (slug-relative ./media) when MEDIA_DIR is unset or blank", () => {
    expect(mediaStaticDir({})).toBeUndefined()
    expect(mediaStaticDir({ MEDIA_DIR: '   ' })).toBeUndefined()
  })
})
