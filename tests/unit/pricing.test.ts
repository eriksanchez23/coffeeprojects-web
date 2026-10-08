import { describe, expect, it } from 'vitest'
import { completeMaintenancePlans, completeWebPlans, duplicateSlug, extraCell, findMinPlan, validateMinPlan } from '@/lib/pricing'

const NBSP = ' '
const maintenance = [
  { slug: 'esencial', name: 'Esencial', monthlyPrice: 25, permanenceMonths: 24 },
  { slug: 'plus', name: 'Plus', monthlyPrice: 45, permanenceMonths: 24 },
  { slug: 'pro', name: 'Pro', monthlyPrice: 79, permanenceMonths: 12 },
]

describe('findMinPlan', () => {
  it('returns the maintenance plan a web plan needs for its reduced price', () => {
    expect(findMinPlan('plus', maintenance)?.name).toBe('Plus')
  })
  it('returns undefined for a missing or unknown slug', () => {
    expect(findMinPlan(undefined, maintenance)).toBeUndefined()
    expect(findMinPlan(null, maintenance)).toBeUndefined()
    expect(findMinPlan('premium', maintenance)).toBeUndefined()
    expect(findMinPlan('plus', [])).toBeUndefined()
  })
})

describe('completeWebPlans / completeMaintenancePlans', () => {
  it('keeps only web plans with both prices (a just-migrated row has none)', () => {
    const plans = [
      { slug: 'landing-page', priceWithMaintenance: 349, priceWebOnly: 590 },
      { slug: 'basico', priceWithMaintenance: null, priceWebOnly: null },
      { slug: 'half', priceWithMaintenance: 100 },
      { slug: 'free', priceWithMaintenance: 0, priceWebOnly: 0 },
    ]
    expect(completeWebPlans(plans).map((p) => p.slug)).toEqual(['landing-page', 'free'])
    expect(completeWebPlans(null)).toEqual([])
  })
  it('keeps only maintenance plans with a monthly fee and a permanence', () => {
    expect(completeMaintenancePlans([...maintenance, { slug: 'x', monthlyPrice: 10, permanenceMonths: null }]).map((p) => p.slug)).toEqual([
      'esencial',
      'plus',
      'pro',
    ])
    expect(completeMaintenancePlans(undefined)).toEqual([])
  })
})

describe('duplicateSlug', () => {
  it('returns the first repeated slug, or undefined when all are unique', () => {
    expect(duplicateSlug([{ slug: 'a' }, { slug: 'b' }, { slug: 'a' }])).toBe('a')
    expect(duplicateSlug([{ slug: 'a' }, { slug: 'b' }])).toBeUndefined()
    expect(duplicateSlug(undefined)).toBeUndefined()
  })
})

describe('validateMinPlan', () => {
  const data = { maintenancePlans: maintenance }
  it('accepts an empty value or a slug of an existing maintenance plan', () => {
    expect(validateMinPlan(undefined, data)).toBe(true)
    expect(validateMinPlan('', data)).toBe(true)
    expect(validateMinPlan('esencial', data)).toBe(true)
  })
  it('rejects a slug that is not one of the maintenance plans', () => {
    expect(validateMinPlan('premium', data)).toMatch(/premium/)
  })
  it('does not block a save when the maintenance plans are not in the submitted data', () => {
    expect(validateMinPlan('esencial', {})).toBe(true)
    expect(validateMinPlan('esencial', undefined)).toBe(true)
  })
})

describe('extraCell', () => {
  it('formats an amount as whole euros for the locale', () => {
    expect(extraCell(45, null, 'es')).toBe(`45${NBSP}€`)
    expect(extraCell(320, 'ignored', 'en')).toBe('€320')
    expect(extraCell(1500, null, 'fr')).toBe(`1${NBSP}500${NBSP}€`)
  })
  it('falls back to the text ("Incluida", "Presupuesto"), then to a dash', () => {
    expect(extraCell(null, 'Incluida', 'es')).toBe('Incluida')
    expect(extraCell(undefined, '  ', 'es')).toBe('—')
    expect(extraCell(null, null, 'es')).toBe('—')
  })
  it('shows a zero amount as a price, not as missing', () => {
    expect(extraCell(0, null, 'es')).toBe(`0${NBSP}€`)
  })
})
