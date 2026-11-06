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
/** Maintenance chosen with a web plan: a monthly plan (the web then costs its "with maintenance" price) or none. */
export type QuoteMaintenance = { name: string; monthly: QuotePrice } | 'none'
export type Quote = {
  plan?: { name: string; withMaintenance: QuotePrice; webOnly: QuotePrice; maintenance?: QuoteMaintenance }
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
export type QuoteMaintenancePlan = { name: string; monthlyPrice: number }

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
  maintenance: string
  noMaintenance: string
  webPrice: string
}
export type QuoteLine = { label: string; value: string }

const LABEL_KEYS = ['plan', 'price', 'withMaintenance', 'webOnly', 'time', 'from', 'perMonth', 'custom', 'vat', 'maintenance', 'noMaintenance', 'webPrice'] as const

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

/**
 * `maintenance`: the visitor's choice for the web plan (`'none'` = web only); omitted when not chosen yet, in
 * which case both web prices are shown. Ignored without a plan.
 */
export function buildQuote({
  type,
  plan,
  maintenance,
  services,
}: {
  type: string
  plan?: QuotePlan
  maintenance?: QuoteMaintenancePlan | 'none'
  services: readonly QuoteService[]
}): Quote {
  const service = serviceForType(type, services)
  const time = service?.typicalTime?.trim() || undefined
  const quote: Quote = plan
    ? {
        plan: {
          name: plan.name,
          withMaintenance: { amount: withVat(plan.priceWithMaintenance), from: Boolean(plan.fromPrice), monthly: false },
          webOnly: { amount: withVat(plan.priceWebOnly), from: Boolean(plan.fromPrice), monthly: false },
          ...(maintenance && {
            maintenance:
              maintenance === 'none'
                ? ('none' as const)
                : { name: maintenance.name, monthly: { amount: withVat(maintenance.monthlyPrice), from: false, monthly: true } },
          }),
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
  const plan = quote.plan
  const m = plan?.maintenance
  const lines: QuoteLine[] = !plan
    ? [{ label: labels.price, value: formatPrice(quote.price ?? null, locale, labels) }]
    : !m
      ? [
          { label: labels.plan, value: plan.name },
          { label: labels.withMaintenance, value: formatPrice(plan.withMaintenance, locale, labels) },
          { label: labels.webOnly, value: formatPrice(plan.webOnly, locale, labels) },
        ]
      : [
          { label: labels.plan, value: plan.name },
          { label: labels.maintenance, value: m === 'none' ? labels.noMaintenance : `${m.name} · ${formatPrice(m.monthly, locale, labels)}` },
          { label: labels.webPrice, value: formatPrice(m === 'none' ? plan.webOnly : plan.withMaintenance, locale, labels) },
        ]
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

type SummaryPricing = {
  packages?: (QuotePlan & { slug: string; minPlan?: string | null })[] | null
  maintenancePlans?: { slug: string; name: string; monthlyPrice?: number | null }[] | null
}

/**
 * The summary stored on a lead, rebuilt from the CMS (never from the client): the project type's service, and for a
 * web plan the maintenance choice, accepted only when valid for that plan (otherwise both web prices are listed).
 */
export function leadQuoteSummary(
  input: { projectType: string; plan?: string; maintenance?: string; locale: Locale },
  { services, pricing, labels, resolveMaintenance }: {
    services: readonly QuoteService[]
    pricing: SummaryPricing
    labels: QuoteLabels
    resolveMaintenance: (value: unknown, minPlan: string | null | undefined, plans: { slug: string; name: string; monthlyPrice: number }[]) => { name: string; monthlyPrice: number } | 'none' | undefined
  },
): string {
  const plan = input.plan ? (pricing.packages ?? []).find((p) => p.slug === input.plan) : undefined
  const maintenancePlans = (pricing.maintenancePlans ?? []).filter((m): m is { slug: string; name: string; monthlyPrice: number } => isAmount(m.monthlyPrice))
  const maintenance = plan ? resolveMaintenance(input.maintenance, plan.minPlan, maintenancePlans) : undefined
  return quoteSummaryText(buildQuote({ type: input.projectType, plan, maintenance, services }), input.locale, labels)
}
