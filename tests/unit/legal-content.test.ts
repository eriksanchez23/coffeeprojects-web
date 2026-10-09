import { describe, expect, it } from 'vitest'
import { legal } from '@/seed/data/legal'
import { locales } from '@/i18n/locales'

// Plain text of a seeded Lexical document (headings + paragraphs).
const text = (doc: unknown) =>
  ((doc as { root: { children: { children: { text: string }[] }[] } }).root.children)
    .flatMap((n) => n.children.map((c) => c.text))
    .join('\n')

const incorporating = { es: 'CoffeeProjects (en constitución)', en: 'CoffeeProjects (being incorporated)', fr: 'CoffeeProjects (en cours de constitution)' } as const
const taxId = {
  es: 'NIF: en trámite (sociedad en constitución)',
  en: 'NIF (Spanish tax ID): in progress (company being incorporated)',
  fr: 'NIF (numéro fiscal espagnol) : en cours (société en cours de constitution)',
} as const
const clauses = { es: 'Cláusulas Contractuales Tipo', en: 'Standard Contractual Clauses', fr: 'clauses contractuelles types' } as const
const anyMarker = /\[(PENDIENTE|PENDING|EN ATTENTE)/g

describe.each(locales)('seeded legal texts (%s)', (locale) => {
  const { legalNotice, privacyPolicy, cookiePolicy } = legal[locale]
  const docs = { legalNotice, privacyPolicy, cookiePolicy }

  it('carry no pending marker and no draft notice (texts approved)', () => {
    for (const doc of Object.values(docs)) {
      const t = text(doc)
      expect(t.match(anyMarker)).toBeNull()
      expect(t).not.toMatch(/Borrador|Draft:|Brouillon/)
    }
  })

  it('identify the provider: incorporating company, person, tax ID in progress, Murcia, email', () => {
    for (const doc of [legalNotice, privacyPolicy]) {
      const t = text(doc)
      for (const fact of [incorporating[locale], 'Juan Pérez Ros', taxId[locale], 'Murcia', 'contact@coffeeprojects.es']) expect(t).toContain(fact)
    }
  })

  it('give no street address and no legal name placeholder', () => {
    for (const doc of Object.values(docs)) expect(text(doc)).not.toMatch(/domicilio|address:|adresse :|razón social|legal name|raison sociale/i)
  })

  it('privacy policy names the processors, the transfer safeguards and what Meta receives', () => {
    const t = text(privacyPolicy)
    for (const name of ['Resend', 'Cloudflare', 'Turnstile', 'Meta']) expect(t).toContain(name)
    for (const fact of ['SHA-256', '_fbp/_fbc', 'UTM', 'fbclid', clauses[locale]]) expect(t).toContain(fact)
    expect(t).toMatch(/Data Privacy Framework/)
  })

  it('states own hosting in Spain and the 24-month anonymization plus deletion on request', () => {
    const t = text(privacyPolicy)
    expect(t).toMatch(/24/)
    expect(t).toContain('contact@coffeeprojects.es')
    expect(t).toMatch(locale === 'es' ? /servidor propio ubicado en España/ : locale === 'en' ? /own server located in Spain/ : /propre serveur situé en Espagne/)
    expect(t).not.toMatch(/12 (meses|months|mois)/)
  })

  it('never mention the previous hosting providers or the old approximate-quote wording', () => {
    for (const doc of Object.values(docs)) {
      const t = text(doc)
      expect(t).not.toMatch(/Vercel|Neon/)
      expect(t).not.toMatch(/presupuesto aproximado|approximate (quote|budget)|devis approximatif|budget approximatif/i)
    }
  })

  it('cookie policy lists every cookie the site sets, with its duration', () => {
    const t = text(cookiePolicy)
    for (const cookie of ['cp_consent', 'cp_attr', 'cp_lead', '_fbp', '_fbc', 'Turnstile']) expect(t).toContain(cookie)
    expect(t).toMatch(/cp_lead \(10 /)
    expect(t).toMatch(/cp_attr \(30 /)
  })
})
