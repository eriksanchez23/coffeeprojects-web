import type { Locale } from '@/i18n/locales'
import { formatEuro } from '@/lib/format'

/**
 * Read-only quote the contact form shows instead of asking for a budget and a timeline (S17): the final price
 * WITH Spanish VAT and the estimated time (the `typicalTime` of the service matching the project type).
 * Shared by the contact page (one quote per project type, picked client-side) and the Server Action, which
 * rebuilds the same text from the CMS to store it on the lead: the client never decides what gets stored.
 */

/** Spanish VAT (IVA general). Every price in the CMS is VAT-excluded. */
export const VAT_RATE = 0.21

/** A price with VAT; `null` when the service has no numeric price (custom quote, external store). */
export type QuotePrice = { amount: number; from: boolean; monthly: boolean } | null
export type Quote = {
  plan?: { name: string; withMaintenance: QuotePrice; webOnly: QuotePrice }
  /** Only without a plan: the matching service's "from" price. */
  price?: QuotePrice
  time?: string
}

export type QuoteService = {
  contactType?: string | null
  typicalTime?: string | null
  pricing?: { mode?: string | null; amount?: number | null } | null
}
export type QuotePlan = { name: string; priceWithMaintenance: number; priceWebOnly: number; fromPrice?: boolean | null }

/** Message templates (`contact.quote` in messages/*.json); `{price}` is replaced in `from` and `perMonth`. */
export type QuoteLabels = {
  plan: string
  price: string
  withMaintenance: string
  webOnly: string
  time: string
  from: string
  perMonth: string
  custom: string
  vat: string
}
export type QuoteLine = { label: string; value: string }

const LABEL_KEYS = ['plan', 'price', 'withMaintenance', 'webOnly', 'time', 'from', 'perMonth', 'custom', 'vat'] as const

/**
 * Labels from next-intl's `t` for the `contact` namespace. Messages are precompiled at build time, so `t.raw`
 * does not return strings: the templates are rebuilt by passing the `{price}` placeholder as the value.
 */
export function quoteLabelsFrom(t: (key: `quote.${(typeof LABEL_KEYS)[number]}`, values?: { price: string }) => string): QuoteLabels {
  return Object.fromEntries(LABEL_KEYS.map((k) => [k, t(`quote.${k}`, { price: '{price}' })])) as QuoteLabels
}

const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Amount with VAT, rounded to cents. */
export function withVat(amount: number): number {
  return Math.round(amount * (1 + VAT_RATE) * 100) / 100
}

/** The service whose contact type is the selected project type (Services → "Contact type"). */
export function serviceForType<T extends { contactType?: string | null }>(type: string, services: readonly T[]): T | undefined {
  return services.find((s) => s.contactType === type)
}

function servicePrice(service: QuoteService | undefined): QuotePrice {
  const mode = service?.pricing?.mode
  const amount = service?.pricing?.amount
  if ((mode !== 'one-off' && mode !== 'monthly') || !isAmount(amount)) return null
  return { amount: withVat(amount), from: true, monthly: mode === 'monthly' }
}

export function buildQuote({ type, plan, services }: { type: string; plan?: QuotePlan; services: readonly QuoteService[] }): Quote {
  const service = serviceForType(type, services)
  const time = service?.typicalTime?.trim() || undefined
  const quote: Quote = plan
    ? {
        plan: {
          name: plan.name,
          withMaintenance: { amount: withVat(plan.priceWithMaintenance), from: Boolean(plan.fromPrice), monthly: false },
          webOnly: { amount: withVat(plan.priceWebOnly), from: Boolean(plan.fromPrice), monthly: false },
        },
      }
    : { price: servicePrice(service) }
  return time ? { ...quote, time } : quote
}

function formatPrice(price: QuotePrice, locale: Locale, labels: QuoteLabels): string {
  if (!price) return labels.custom
  let text = formatEuro(price.amount, locale, { cents: !Number.isInteger(price.amount) })
  if (price.monthly) text = labels.perMonth.replace('{price}', text)
  return price.from ? labels.from.replace('{price}', text) : text
}

/** Label/value rows shown in the form summary. */
export function quoteLines(quote: Quote, locale: Locale, labels: QuoteLabels): QuoteLine[] {
  const lines: QuoteLine[] = quote.plan
    ? [
        { label: labels.plan, value: quote.plan.name },
        { label: labels.withMaintenance, value: formatPrice(quote.plan.withMaintenance, locale, labels) },
        { label: labels.webOnly, value: formatPrice(quote.plan.webOnly, locale, labels) },
      ]
    : [{ label: labels.price, value: formatPrice(quote.price ?? null, locale, labels) }]
  if (quote.time) lines.push({ label: labels.time, value: quote.time })
  return lines
}

/** One-line version stored on the lead and sent to the team, in the visitor's language. */
export function quoteSummaryText(quote: Quote, locale: Locale, labels: QuoteLabels): string {
  const body = quoteLines(quote, locale, labels)
    .map((l) => `${l.label}: ${l.value}`)
    .join(' · ')
  // Plain spaces: the stored text is read in the admin and in emails, where NBSPs only get in the way.
  return `${body} (${labels.vat})`.replace(/[  ]/g, ' ')
}
