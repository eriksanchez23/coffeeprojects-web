export const locales = ['es', 'en', 'fr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'
export const localeLabels: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' }
export const ogLocales: Record<Locale, string> = { es: 'es_ES', en: 'en_US', fr: 'fr_FR' }
