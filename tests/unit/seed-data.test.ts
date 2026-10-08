import { describe, expect, it } from 'vitest'
import { slugify } from '@/fields/slug'
import { locales } from '@/i18n/locales'
import { faqs } from '@/seed/data/faqs'
import { home } from '@/seed/data/home'
import { pricing, pricingData } from '@/seed/data/pricing'
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

describe('pricing seed v4 (docs/sources/propuesta-tarifas-web-v4.txt)', () => {
  it('has the six web plans, in order, with both prices, "from" flags and minimum plans', () => {
    expect(
      pricing.shared.packages.map(({ slug, priceWithMaintenance, priceWebOnly, fromPrice, minPlan }) => [
        slug,
        priceWithMaintenance,
        priceWebOnly,
        fromPrice,
        minPlan,
      ]),
    ).toEqual([
      ['landing-page', 349, 590, false, 'esencial'],
      ['landing-premium', 590, 890, false, 'esencial'],
      ['custom', 490, 790, true, 'plus'],
      ['web-corporativa', 890, 1390, false, 'esencial'],
      ['tienda-online', 1490, 2190, false, 'plus'],
      ['web-profesional', 1790, 2590, true, 'pro'],
    ])
    expect(pricing.localized.es.packages.map((p) => p.name)).toEqual([
      'Landing Page',
      'Landing Premium',
      'Custom',
      'Web Corporativa',
      'Tienda Online',
      'Web Profesional',
    ])
  })

  it('features Tienda Online and Plus, and marks Landing Premium as new', () => {
    expect(pricing.shared.packages.filter((p) => p.featured).map((p) => p.slug)).toEqual(['tienda-online'])
    expect(pricing.shared.packages.filter((p) => p.isNew).map((p) => p.slug)).toEqual(['landing-premium'])
    expect(pricing.shared.maintenancePlans.filter((p) => p.featured).map((p) => p.slug)).toEqual(['plus'])
    expect(pricing.shared.packages.find((p) => p.slug === 'tienda-online')?.contactType).toBe('ecommerce')
  })

  it('every minimum plan is one of the maintenance plans', () => {
    const slugs = pricing.shared.maintenancePlans.map((p) => p.slug)
    for (const p of pricing.shared.packages) expect(slugs).toContain(p.minPlan)
  })

  it('has the three public maintenance plans with fee and permanence, plus tailored support on request', () => {
    expect(pricing.shared.maintenancePlans).toEqual([
      { slug: 'esencial', monthlyPrice: 25, permanenceMonths: 24, featured: false },
      { slug: 'plus', monthlyPrice: 45, permanenceMonths: 24, featured: true },
      { slug: 'pro', monthlyPrice: 79, permanenceMonths: 12, featured: false },
    ])
    expect(pricing.localized.es.maintenancePlans.map((p) => p.name)).toEqual(['Esencial', 'Plus', 'Pro'])
    expect(pricing.shared.customSupport).toEqual({ fromPrice: 139, permanenceMonths: 12 })
  })

  it('keeps the Spanish inclusions verbatim', () => {
    const es = pricing.localized.es
    expect(es.packages[0].items.map((i) => i.text)).toEqual([
      'Una página con hasta 5 secciones',
      'Formulario de contacto + botón de WhatsApp',
      'SEO básico on-page',
      'Alta de 1 ficha de Google Business Profile',
    ])
    expect(es.packages[5].itemsLead).toBe('El precio base incluye exactamente:')
    expect(es.packages[5].items.map((i) => i.text)).toEqual([
      'Hasta 6 páginas',
      'Panel de control privado con acceso de usuarios',
      'Sistema de reservas o citas online',
      '1 automatización a WhatsApp (ej. aviso de nueva reserva)',
      '1 integración (calendario o CRM)',
      '1 idioma adicional incluido',
    ])
    expect(es.maintenancePlans[0].items.at(-1)).toEqual({ text: 'Sin correo profesional', excluded: true })
    expect(es.maintenancePlans[2].items.map((i) => i.text)).toEqual([
      'Todo lo de Plus',
      '12 cambios al mes, incluidos pequeños ajustes de diseño',
      'Actualización de tienda con pruebas',
      'SEO mensual: 1 mejora + informe',
      '5 cuentas de correo',
      'WhatsApp · respuesta en 24 h',
    ])
    expect(es.webTitle).toBe('1. Elige tu web')
    expect(es.maintenanceTitle).toBe('2. Elige tu mantenimiento (opcional)')
  })

  it('has the extras table with both columns (p.7, ruling for the misaligned rows)', () => {
    const es = pricing.localized.es.extras.rows
    const rows = pricing.shared.extras.map((r, i) => [es[i].service, r.withPlan ?? es[i].withPlanText, r.withoutPlan ?? es[i].withoutPlanText])
    expect(rows).toEqual([
      ['Cambio (texto, foto, precio, horario)', 'En el cupo · 20 € fuera', 35],
      ['Sección nueva dentro de una página', 45, 90],
      ['Página nueva', 75, 150],
      ['Pack de 25 productos cargados', 45, 90],
      ['Idioma adicional', 180, 320],
      ['Redacción de textos (por página)', 30, 50],
      ['Logo sencillo', 150, 220],
      ['Actualización de seguridad', 'Incluida', 90],
      ['Recuperar web caída', 'Incluido', 150],
      ['Limpieza tras hackeo', 'Incluida', 290],
      ['Rediseño o funciones nuevas', 'Presupuesto', 'Presupuesto'],
    ])
  })

  it('has the comparison table with maintenance vs. web only', () => {
    expect(pricing.localized.es.comparison.rows.map((r) => [r.label, r.withPlan, r.webOnly])).toEqual([
      ['Precio de la web', 'Reducido', 'Completo'],
      ['Hosting y dominio', 'Incluidos', 'Los contrata y paga el cliente'],
      ['Actualizaciones y seguridad', 'Incluidas', '90 € por intervención'],
      ['Cambios', '2–12 al mes según plan', '35 € cada uno'],
      ['Si la web se cae o la hackean', 'Lo resolvemos', '150–290 € por incidencia'],
      ['Garantía de fallos', 'Mientras dure el plan', '30 días'],
      ['Permanencia', '12 o 24 meses', 'Ninguna'],
    ])
  })

  it('translates every list with the same shape and exclusions', () => {
    const es = pricing.localized.es
    const excluded = (plans: { items: { excluded?: boolean }[] }[]) => plans.map((p) => p.items.map((i) => Boolean(i.excluded)))
    for (const locale of ['en', 'fr'] as const) {
      const l = pricing.localized[locale]
      expect(excluded(l.packages)).toEqual(excluded(es.packages))
      expect(excluded(l.maintenancePlans)).toEqual(excluded(es.maintenancePlans))
      expect(l.packages.map((p) => Boolean(p.itemsLead))).toEqual(es.packages.map((p) => Boolean(p.itemsLead)))
      expect(l.extras.rows.map((r) => [Boolean(r.withPlanText), Boolean(r.withoutPlanText)])).toEqual(
        es.extras.rows.map((r) => [Boolean(r.withPlanText), Boolean(r.withoutPlanText)]),
      )
      for (const key of ['webNotes', 'changeNotes', 'permanenceRules'] as const) expect(l[key]).toHaveLength(es[key].length)
      expect(l.comparison.rows).toHaveLength(es.comparison.rows.length)
    }
    expect(pricing.localized.en.vatNote).toBe('+ VAT')
    expect(pricing.localized.fr.vatNote).toBe('+ TVA')
  })

  it('fits the SEO field limits (title 60, description 160) in every locale', () => {
    for (const locale of locales) {
      expect(pricing.localized[locale].seo.title.length, locale).toBeLessThanOrEqual(60)
      expect(pricing.localized[locale].seo.description.length, locale).toBeLessThanOrEqual(160)
    }
  })

  it('pricingData keeps shared numbers on every locale and reuses saved row ids', () => {
    const en = pricingData('en', { packages: ['a', 'b'], maintenancePlans: ['m'], extras: ['x'] })
    expect(en.packages[0]).toMatchObject({ id: 'a', slug: 'landing-page', priceWithMaintenance: 349, name: 'Landing Page' })
    expect(en.packages[2]).not.toHaveProperty('id')
    expect(en.maintenancePlans[0]).toMatchObject({ id: 'm', slug: 'esencial', monthlyPrice: 25, name: 'Essential' })
    expect(en.extras.rows[0]).toMatchObject({ id: 'x', withoutPlan: 35 })
    expect(en.customSupport).toMatchObject({ fromPrice: 139, permanenceMonths: 12 })
  })
})

describe('service prices follow the v4 price sheet', () => {
  it('web from the Landing Page, online stores from Tienda Online, maintenance from Esencial', () => {
    const byType = Object.fromEntries(services.map((s) => [s.shared.contactType, s.shared.pricing]))
    const plan = (slug: string) => pricing.shared.packages.find((p) => p.slug === slug)
    expect(byType.web).toEqual({ mode: 'one-off', amount: plan('landing-page')?.priceWithMaintenance })
    expect(byType.ecommerce).toEqual({ mode: 'one-off', amount: plan('tienda-online')?.priceWithMaintenance })
    expect(byType.maintenance).toEqual({ mode: 'monthly', amount: pricing.shared.maintenancePlans[0].monthlyPrice })
    expect([byType.web.amount, byType.ecommerce.amount, byType.maintenance.amount]).toEqual([349, 1490, 25])
  })

  it('service SEO texts fit the field limits (title 60, description 160) in every locale', () => {
    for (const s of services) {
      for (const locale of locales) {
        expect(s.localized[locale].seo.title.length, `${s.localized.es.slug} ${locale}`).toBeLessThanOrEqual(60)
        expect(s.localized[locale].seo.description.length, `${s.localized.es.slug} ${locale}`).toBeLessThanOrEqual(160)
      }
    }
  })
})
