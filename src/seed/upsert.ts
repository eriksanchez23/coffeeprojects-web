import type { CollectionSlug, GlobalSlug, Payload } from 'payload'
import { type Locale, locales } from '@/i18n/locales'
import type { Localized } from './types'

type Match = { field: string; value: string | number }

export const seedOverwrite = () => process.env.SEED_OVERWRITE === '1'

/** Seed writes only when nothing exists yet, unless overwrite is requested. */
export const shouldWrite = (existing: boolean, overwrite: boolean) => !existing || overwrite

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
  if (!shouldWrite(Boolean(id), seedOverwrite())) {
    payload.logger.info(`skip existing ${collection} ${match.field}=${match.value}`)
    return id as string | number
  }
  const esData = { ...shared, ...localized.es, ...status }

  if (id) await payload.update({ collection, id, locale: 'es', data: esData as never })
  else id = (await payload.create({ collection, locale: 'es', data: esData as never })).id

  for (const locale of locales.filter((l): l is Exclude<Locale, 'es'> => l !== 'es')) {
    await payload.update({
      collection,
      id,
      locale,
      data: { ...localized[locale], ...status } as never,
    })
  }
  return id
}

export async function upsertGlobal(
  payload: Payload,
  slug: GlobalSlug,
  shared: Record<string, unknown>,
  localized: Localized<Record<string, unknown>>,
  opts: { drafts: boolean; isSeeded: (doc: Record<string, unknown>) => boolean },
): Promise<void> {
  const current = (await payload.findGlobal({ slug, locale: 'es', depth: 0 })) as unknown as Record<
    string,
    unknown
  >
  if (!shouldWrite(opts.isSeeded(current), seedOverwrite())) {
    payload.logger.info(`skip seeded global ${slug}`)
    return
  }
  const status = opts.drafts ? { _status: 'published' } : {}
  await payload.updateGlobal({
    slug,
    locale: 'es',
    data: { ...shared, ...localized.es, ...status } as never,
  })
  for (const locale of locales.filter((l) => l !== 'es')) {
    await payload.updateGlobal({ slug, locale, data: { ...localized[locale], ...status } as never })
  }
}
