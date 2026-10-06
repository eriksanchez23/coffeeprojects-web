import { describe, expect, it } from 'vitest'
import { buildPath } from '@/i18n/build-path'

describe('buildPath', () => {
  it('builds unprefixed ES paths', () => {
    expect(buildPath('/services/[slug]', 'es', 'tiendas-online')).toBe('/servicios/tiendas-online')
  })
  it('prefixes non-default locales', () => {
    expect(buildPath('/projects', 'fr')).toBe('/fr/projets')
    expect(buildPath('/', 'en')).toBe('/en')
    expect(buildPath('/', 'es')).toBe('/')
  })
  it('throws when a dynamic path has no slug', () => {
    expect(() => buildPath('/team/[slug]', 'es')).toThrow()
  })
})
