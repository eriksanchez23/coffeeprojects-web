import { describe, expect, it } from 'vitest'
import {
  commissionAmount,
  commissionRows,
  fillTemplate,
  formatCommission,
  formatRate,
  registerMailto,
  savingsRange,
} from '@/lib/partners'

const NBSP = ' '

// v4 web plans (S15), as the Pricing global stores them.
const plans = [
  { id: 'a', slug: 'landing-page', name: 'Landing Page', priceWithMaintenance: 349, priceWebOnly: 590, fromPrice: false },
  { id: 'b', slug: 'landing-premium', name: 'Landing Premium', priceWithMaintenance: 590, priceWebOnly: 890, fromPrice: false },
  { id: 'c', slug: 'custom', name: 'Custom', priceWithMaintenance: 490, priceWebOnly: 790, fromPrice: true },
  { id: 'd', slug: 'web-corporativa', name: 'Web Corporativa', priceWithMaintenance: 890, priceWebOnly: 1390, fromPrice: false },
  { id: 'e', slug: 'tienda-online', name: 'Tienda Online', priceWithMaintenance: 1490, priceWebOnly: 2190, fromPrice: false },
  { id: 'f', slug: 'web-profesional', name: 'Web Profesional', priceWithMaintenance: 1790, priceWebOnly: 2590, fromPrice: true },
]
const rates = { withMaintenance: 10, webOnly: 5 }

describe('commissionAmount', () => {
  it('is the rate applied to the VAT-excluded web price, in euros with cents', () => {
    expect(commissionAmount(349, 10)).toBe(34.9)
    expect(commissionAmount(590, 5)).toBe(29.5)
    expect(commissionAmount(2190, 5)).toBe(109.5)
    expect(commissionAmount(1790, 10)).toBe(179)
  })
  it('rounds to the cent', () => {
    expect(commissionAmount(333, 7.5)).toBe(24.98)
    expect(commissionAmount(0.1 + 0.2, 100)).toBe(0.3)
  })
})

describe('commissionRows', () => {
  it('matches the collaborator sheet for every v4 plan', () => {
    const rows = commissionRows(plans, rates)
    expect(rows.map((r) => [r.name, r.withMaintenance.commission, r.webOnly.commission])).toEqual([
      ['Landing Page', 34.9, 29.5],
      ['Landing Premium', 59, 44.5],
      ['Custom', 49, 39.5],
      ['Web Corporativa', 89, 69.5],
      ['Tienda Online', 149, 109.5],
      ['Web Profesional', 179, 129.5],
    ])
    expect(rows[0]).toMatchObject({ key: 'a', fromPrice: false, withMaintenance: { price: 349 }, webOnly: { price: 590 } })
    expect(rows.filter((r) => r.fromPrice).map((r) => r.name)).toEqual(['Custom', 'Web Profesional'])
  })
  it('follows the rates from the panel', () => {
    const [landing] = commissionRows(plans, { withMaintenance: 12, webOnly: 6 })
    expect(landing.withMaintenance.commission).toBe(41.88)
    expect(landing.webOnly.commission).toBe(35.4)
  })
  it('skips plans without both prices (rows left by an older schema)', () => {
    const rows = commissionRows([...plans, { id: 'x', slug: 'old', name: 'Old', priceWithMaintenance: null, priceWebOnly: 300 }], rates)
    expect(rows).toHaveLength(6)
    expect(commissionRows(null, rates)).toEqual([])
  })
})

describe('formatCommission', () => {
  it('formats per locale with cents and non-breaking spaces', () => {
    expect(formatCommission(34.9, 'es')).toBe(`34,90${NBSP}€`)
    expect(formatCommission(29.5, 'es')).toBe(`29,50${NBSP}€`)
    expect(formatCommission(109.5, 'es')).toBe(`109,50${NBSP}€`)
    expect(formatCommission(1234.5, 'es')).toBe(`1.234,50${NBSP}€`)
    expect(formatCommission(34.9, 'en')).toBe('€34.90')
    expect(formatCommission(109.5, 'fr')).toBe(`109,50${NBSP}€`)
    expect(formatCommission(1234.5, 'fr')).toBe(`1${NBSP}234,50${NBSP}€`)
  })
})

describe('formatRate', () => {
  it('formats a percentage per locale', () => {
    expect(formatRate(10, 'es')).toBe(`10${NBSP}%`)
    expect(formatRate(5, 'en')).toBe('5%')
    expect(formatRate(10, 'fr')).toBe(`10${NBSP}%`)
    expect(formatRate(7.5, 'es')).toBe(`7,5${NBSP}%`)
  })
})

describe('savingsRange', () => {
  it('is the smallest and largest discount a maintenance plan brings', () => {
    expect(savingsRange(plans)).toEqual({ min: 241, max: 800 })
  })
  it('is undefined without complete plans', () => {
    expect(savingsRange([])).toBeUndefined()
  })
})

describe('fillTemplate', () => {
  it('replaces known placeholders and leaves the rest untouched', () => {
    expect(fillTemplate('Ganas un {high} frente al {low}.', { high: '10 %', low: '5 %' })).toBe('Ganas un 10 % frente al 5 %.')
    expect(fillTemplate('Hasta {max} y {unknown}', { max: '800 €' })).toBe('Hasta 800 € y {unknown}')
    expect(fillTemplate(null, {})).toBe('')
  })
})

describe('registerMailto', () => {
  it('prefills subject and the empty client form, URL-encoded', () => {
    const href = registerMailto('contact@coffeeprojects.es', 'Registro de cliente', 'Nombre:\nNegocio:\nTeléfono:')
    expect(href).toBe(
      'mailto:contact@coffeeprojects.es?subject=Registro%20de%20cliente&body=Nombre%3A%0D%0ANegocio%3A%0D%0ATel%C3%A9fono%3A',
    )
  })
  it('omits empty parts', () => {
    expect(registerMailto('a@b.es', '', '')).toBe('mailto:a@b.es')
    expect(registerMailto('a@b.es', 'Hola', null)).toBe('mailto:a@b.es?subject=Hola')
  })
})
