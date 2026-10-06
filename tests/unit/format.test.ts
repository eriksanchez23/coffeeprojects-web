import { describe, expect, it } from 'vitest'
import { contactHref, formatPrice } from '@/lib/format'

const labels = { from: 'Desde', perMonth: '/mes', custom: 'A medida', seeStore: 'Ver tienda' }

describe('formatPrice', () => {
  it('formats one-off prices without decimals per locale', () => {
    expect(formatPrice({ mode: 'one-off', amount: 2500 }, 'es', labels)).toBe('Desde 2500 €')
    expect(formatPrice({ mode: 'one-off', amount: 2500 }, 'en', { ...labels, from: 'From' })).toBe('From €2,500')
  })
  it('formats monthly prices', () => {
    expect(formatPrice({ mode: 'monthly', amount: 35 }, 'es', labels)).toBe('Desde 35 €/mes')
  })
  it('falls back to the custom label', () => {
    expect(formatPrice({ mode: 'custom' }, 'es', labels)).toBe('A medida')
    expect(formatPrice({ mode: 'one-off' }, 'es', labels)).toBe('A medida')
  })
  it('uses the store label for store mode', () => {
    expect(formatPrice({ mode: 'store', storeUrl: 'https://x' }, 'es', labels)).toBe('Ver tienda')
  })
})

describe('contactHref', () => {
  it('carries the project type', () => {
    expect(contactHref('ecommerce')).toEqual({ pathname: '/contact', query: { type: 'ecommerce' } })
  })
  it('omits the query without a type', () => {
    expect(contactHref()).toEqual({ pathname: '/contact' })
  })
})
