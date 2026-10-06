import { type Locale, locales } from '@/i18n/locales'

export function toLocaleSlugs(value: unknown): Record<Locale, string> {
  if (typeof value === 'string') return Object.fromEntries(locales.map((l) => [l, value])) as Record<Locale, string>
  const map = (value ?? {}) as Partial<Record<Locale, string | null>>
  const es = map.es
  if (!es) throw new Error('missing es slug')
  return Object.fromEntries(locales.map((l) => [l, map[l] || es])) as Record<Locale, string>
}
