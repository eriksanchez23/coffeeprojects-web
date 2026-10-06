import { type Locale, locales } from '@/i18n/locales'

export function toLocaleSlugs(value: unknown): Record<Locale, string> {
  if (typeof value === 'string') return Object.fromEntries(locales.map((l) => [l, value])) as Record<Locale, string>
  const map = (value ?? {}) as Partial<Record<Locale, string | null>>
  const es = map.es
  if (!es) throw new Error('missing es slug')
  return Object.fromEntries(locales.map((l) => [l, map[l] || es])) as Record<Locale, string>
}

export type SlugEntry = { slugs: Record<Locale, string>; updatedAt: string }

/**
 * Maps `locale: 'all'` docs to their per-locale slugs. Docs without a usable ES slug are skipped (not thrown),
 * so one bad document never takes down the sitemap or static params; their ids are returned for a single log line.
 */
export function toSlugEntries(docs: { id: number | string; slug?: unknown; updatedAt?: string | null }[]): {
  entries: SlugEntry[]
  skippedIds: (number | string)[]
} {
  const entries: SlugEntry[] = []
  const skippedIds: (number | string)[] = []
  for (const doc of docs) {
    try {
      entries.push({ slugs: toLocaleSlugs(doc.slug), updatedAt: doc.updatedAt ?? '' })
    } catch {
      skippedIds.push(doc.id)
    }
  }
  return { entries, skippedIds }
}
