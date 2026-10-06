import type { ProjectType } from '@/features/contact/options'
import type { Locale } from '@/i18n/locales'

type Pricing = { mode: 'one-off' | 'monthly' | 'custom' | 'store'; amount?: number | null; storeUrl?: string | null }
type Labels = { from: string; perMonth: string; custom: string; seeStore: string }
export type PriceParts = { prefix?: string; figure: string }

const intlLocale: Record<Locale, string> = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR' }

/** Structured price: `prefix` ("From") exists only when there is a numeric amount to qualify. */
export function formatPriceParts(pricing: Pricing, locale: Locale, labels: Labels): PriceParts {
  if (pricing.mode === 'store') return { figure: labels.seeStore }
  if ((pricing.mode !== 'one-off' && pricing.mode !== 'monthly') || pricing.amount == null) return { figure: labels.custom }
  const money = new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
    .format(pricing.amount)
    // Keep a non-breaking space so "2 500 €" never wraps; narrow NBSP (fr grouping) becomes a plain NBSP.
    .replace(/ /g, ' ')
  return { prefix: labels.from, figure: `${money}${pricing.mode === 'monthly' ? labels.perMonth : ''}` }
}

export function formatPrice(pricing: Pricing, locale: Locale, labels: Labels): string {
  const { prefix, figure } = formatPriceParts(pricing, locale, labels)
  return prefix ? `${prefix} ${figure}` : figure
}

export function contactHref(type?: ProjectType) {
  return type ? { pathname: '/contact' as const, query: { type } } : { pathname: '/contact' as const }
}
