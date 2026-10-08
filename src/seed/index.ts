import config from '@payload-config'
import { getPayload } from 'payload'
import { locales } from '@/i18n/locales'
import { faqs } from './data/faqs'
import { home, homeData } from './data/home'
import { legal } from './data/legal'
import { partners } from './data/partners'
import { pricing, pricingData } from './data/pricing'
import { projects } from './data/projects'
import { services } from './data/services'
import { settings } from './data/settings'
import { team } from './data/team'
import { needsReprice } from './reprice'
import { seedOverwrite, shouldWrite, upsertGlobal, upsertLocalized } from './upsert'

async function run() {
  const payload = await getPayload({ config })

  for (const s of services) {
    await upsertLocalized(
      payload,
      'services',
      { field: 'slug', value: s.localized.es.slug },
      s.shared,
      s.localized,
      { drafts: true },
    )
  }
  for (const m of team) {
    await upsertLocalized(
      payload,
      'team-members',
      { field: 'slug', value: m.localized.es.slug },
      m.shared,
      m.localized,
      { drafts: true },
    )
  }
  for (const p of projects) {
    await upsertLocalized(
      payload,
      'projects',
      { field: 'slug', value: p.localized.es.slug },
      p.shared,
      p.localized,
      { drafts: true },
    )
  }
  for (const f of faqs) {
    await upsertLocalized(
      payload,
      'faqs',
      { field: 'order', value: f.order },
      { order: f.order },
      f.localized,
      { drafts: false },
    )
  }

  await upsertGlobal(payload, 'site-settings', settings.shared, settings.localized, {
    drafts: false,
    isSeeded: (d) => Boolean(d.tagline),
  })
  await upsertGlobal(payload, 'legal', { companyComplete: false }, legal, {
    drafts: false,
    isSeeded: (d) => Boolean(d.legalNotice),
  })

  const currentHome = await payload.findGlobal({ slug: 'home', locale: 'es', depth: 0 })
  if (shouldWrite(Boolean(currentHome.hero?.headline), seedOverwrite())) {
    // Home: write ES with stats rows, read back row ids, then write EN/FR labels onto the same rows.
    await payload.updateGlobal({
      slug: 'home',
      locale: 'es',
      data: {
        ...homeData('es'),
        stack: home.shared.stack,
        stats: home.shared.stats.map((s, i) => ({ ...s, label: home.localized.es.statLabels[i] })),
        _status: 'published',
      } as never,
    })
    const saved = await payload.findGlobal({ slug: 'home', locale: 'es', draft: true })
    const rowIds = (saved.stats ?? []).map((r) => r.id)
    for (const locale of locales.filter((l) => l !== 'es')) {
      await payload.updateGlobal({
        slug: 'home',
        locale,
        data: {
          ...homeData(locale),
          stats: home.shared.stats.map((s, i) => ({
            ...s,
            id: rowIds[i],
            label: home.localized[locale].statLabels[i],
          })),
          _status: 'published',
        } as never,
      })
    }
  } else payload.logger.info('skip seeded global home')

  const currentPricing = await payload.findGlobal({ slug: 'pricing', locale: 'es', depth: 0 })
  // v4 (S15) is seeded once it has maintenance plans: a DB holding only the S14 packages gets the new sheet.
  if (shouldWrite((currentPricing.maintenancePlans ?? []).length > 0, seedOverwrite())) {
    // Same pattern as Home: ES first, then EN/FR onto the saved rows so prices stay shared across locales.
    await payload.updateGlobal({ slug: 'pricing', locale: 'es', data: { ...pricingData('es'), _status: 'published' } as never })
    const saved = await payload.findGlobal({ slug: 'pricing', locale: 'es', draft: true })
    const ids = {
      packages: (saved.packages ?? []).map((r) => r.id),
      maintenancePlans: (saved.maintenancePlans ?? []).map((r) => r.id),
      extras: (saved.extras?.rows ?? []).map((r) => r.id),
    }
    if (
      ids.packages.length !== pricing.shared.packages.length ||
      ids.maintenancePlans.length !== pricing.shared.maintenancePlans.length ||
      ids.extras.length !== pricing.shared.extras.length
    )
      throw new Error('pricing seed: plan rows were not saved')
    for (const locale of locales.filter((l) => l !== 'es')) {
      await payload.updateGlobal({ slug: 'pricing', locale, data: { ...pricingData(locale, ids), _status: 'published' } as never })
    }
  } else payload.logger.info('skip seeded global pricing')

  // Partner programme (S16): written once; panel edits are never overwritten (rates shared, texts per locale).
  await upsertGlobal(payload, 'partners', partners.shared, partners.localized, {
    drafts: true,
    isSeeded: (d) => Boolean(d.title),
  })

  // Services seeded before v4 keep their old prices (the seed never overwrites): re-price only those
  // still at a previous price-sheet amount, with the texts that quote the price.
  for (const s of services) {
    const found = await payload.find({
      collection: 'services',
      where: { slug: { equals: s.localized.es.slug } },
      locale: 'es',
      limit: 1,
      depth: 0,
      draft: true,
    })
    const doc = found.docs[0]
    if (!doc || !needsReprice(s.shared.contactType, doc.pricing, s.shared.pricing)) continue
    for (const locale of locales) {
      const { note, typicalTime, seo } = s.localized[locale]
      await payload.update({
        collection: 'services',
        id: doc.id,
        locale,
        data: { ...(locale === 'es' ? { pricing: s.shared.pricing } : {}), note, typicalTime, seo, _status: 'published' } as never,
      })
    }
    payload.logger.info(`re-priced service ${s.localized.es.slug}`)
  }

  payload.logger.info('Seed complete')
}

// Top-level await keeps  alive until seeding finishes.
try {
  await run()
  process.exit(0)
} catch (err) {
  console.error('Seed failed:', err)
  process.exit(1)
}
