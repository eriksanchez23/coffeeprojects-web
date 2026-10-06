import type { Locale } from '@/i18n/locales'

export type Localized<T> = Record<Locale, T>
export type SeedDoc<S, L> = { shared: S; localized: Localized<L> }
