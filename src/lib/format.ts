import type { ProjectType } from '@/features/contact/options'
import type { Locale } from '@/i18n/locales'

type Pricing = { mode: 'one-off' | 'monthly' | 'custom' | 'store'; amount?: number | null; storeUrl?: string | null }
type Labels = { from: string; perMonth: string; custom: string; seeStore: string }

const intlLocale: Record<Locale, string> = { es: 'es-ES', en: 'en-IE', fr: 'fr-FR' }

export function formatPrice(pricing: Pricing, locale: Locale, labels: Labels): string {
  if (pricing.mode === 'store') return labels.seeStore
  if ((pricing.mode !== 'one-off' && pricing.mode !== 'monthly') || pricing.amount == null) return labels.custom
  const money = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : intlLocale[locale], {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
    .format(pricing.amount)
    .replace(/[  ]/g, ' ')
  return `${labels.from} ${money}${pricing.mode === 'monthly' ? labels.perMonth : ''}`
}

export function contactHref(type?: ProjectType) {
  return type ? { pathname: '/contact' as const, query: { type } } : { pathname: '/contact' as const }
}
