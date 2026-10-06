import { describe, expect, it } from 'vitest'
import { toLocaleSlugs } from '@/lib/cms/slugs'

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
