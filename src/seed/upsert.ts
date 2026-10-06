import type { CollectionSlug, GlobalSlug, Payload } from 'payload'
import { type Locale, locales } from '@/i18n/locales'
import type { Localized } from './types'

type Match = { field: string; value: string | number }

export async function upsertLocalized(
  payload: Payload,
  collection: CollectionSlug,
  match: Match,
  shared: Record<string, unknown>,
  localized: Localized<Record<string, unknown>>,
  opts: { drafts: boolean },
): Promise<string | number> {
  const status = opts.drafts ? { _status: 'published' } : {}
  const found = await payload.find({
    collection,
    where: { [match.field]: { equals: match.value } },
    locale: 'es',
    limit: 1,
    depth: 0,
    draft: opts.drafts,
  })
  let id = found.docs[0]?.id
  const esData = { ...shared, ...localized.es, ...status }

  if (id) await payload.update({ collection, id, locale: 'es', data: esData as never })
  else id = (await payload.create({ collection, locale: 'es', data: esData as never })).id

  for (const locale of locales.filter((l): l is Exclude<Locale, 'es'> => l !== 'es')) {
    await payload.update({ collection, id, locale, data: { ...localized[locale], ...status } as never })
  }
  return id
}

export async function upsertGlobal(
  payload: Payload,
  slug: GlobalSlug,
  shared: Record<string, unknown>,
  localized: Localized<Record<string, unknown>>,
  opts: { drafts: boolean },
): Promise<void> {
  const status = opts.drafts ? { _status: 'published' } : {}
  await payload.updateGlobal({ slug, locale: 'es', data: { ...shared, ...localized.es, ...status } as never })
  for (const locale of locales.filter((l) => l !== 'es')) {
    await payload.updateGlobal({ slug, locale, data: { ...localized[locale], ...status } as never })
  }
}
