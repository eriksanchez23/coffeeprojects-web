import { describe, expect, it } from 'vitest'
import { toLocaleSlugs, toSlugEntries } from '@/lib/cms/slugs'

describe('toLocaleSlugs', () => {
  it('returns each locale slug', () => {
    expect(toLocaleSlugs({ es: 'a', en: 'b', fr: 'c' })).toEqual({ es: 'a', en: 'b', fr: 'c' })
  })
  it('falls back to the ES slug when a translation is missing', () => {
    expect(toLocaleSlugs({ es: 'tiendas-online', en: '', fr: null })).toEqual({
      es: 'tiendas-online',
      en: 'tiendas-online',
      fr: 'tiendas-online',
    })
  })
  it('accepts a plain string (non-localized response)', () => {
    expect(toLocaleSlugs('x')).toEqual({ es: 'x', en: 'x', fr: 'x' })
  })
  it('throws when there is no ES slug at all', () => {
    expect(() => toLocaleSlugs({ en: 'b' })).toThrow('missing es slug')
  })
})

describe('toSlugEntries', () => {
  it('returns slugs with updatedAt and skips docs without an ES slug instead of throwing', () => {
    const { entries, skippedIds } = toSlugEntries([
      { id: 1, slug: { es: 'a', en: 'b' }, updatedAt: '2026-10-01T10:00:00.000Z' },
      { id: 2, slug: { en: 'orphan' }, updatedAt: '2026-10-02T10:00:00.000Z' },
      { id: 3, slug: null },
    ])
    expect(entries).toEqual([{ slugs: { es: 'a', en: 'b', fr: 'a' }, updatedAt: '2026-10-01T10:00:00.000Z' }])
    expect(skippedIds).toEqual([2, 3])
  })
})
