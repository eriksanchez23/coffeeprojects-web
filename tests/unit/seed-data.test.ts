import { describe, expect, it } from 'vitest'
import { slugify } from '@/fields/slug'
import { locales } from '@/i18n/locales'
import { faqs } from '@/seed/data/faqs'
import { home } from '@/seed/data/home'
import { pricing } from '@/seed/data/pricing'
import { projects } from '@/seed/data/projects'
import { services } from '@/seed/data/services'
import { team } from '@/seed/data/team'

function emptyStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() === '' ? [path] : []
  if (Array.isArray(value)) return value.flatMap((v, i) => emptyStrings(v, `${path}[${i}]`))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, `${path}.${k}`))
  return []
}

const localizedSets = {
  home: [home.localized],
  services: services.map((s) => s.localized),
  team: team.map((t) => t.localized),
  projects: projects.map((p) => p.localized),
  faqs: faqs.map((f) => f.localized),
  pricing: [pricing.localized],
}

describe('seed data', () => {
  for (const [name, items] of Object.entries(localizedSets)) {
    it(`${name}: every item has ES/EN/FR with no empty strings`, () => {
      for (const item of items) {
        for (const locale of locales) {
          expect(item[locale], `${name} missing ${locale}`).toBeDefined()
          expect(emptyStrings(item[locale])).toEqual([])
        }
      }
    })
  }

  it('slugs are already slugified and unique per locale', () => {
    for (const set of [services, team, projects]) {
      for (const locale of locales) {
        const slugs = set.map((d) => d.localized[locale].slug)
        slugs.forEach((s) => expect(s).toBe(slugify(s)))
        expect(new Set(slugs).size).toBe(slugs.length)
      }
    }
  })

  it('stats are never zero', () => {
    home.shared.stats.forEach((s) => expect(s.value).toBeGreaterThan(0))
  })

  it('list-shaped localized arrays have the same length in every locale', () => {
    for (const s of services) {
      expect(s.localized.en.features.length).toBe(s.localized.es.features.length)
      expect(s.localized.fr.features.length).toBe(s.localized.es.features.length)
      expect(s.localized.en.faq.length).toBe(s.localized.es.faq.length)
      expect(s.localized.fr.faq.length).toBe(s.localized.es.faq.length)
    }
    for (const key of ['whyUs', 'process'] as const) {
      expect(home.localized.en[key].length).toBe(home.localized.es[key].length)
      expect(home.localized.fr[key].length).toBe(home.localized.es[key].length)
    }
  })
})

describe('pricing seed (docs/05-pricing-es.md)', () => {
  it('has the price sheet packages, in order, with their exact prices', () => {
    expect(pricing.shared.packages).toEqual([
      { slug: 'basico', initialPrice: 300, monthlyPrice: 20, featured: false },
      { slug: 'estandar', initialPrice: 400, monthlyPrice: 30, featured: true },
      { slug: 'profesional', initialPrice: 1000, monthlyPrice: 50, featured: false },
    ])
    expect(pricing.shared.custom).toEqual({ fromPrice: 500, monthlyPrice: 20 })
    expect(pricing.localized.es.packages.map((p) => p.name)).toEqual(['Básico', 'Estándar', 'Profesional'])
  })

  it('keeps the Spanish inclusions verbatim', () => {
    expect(pricing.localized.es.packages[2].items.map((i) => i.text)).toEqual([
      'Landing Page',
      'Dominio incluido',
      'Con SEO',
      'Panel de acceso privado',
      'Automatizaciones (principalmente a WhatsApp)',
      'Mantenimiento experto: todo tipo de soporte, actualización y mantenimiento de la web',
    ])
    expect(pricing.localized.es.packages[0].items[2]).toEqual({ text: 'Sin SEO', excluded: true })
    expect(pricing.localized.es.footnote).toBe('Los importes mostrados no incluyen IVA, que se aplicará según la normativa vigente.')
  })

  it('translates every package with the same inclusions and exclusions', () => {
    for (const locale of ['en', 'fr'] as const) {
      expect(pricing.localized[locale].packages.map((p) => p.items.map((i) => Boolean(i.excluded)))).toEqual(
        pricing.localized.es.packages.map((p) => p.items.map((i) => Boolean(i.excluded))),
      )
    }
    expect(pricing.localized.en.vatNote).toBe('+ VAT')
    expect(pricing.localized.fr.vatNote).toBe('+ TVA')
  })
})

describe('service prices follow the price sheet', () => {
  it('web starts at the Básico package and maintenance at its monthly fee', () => {
    const byType = Object.fromEntries(services.map((s) => [s.shared.contactType, s.shared.pricing]))
    expect(byType.web).toEqual({ mode: 'one-off', amount: pricing.shared.packages[0].initialPrice })
    expect(byType.maintenance).toEqual({ mode: 'monthly', amount: pricing.shared.packages[0].monthlyPrice })
  })
})
