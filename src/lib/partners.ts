import type { Locale } from '@/i18n/locales'
import { formatEuro, formatPercent } from './format'
import { completeWebPlans } from './pricing'

/**
 * Pure helpers for the partner programme page (S16, docs/sources/comisiones-colaboradores.txt): a commission
 * is a percentage of the VAT-excluded web price, higher when the client also hires a maintenance plan.
 * Prices come from the Pricing global, rates from the Partners global, so the table never goes stale.
 */

export type CommissionRates = { withMaintenance: number; webOnly: number }

type WebPlan = {
  id?: string | null
  slug: string
  name: string
  fromPrice?: boolean | null
  priceWithMaintenance?: number | null
  priceWebOnly?: number | null
}

export type CommissionRow = {
  key: string
  name: string
  /** "desde" plans: the final price (and so the commission) is set after the meeting with the client. */
  fromPrice: boolean
  withMaintenance: { price: number; commission: number }
  webOnly: { price: number; commission: number }
}

/** `rate` % of `price`, in euros rounded to the cent (computed in cents to avoid float drift). */
export function commissionAmount(price: number, rate: number): number {
  return Math.round(price * rate) / 100
}

/** One row per web plan that has both prices, in the Pricing global's order. */
export function commissionRows(plans: readonly WebPlan[] | null | undefined, rates: CommissionRates): CommissionRow[] {
  return completeWebPlans(plans).map((p) => {
    const withMaintenance = p.priceWithMaintenance as number
    const webOnly = p.priceWebOnly as number
    return {
      key: p.id ?? p.slug,
      name: p.name,
      fromPrice: Boolean(p.fromPrice),
      withMaintenance: { price: withMaintenance, commission: commissionAmount(withMaintenance, rates.withMaintenance) },
      webOnly: { price: webOnly, commission: commissionAmount(webOnly, rates.webOnly) },
    }
  })
}

export const formatCommission = (amount: number, locale: Locale) => formatEuro(amount, locale, { cents: true })
export const formatRate = (rate: number, locale: Locale) => formatPercent(rate, locale)

/** How much cheaper the web gets with a maintenance plan, across the plans (the partners' key sales argument). */
export function savingsRange(plans: readonly WebPlan[] | null | undefined): { min: number; max: number } | undefined {
  const diffs = completeWebPlans(plans).map((p) => (p.priceWebOnly as number) - (p.priceWithMaintenance as number))
  if (diffs.length === 0) return undefined
  return { min: Math.min(...diffs), max: Math.max(...diffs) }
}

/** Replaces `{name}` placeholders that have a value; unknown ones stay visible so an editor notices them. */
export function fillTemplate(text: string | null | undefined, vars: Record<string, string>): string {
  return (text ?? '').replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match)
}

/**
 * "Register a client" e-mail link: subject and an empty form (client name, business, phone) for the partner
 * to fill in their mail app. Only static template text travels in the URL, never personal data (R21).
 */
export function registerMailto(email: string, subject?: string | null, body?: string | null): string {
  const params = [
    subject?.trim() ? `subject=${encodeURIComponent(subject.trim())}` : '',
    body?.trim() ? `body=${encodeURIComponent(body.trim().replace(/\r?\n/g, '\r\n'))}` : '',
  ].filter(Boolean)
  return `mailto:${email}${params.length > 0 ? `?${params.join('&')}` : ''}`
}
