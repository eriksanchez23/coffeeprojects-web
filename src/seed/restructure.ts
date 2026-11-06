import type { Payload } from 'payload'
import { locales } from '@/i18n/locales'
import { faqs } from './data/faqs'
import { homeData } from './data/home'
import { projects } from './data/projects'
import { services } from './data/services'

/**
 * 2026-11 website-focused restructure, for databases seeded before it (production). The regular seed never
 * overwrites existing documents; these steps only replace content that is still exactly the OLD seed text, or
 * fill fields that are empty, so anything the team edited in the panel is left alone.
 */

const OLD_WEB_TITLE = 'Webs & landing pages'
/** Service order of the old seed, per contact type: a service still at it was never reordered by the team. */
const OLD_ORDER: Record<string, number> = { web: 1, ecommerce: 2, 'fivem-script': 3, 'fivem-server': 4, 'discord-bot': 5, maintenance: 6, custom: 7 }
const OLD_TITLES: Record<string, Record<string, string>> = {
  maintenance: { es: 'Mantenimiento web mensual', en: 'Monthly website maintenance', fr: 'Maintenance web mensuelle' },
}

/** Websites first: services still at their old seed position move to the new order; old seed titles are renamed. */
export async function upgradeServiceOrder(payload: Payload) {
  for (const s of services) {
    const found = await payload.find({ collection: 'services', where: { slug: { equals: s.localized.es.slug } }, locale: 'es', limit: 1, depth: 0, draft: true })
    const doc = found.docs[0]
    if (!doc) continue
    if (OLD_ORDER[s.shared.contactType] === doc.order && doc.order !== s.shared.order)
      await payload.update({ collection: 'services', id: doc.id, locale: 'es', data: { order: s.shared.order, _status: 'published' } as never })
    const old = OLD_TITLES[s.shared.contactType]
    if (!old) continue
    for (const locale of locales) {
      const current = await payload.findByID({ collection: 'services', id: doc.id, locale, depth: 0, draft: true })
      if (current.title === old[locale])
        await payload.update({ collection: 'services', id: doc.id, locale, data: { title: s.localized[locale].title, _status: 'published' } as never })
    }
  }
}
const OLD_FAQ_FIRST = '¿Cuánto tarda un proyecto?'
const OLD_FAQ_EXTRA = ['¿Firmáis NDA?', '¿En qué idiomas atendéis?']

export async function upgradeHome(payload: Payload) {
  const current = await payload.findGlobal({ slug: 'home', locale: 'es', depth: 0, draft: true })
  if (current.paths?.newTitle) return payload.logger.info('restructure: home already upgraded')
  for (const locale of locales) {
    const { whyUs: _w, process: _p, ...rest } = homeData(locale)
    await payload.updateGlobal({ slug: 'home', locale, data: { ...rest, _status: 'published' } as never })
  }
  payload.logger.info('restructure: home upgraded (hero, paths, review, guarantees, sections)')
}

/** Terminal-style "// pricing" eyebrows from the old design become plain labels (only when still the old text). */
export async function upgradePricingEyebrow(payload: Payload) {
  const plain = { es: 'Precios', en: 'Pricing', fr: 'Tarifs' } as const
  for (const locale of locales) {
    const doc = await payload.findGlobal({ slug: 'pricing', locale, depth: 0, draft: true })
    if (typeof doc.eyebrow === 'string' && doc.eyebrow.startsWith('//'))
      await payload.updateGlobal({ slug: 'pricing', locale, data: { eyebrow: plain[locale], _status: 'published' } as never })
  }
}

export async function upgradeWebService(payload: Payload) {
  const web = services.find((s) => s.shared.contactType === 'web')
  if (!web) return
  const found = await payload.find({ collection: 'services', where: { slug: { equals: web.localized.es.slug } }, locale: 'es', limit: 1, depth: 0, draft: true })
  const doc = found.docs[0]
  if (!doc || doc.title !== OLD_WEB_TITLE) return
  for (const locale of locales) {
    const { title, promise, summary, features, faq, seo } = web.localized[locale]
    await payload.update({ collection: 'services', id: doc.id, locale, data: { title, promise, summary, features, faq, seo, _status: 'published' } as never })
  }
  payload.logger.info('restructure: web service renamed to the new copy')
}

/** Case-study fields (sector, challenge, solution, results) are written only where they are still empty. */
export async function fillProjectCaseStudies(payload: Payload) {
  for (const p of projects) {
    const found = await payload.find({ collection: 'projects', where: { slug: { equals: p.localized.es.slug } }, locale: 'es', limit: 1, depth: 0, draft: true })
    const id = found.docs[0]?.id
    if (!id) continue
    for (const locale of locales) {
      const doc = await payload.findByID({ collection: 'projects', id, locale, depth: 0, draft: true })
      const l = p.localized[locale]
      const data: Record<string, unknown> = {}
      if (!doc.sector) data.sector = l.sector
      if (!doc.challenge && l.challenge) data.challenge = l.challenge
      if (!doc.solution && l.solution) data.solution = l.solution
      if ((doc.results ?? []).length === 0 && l.results.length > 0) data.results = l.results
      if (Object.keys(data).length > 0) await payload.update({ collection: 'projects', id, locale, data: { ...data, _status: 'published' } as never })
    }
  }
}

export async function upgradeFaqs(payload: Payload) {
  const first = await payload.find({ collection: 'faqs', where: { order: { equals: 1 } }, locale: 'es', limit: 1, depth: 0 })
  if (first.docs[0]?.question !== OLD_FAQ_FIRST) return
  for (const f of faqs) {
    const existing = await payload.find({ collection: 'faqs', where: { order: { equals: f.order } }, locale: 'es', limit: 1, depth: 0 })
    const id = existing.docs[0]?.id ?? (await payload.create({ collection: 'faqs', locale: 'es', data: { order: f.order, ...f.localized.es } as never })).id
    for (const locale of locales) await payload.update({ collection: 'faqs', id, locale, data: f.localized[locale] as never })
  }
  // Old seeded questions beyond the new list (only if they still carry the old seed text).
  const extra = await payload.find({ collection: 'faqs', where: { order: { greater_than: faqs.length } }, locale: 'es', limit: 20, depth: 0 })
  for (const doc of extra.docs) if (OLD_FAQ_EXTRA.includes(doc.question)) await payload.delete({ collection: 'faqs', id: doc.id })
  payload.logger.info('restructure: FAQ replaced with the website-focused questions')
}

/**
 * 2026-11 price copy: a new website is sold as plans (no single "from 349 €" any more) and a redesign starts at
 * 490 € + VAT. Text is replaced only where it is still the previous seed text; the redesign price only while it
 * is still the old "custom" placeholder.
 */
const OLD_PRICE_COPY = {
  webSeo: {
    es: 'Webs y landing pages a medida, rápidas y preparadas para Google. Desde 349 € + IVA, listas en 1-2 semanas.',
    en: 'Custom websites and landing pages, fast and ready for Google. From €349 + VAT, ready in 1-2 weeks.',
    fr: 'Sites et landing pages sur mesure, rapides et prêts pour Google. À partir de 349 € + TVA, prêts en 1 à 2 semaines.',
  },
  redesignNote: {
    es: 'Presupuesto cerrado tras la revisión gratuita, sin compromiso.',
    en: 'Fixed quote after the free review, no commitment.',
    fr: "Devis fixe après l'audit gratuit, sans engagement.",
  },
  redesignSeo: {
    es: 'Renovamos tu web: diseño actual, carga rápida, adaptada al móvil y visible en Google. Revisión gratuita en 48 h y presupuesto cerrado.',
    en: 'We renew your website: modern design, fast loading, mobile-ready and visible on Google. Free review in 48 h and a fixed quote.',
    fr: 'Nous rénovons votre site : design actuel, chargement rapide, adapté au mobile et visible sur Google. Audit gratuit sous 48 h et devis fixe.',
  },
  newPrice: { es: 'Desde 349 € + IVA · 1-2 semanas', en: 'From €349 + VAT · 1-2 weeks', fr: 'À partir de 349 € + TVA · 1 à 2 semaines' },
  redesignPrice: { es: 'Presupuesto cerrado tras la revisión gratuita', en: 'Fixed quote after the free review', fr: "Devis fixe après l'audit gratuit" },
} as const

export async function upgradePriceCopy(payload: Payload) {
  for (const type of ['web', 'redesign'] as const) {
    const seed = services.find((s) => s.shared.contactType === type)
    if (!seed) continue
    const found = await payload.find({ collection: 'services', where: { contactType: { equals: type } }, locale: 'es', limit: 1, depth: 0, draft: true })
    const doc = found.docs[0]
    if (!doc) continue
    if (type === 'redesign' && doc.pricing?.mode === 'custom' && doc.pricing.amount == null)
      await payload.update({ collection: 'services', id: doc.id, locale: 'es', data: { pricing: seed.shared.pricing, _status: 'published' } as never })
    for (const locale of locales) {
      const current = await payload.findByID({ collection: 'services', id: doc.id, locale, depth: 0, draft: true })
      const l = seed.localized[locale]
      const data: Record<string, unknown> = {}
      const oldSeo = type === 'web' ? OLD_PRICE_COPY.webSeo : OLD_PRICE_COPY.redesignSeo
      if (current.seo?.description === oldSeo[locale]) data.seo = { ...current.seo, description: l.seo.description }
      if (type === 'redesign' && current.note === OLD_PRICE_COPY.redesignNote[locale]) data.note = l.note
      if (Object.keys(data).length > 0) await payload.update({ collection: 'services', id: doc.id, locale, data: { ...data, _status: 'published' } as never })
    }
  }
  for (const locale of locales) {
    const home = await payload.findGlobal({ slug: 'home', locale, depth: 0, draft: true })
    const paths = home.paths
    if (!paths) continue
    const next = homeData(locale).paths
    const data: Record<string, unknown> = {}
    if (paths.newPrice === OLD_PRICE_COPY.newPrice[locale]) data.newPrice = next.newPrice
    if (paths.redesignPrice === OLD_PRICE_COPY.redesignPrice[locale]) data.redesignPrice = next.redesignPrice
    if (Object.keys(data).length > 0)
      await payload.updateGlobal({ slug: 'home', locale, data: { paths: { ...paths, ...data }, _status: 'published' } as never })
  }
}
