import { describe, expect, it } from 'vitest'
import { Media } from '@/collections/Media'

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
