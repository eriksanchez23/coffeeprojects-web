import { describe, expect, it } from 'vitest'
import { buildQuote, quoteLabelsFrom, quoteLines, quoteSummaryText, serviceForType, withVat } from '@/features/contact/quote'

const labels = {
  title: 'Precio final y plazo estimado',
  plan: 'Plan',
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
  hint: 'x',
}

const services = [
  { contactType: 'web', typicalTime: '1-2 semanas', pricing: { mode: 'one-off', amount: 349 } },
  { contactType: 'ecommerce', typicalTime: '4-8 semanas', pricing: { mode: 'one-off', amount: 1490 } },
  { contactType: 'maintenance', typicalTime: 'Respuesta en 24–72 h', pricing: { mode: 'monthly', amount: 25 } },
  { contactType: 'custom', typicalTime: '2-12 semanas', pricing: { mode: 'custom' } },
  { contactType: 'fivem-script', typicalTime: 'Días', pricing: { mode: 'store', storeUrl: '' } },
]

// Visible prices keep NBSPs so they never wrap; compare them with plain spaces.
const ql = (q: Parameters<typeof quoteLines>[0]) => quoteLines(q, 'es', labels).map((l) => ({ ...l, value: l.value.replace(/\u00a0/g, ' ') }))

const landing = { slug: 'landing-page', name: 'Landing Page', priceWithMaintenance: 349, priceWebOnly: 590, fromPrice: false }
const pro = { slug: 'web-profesional', name: 'Web Profesional', priceWithMaintenance: 1790, priceWebOnly: 2590, fromPrice: true }

describe('withVat', () => {
  it('adds the 21 % Spanish VAT, rounded to cents', () => {
    expect(withVat(349)).toBe(422.29)
    expect(withVat(590)).toBe(713.9)
    expect(withVat(25)).toBe(30.25)
    expect(withVat(1000)).toBe(1210)
  })
})

describe('serviceForType', () => {
  it('finds the service whose contact type is the selected project type', () => {
    expect(serviceForType('ecommerce', services)?.typicalTime).toBe('4-8 semanas')
    expect(serviceForType('discord-bot', services)).toBeUndefined()
  })
})

describe('buildQuote', () => {
  it('uses both plan prices with VAT and the project type service time', () => {
    expect(buildQuote({ type: 'web', plan: landing, services })).toEqual({
      plan: {
        name: 'Landing Page',
        withMaintenance: { amount: 422.29, from: false, monthly: false },
        webOnly: { amount: 713.9, from: false, monthly: false },
      },
      time: '1-2 semanas',
    })
  })

  it('keeps the plan "from" flag', () => {
    const q = buildQuote({ type: 'web', plan: pro, services })
    expect(q.plan?.withMaintenance).toEqual({ amount: 2165.9, from: true, monthly: false })
  })

  it('without a plan uses the service "from" price with VAT (monthly kept)', () => {
    expect(buildQuote({ type: 'ecommerce', services })).toEqual({ price: { amount: 1802.9, from: true, monthly: false }, time: '4-8 semanas' })
    expect(buildQuote({ type: 'maintenance', services }).price).toEqual({ amount: 30.25, from: true, monthly: true })
  })

  it('has no numeric price for custom-quote or store services, nor for an unknown service', () => {
    expect(buildQuote({ type: 'custom', services })).toEqual({ price: null, time: '2-12 semanas' })
    expect(buildQuote({ type: 'fivem-script', services }).price).toBeNull()
    expect(buildQuote({ type: 'discord-bot', services })).toEqual({ price: null })
  })
})

describe('quoteLines / quoteSummaryText', () => {
  it('formats the plan quote in the visitor locale', () => {
    const q = buildQuote({ type: 'web', plan: landing, services })
    expect(ql(q)).toEqual([
      { label: 'Plan', value: 'Landing Page' },
      { label: 'Con mantenimiento', value: '422,29 €' },
      { label: 'Solo la web', value: '713,90 €' },
      { label: 'Plazo estimado', value: '1-2 semanas' },
    ])
  })

  it('formats "from", monthly and custom prices', () => {
    expect(ql(buildQuote({ type: 'web', plan: pro, services }))[1]!.value).toBe('desde 2.165,90 €')
    expect(ql(buildQuote({ type: 'maintenance', services }))[0]).toEqual({ label: 'Precio final', value: 'desde 30,25 €/mes' })
    expect(ql(buildQuote({ type: 'ecommerce', services }))[0]!.value).toBe('desde 1.802,90 €')
    expect(ql(buildQuote({ type: 'custom', services }))[0]!.value).toBe('A medida (bajo presupuesto)')
    // Whole amounts carry no cents.
    expect(ql(buildQuote({ type: 'web', services: [{ contactType: 'web', typicalTime: 'x', pricing: { mode: 'one-off', amount: 1000 } }] }))[0]!.value).toBe('desde 1.210 €')
  })

  it('omits the time line when the service is unknown', () => {
    expect(ql(buildQuote({ type: 'discord-bot', services }))).toEqual([{ label: 'Precio final', value: 'A medida (bajo presupuesto)' }])
  })

  it('summarises the quote as one line with the VAT note for the lead record', () => {
    const text = quoteSummaryText(buildQuote({ type: 'web', plan: landing, services }), 'es', labels)
    expect(text).toBe('Plan: Landing Page · Con mantenimiento: 422,29 € · Solo la web: 713,90 € · Plazo estimado: 1-2 semanas (IVA (21 %) incluido)')
  })

  it('only uses characters that the WIN1252 dev database can store', () => {
    const text = quoteSummaryText(buildQuote({ type: 'web', plan: pro, services }), 'fr', { ...labels, from: 'à partir de {price}' })
    expect(text).not.toMatch(/[ →]/)
  })
})

describe('maintenance chosen with a web plan', () => {
  const pay = { section: 'payment' as const }

  it('with a maintenance plan: the web paid up front, the fees over the minimum term and the total, VAT included', () => {
    const q = buildQuote({ type: 'web', plan: landing, maintenance: { name: 'Esencial', monthlyPrice: 25, permanenceMonths: 24 }, services })
    expect(ql(q)).toEqual([
      { label: 'Plan', value: 'Landing Page' },
      { label: 'Mantenimiento', value: 'Esencial · 30,25 €/mes' },
      { label: 'Plazo estimado', value: '1-2 semanas' },
      { label: 'Al inicio: la web (pago único)', value: '422,29 €', ...pay },
      // 30,25 € × 24
      { label: 'Mantenimiento · 24 meses', value: '726 €', ...pay },
      { label: 'Total en 24 meses', value: '1.148,29 €', ...pay, strong: true },
    ])
  })

  it('totals cents exactly and keeps "from" on the web and the total, never on the fees', () => {
    const q = buildQuote({ type: 'web', plan: pro, maintenance: { name: 'Pro', monthlyPrice: 79, permanenceMonths: 12 }, services })
    const lines = ql(q).filter((l) => l.section === 'payment')
    expect(lines).toEqual([
      { label: 'Al inicio: la web (pago único)', value: 'desde 2.165,90 €', ...pay },
      // 95,59 € × 12 = 1.147,08 €
      { label: 'Mantenimiento · 12 meses', value: '1.147,08 €', ...pay },
      { label: 'Total en 12 meses', value: 'desde 3.312,98 €', ...pay, strong: true },
    ])
  })

  it('without a known minimum term: only the upfront web price', () => {
    const q = buildQuote({ type: 'web', plan: landing, maintenance: { name: 'Esencial', monthlyPrice: 25 }, services })
    expect(ql(q).filter((l) => l.section === 'payment')).toEqual([{ label: 'Al inicio: la web (pago único)', value: '422,29 €', ...pay }])
  })

  it('without maintenance: the web-only price, which is also the total', () => {
    expect(ql(buildQuote({ type: 'web', plan: pro, maintenance: 'none', services }))).toEqual([
      { label: 'Plan', value: 'Web Profesional' },
      { label: 'Mantenimiento', value: 'Sin mantenimiento' },
      { label: 'Plazo estimado', value: '1-2 semanas' },
      { label: 'Al inicio: la web (pago único)', value: 'desde 3.133,90 €', ...pay },
      { label: 'Total (sin cuotas mensuales)', value: 'desde 3.133,90 €', ...pay, strong: true },
    ])
  })

  it('the stored one-line summary includes what the visitor will pay', () => {
    const q = buildQuote({ type: 'web', plan: landing, maintenance: { name: 'Esencial', monthlyPrice: 25, permanenceMonths: 24 }, services })
    expect(quoteSummaryText(q, 'es', labels)).toBe(
      'Plan: Landing Page · Mantenimiento: Esencial · 30,25 €/mes · Plazo estimado: 1-2 semanas · Al inicio: la web (pago único): 422,29 € · Mantenimiento · 24 meses: 726 € · Total en 24 meses: 1.148,29 € (IVA (21 %) incluido)',
    )
  })
})

describe('quoteLabelsFrom', () => {
  it('rebuilds the {price} templates from a next-intl style translator (messages are precompiled)', () => {
    const messages: Record<string, string> = { 'quote.from': 'desde {price}', 'quote.perMonth': '{price}/mes' }
    const messages2: Record<string, string> = { ...messages, 'quote.total': 'Total en {months} meses' }
    const t = (key: string, values?: { price: string; months: string }) =>
      (messages2[key] ?? key).replace('{price}', values?.price ?? '').replace('{months}', values?.months ?? '')
    const l = quoteLabelsFrom(t)
    expect(l.from).toBe('desde {price}')
    expect(l.perMonth).toBe('{price}/mes')
    expect(l.total).toBe('Total en {months} meses')
    expect(l.vat).toBe('quote.vat')
  })
})
