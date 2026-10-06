import { describe, expect, it } from 'vitest'
import { slugify } from '@/fields/slug'

describe('slugify', () => {
  it('removes accents and symbols', () => {
    expect(slugify('Tiendas Online & Más')).toBe('tiendas-online-mas')
  })
  it('handles French characters', () => {
    expect(slugify('Boutiques en ligne — Équipe')).toBe('boutiques-en-ligne-equipe')
  })
  it('collapses dashes and trims', () => {
    expect(slugify('  --Hola   mundo--  ')).toBe('hola-mundo')
  })
})
