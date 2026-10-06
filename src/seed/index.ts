import config from '@payload-config'
import { getPayload } from 'payload'
import { locales } from '@/i18n/locales'
import { faqs } from './data/faqs'
import { home, homeData } from './data/home'
import { legal } from './data/legal'
import { projects } from './data/projects'
import { services } from './data/services'
import { settings } from './data/settings'
import { team } from './data/team'
import { upsertGlobal, upsertLocalized } from './upsert'

const payload = await getPayload({ config })

for (const s of services) {
  await upsertLocalized(payload, 'services', { field: 'slug', value: s.localized.es.slug }, s.shared, s.localized, { drafts: true })
}
for (const m of team) {
  await upsertLocalized(payload, 'team-members', { field: 'slug', value: m.localized.es.slug }, m.shared, m.localized, { drafts: true })
}
for (const p of projects) {
  await upsertLocalized(payload, 'projects', { field: 'slug', value: p.localized.es.slug }, p.shared, p.localized, { drafts: true })
}
for (const f of faqs) {
  await upsertLocalized(payload, 'faqs', { field: 'order', value: f.order }, { order: f.order }, f.localized, { drafts: false })
}

await upsertGlobal(payload, 'site-settings', settings.shared, settings.localized, { drafts: false })
await upsertGlobal(payload, 'legal', { companyComplete: false }, legal, { drafts: false })

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
      stats: home.shared.stats.map((s, i) => ({ ...s, id: rowIds[i], label: home.localized[locale].statLabels[i] })),
      _status: 'published',
    } as never,
  })
}

payload.logger.info('Seed complete')
process.exit(0)
