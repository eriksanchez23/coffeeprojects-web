import { describe, expect, it } from 'vitest'
import { contactHref, formatEuro, formatPrice, formatPriceParts } from '@/lib/format'

const labels = { from: 'Desde', perMonth: '/mes', custom: 'A medida', seeStore: 'Ver tienda' }
const NBSP = ' '

describe('formatPrice', () => {
  // Always grouped, like the pricing page ("1.000 €"), so prices read the same across the site.
  it('formats one-off prices without decimals per locale, keeping non-breaking spaces', () => {
    expect(formatPrice({ mode: 'one-off', amount: 2500 }, 'es', labels)).toBe(`Desde 2.500${NBSP}€`)
    expect(formatPrice({ mode: 'one-off', amount: 2500 }, 'en', { ...labels, from: 'From' })).toBe('From €2,500')
  })
  it('formats French amounts with a plain NBSP grouping, never a narrow one', () => {
    const out = formatPrice({ mode: 'one-off', amount: 2500 }, 'fr', { ...labels, from: 'À partir de' })
    expect(out).toBe(`À partir de 2${NBSP}500${NBSP}€`)
    expect(out).not.toContain(' ')
  })
  it('formats amounts of 10000 and above', () => {
    expect(formatPrice({ mode: 'one-off', amount: 12500 }, 'es', labels)).toBe(`Desde 12.500${NBSP}€`)
    expect(formatPrice({ mode: 'one-off', amount: 12500 }, 'fr', labels)).toBe(`Desde 12${NBSP}500${NBSP}€`)
    expect(formatPrice({ mode: 'one-off', amount: 12500 }, 'en', { ...labels, from: 'From' })).toBe('From €12,500')
  })
  it('formats monthly prices', () => {
    expect(formatPrice({ mode: 'monthly', amount: 35 }, 'es', labels)).toBe(`Desde 35${NBSP}€/mes`)
  })
  it('falls back to the custom label', () => {
    expect(formatPrice({ mode: 'custom' }, 'es', labels)).toBe('A medida')
    expect(formatPrice({ mode: 'one-off' }, 'es', labels)).toBe('A medida')
  })
  it('uses the store label for store mode', () => {
    expect(formatPrice({ mode: 'store', storeUrl: 'https://x' }, 'es', labels)).toBe('Ver tienda')
  })
})

describe('formatPriceParts', () => {
  it('returns a prefix only for numeric prices', () => {
    expect(formatPriceParts({ mode: 'one-off', amount: 2500 }, 'es', labels)).toEqual({ prefix: 'Desde', figure: `2.500${NBSP}€` })
    expect(formatPriceParts({ mode: 'monthly', amount: 35 }, 'es', labels)).toEqual({ prefix: 'Desde', figure: `35${NBSP}€/mes` })
  })
  it('has no prefix for custom, missing-amount and store pricing', () => {
    expect(formatPriceParts({ mode: 'custom' }, 'es', labels)).toEqual({ figure: 'A medida' })
    expect(formatPriceParts({ mode: 'monthly' }, 'es', labels)).toEqual({ figure: 'A medida' })
    expect(formatPriceParts({ mode: 'store', storeUrl: 'https://x' }, 'es', labels)).toEqual({ figure: 'Ver tienda' })
  })
})

describe('VAT note', () => {
  const withVat = { ...labels, vat: '+ IVA' }
  it('follows numeric one-off and monthly prices', () => {
    expect(formatPrice({ mode: 'one-off', amount: 300 }, 'es', withVat)).toBe(`Desde 300${NBSP}€ + IVA`)
    expect(formatPriceParts({ mode: 'monthly', amount: 20 }, 'es', withVat)).toEqual({ prefix: 'Desde', figure: `20${NBSP}€/mes`, vat: '+ IVA' })
  })
  it('is never attached to custom or store pricing', () => {
    expect(formatPrice({ mode: 'custom' }, 'es', withVat)).toBe('A medida')
    expect(formatPriceParts({ mode: 'store', storeUrl: 'https://x' }, 'es', withVat)).toEqual({ figure: 'Ver tienda' })
  })
})

describe('contactHref', () => {
  it('carries the project type', () => {
    expect(contactHref('ecommerce')).toEqual({ pathname: '/contact', query: { type: 'ecommerce' } })
  })
  it('carries the pricing plan next to the type', () => {
    expect(contactHref('web', 'estandar')).toEqual({ pathname: '/contact', query: { type: 'web', plan: 'estandar' } })
  })
  it('omits the query without a type', () => {
    expect(contactHref()).toEqual({ pathname: '/contact' })
  })
})

describe('formatEuro', () => {
  it('formats whole euros per locale with non-breaking spaces only', () => {
    // Always grouped, so the price sheet's "1.000 €" reads the same on the site.
    expect(formatEuro(1000, 'es')).toBe(`1.000${NBSP}€`)
    expect(formatEuro(300, 'es')).toBe(`300${NBSP}€`)
    expect(formatEuro(1000, 'en')).toBe('€1,000')
    expect(formatEuro(1000, 'fr')).toBe(`1${NBSP}000${NBSP}€`)
    expect(formatEuro(1000, 'fr')).not.toContain(' ')
  })
})
