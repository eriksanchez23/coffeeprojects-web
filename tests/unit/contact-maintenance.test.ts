import { describe, expect, it } from 'vitest'
import { resolveMaintenance } from '@/features/contact/plan'
import { contactSchema } from '@/features/contact/schema'
import { toContactRecord } from '@/features/contact/record'
import { allowedMaintenance } from '@/lib/pricing'
import { leadQuoteSummary } from '@/features/contact/quote'

const plans = [
  { slug: 'esencial', name: 'Esencial', monthlyPrice: 25, permanenceMonths: 24 },
  { slug: 'plus', name: 'Plus', monthlyPrice: 45, permanenceMonths: 24 },
  { slug: 'pro', name: 'Pro', monthlyPrice: 79, permanenceMonths: 12 },
]

describe('allowedMaintenance', () => {
  it('offers the minimum plan and every more complete one', () => {
    expect(allowedMaintenance('esencial', plans).map((p) => p.slug)).toEqual(['esencial', 'plus', 'pro'])
    expect(allowedMaintenance('plus', plans).map((p) => p.slug)).toEqual(['plus', 'pro'])
    expect(allowedMaintenance(undefined, plans)).toHaveLength(3)
    expect(allowedMaintenance('gone', plans)).toHaveLength(3)
  })
})

describe('resolveMaintenance', () => {
  it('accepts "none" and maintenance plans valid for the web plan only', () => {
    expect(resolveMaintenance('none', 'plus', plans)).toBe('none')
    expect(resolveMaintenance('pro', 'plus', plans)).toMatchObject({ slug: 'pro' })
    // Below the plan's minimum: it would not unlock the reduced price.
    expect(resolveMaintenance('esencial', 'plus', plans)).toBeUndefined()
    expect(resolveMaintenance('unknown', 'esencial', plans)).toBeUndefined()
    expect(resolveMaintenance('<script>', 'esencial', plans)).toBeUndefined()
    expect(resolveMaintenance(undefined, 'esencial', plans)).toBeUndefined()
  })
})

describe('maintenance in the contact submission', () => {
  const base = {
    name: 'Ana',
    email: 'ana@example.com',
    projectType: 'web',
    message: 'Quiero una landing para mi negocio de reformas.',
    privacy: 'on',
    locale: 'es',
    plan: 'landing-page',
    maintenance: 'esencial',
  }
  it('is parsed with the plan and kept out of the stored row (it lives in the quoted summary)', () => {
    const parsed = contactSchema.parse(base)
    expect(parsed.maintenance).toBe('esencial')
    const row = toContactRecord({ ...parsed, ipHash: 'h' }, { marketing: false, attribution: null })
    expect(row).not.toHaveProperty('maintenance')
    expect(row).toMatchObject({ plan: 'landing-page' })
  })
})

describe('leadQuoteSummary (stored on the request, built on the server)', () => {
  const labels = {
    plan: 'Plan elegido',
    price: 'Precio final',
    withMaintenance: 'Con mantenimiento',
    webOnly: 'Solo la web',
    time: 'Plazo estimado',
    from: 'desde {price}',
    perMonth: '{price}/mes',
    custom: 'A medida (bajo presupuesto)',
    vat: 'IVA (21 %) incluido',
    maintenance: 'Mantenimiento',
    noMaintenance: 'Sin mantenimiento',
    upfront: 'Al inicio: la web (pago único)',
    maintenanceTerm: 'Mantenimiento · {months} meses',
    total: 'Total en {months} meses',
    totalWebOnly: 'Total (sin cuotas mensuales)',
  }
  const services = [
    { contactType: 'web', typicalTime: '1-2 semanas', pricing: { mode: 'one-off', amount: 349 } },
    { contactType: 'ecommerce', typicalTime: '4-8 semanas', pricing: { mode: 'one-off', amount: 1490 } },
  ]
  // The price sheet of the site (unchanged): Landing 349/590, Tienda 1490/2190 (from Plus), maintenance 25/45/79.
  const pricing = {
    packages: [
      { slug: 'landing-page', name: 'Landing Page', priceWithMaintenance: 349, priceWebOnly: 590, fromPrice: false, minPlan: 'esencial' },
      { slug: 'tienda-online', name: 'Tienda Online', priceWithMaintenance: 1490, priceWebOnly: 2190, fromPrice: false, minPlan: 'plus' },
    ],
    maintenancePlans: plans,
  }
  const summary = (input: { projectType: string; plan?: string; maintenance?: string }) =>
    leadQuoteSummary({ locale: 'es', ...input }, { services, pricing, labels, resolveMaintenance })

  it('stores the maintenance plan, the reduced web price paid up front and the total over the minimum term', () => {
    // 422,29 € + 54,45 € × 24 = 422,29 € + 1.306,80 €
    expect(summary({ projectType: 'web', plan: 'landing-page', maintenance: 'plus' })).toBe(
      'Plan elegido: Landing Page · Mantenimiento: Plus · 54,45 €/mes · Plazo estimado: 1-2 semanas · Al inicio: la web (pago único): 422,29 € · Mantenimiento · 24 meses: 1.306,80 € · Total en 24 meses: 1.729,09 € (IVA (21 %) incluido)',
    )
  })

  it('stores "no maintenance" with the web-only price', () => {
    expect(summary({ projectType: 'ecommerce', plan: 'tienda-online', maintenance: 'none' })).toBe(
      'Plan elegido: Tienda Online · Mantenimiento: Sin mantenimiento · Plazo estimado: 4-8 semanas · Al inicio: la web (pago único): 2.649,90 € · Total (sin cuotas mensuales): 2.649,90 € (IVA (21 %) incluido)',
    )
  })

  it('a maintenance plan below the web plan minimum (forged form) falls back to listing both prices', () => {
    expect(summary({ projectType: 'ecommerce', plan: 'tienda-online', maintenance: 'esencial' })).toBe(
      'Plan elegido: Tienda Online · Con mantenimiento: 1.802,90 € · Solo la web: 2.649,90 € · Plazo estimado: 4-8 semanas (IVA (21 %) incluido)',
    )
  })
})
