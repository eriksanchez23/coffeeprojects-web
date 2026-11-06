import type { Locale } from '@/i18n/locales'
import { formatEuro } from './format'

/**
 * Pure helpers for the v4 pricing model (S15): web plans priced "with maintenance" / "web only",
 * optional maintenance plans, and the extras table. Shared by the Pricing global, the pages and the seed.
 */

type Slugged = { slug: string }
type WebPlanPrices = { priceWithMaintenance?: number | null; priceWebOnly?: number | null }
type MaintenancePrices = { monthlyPrice?: number | null; permanenceMonths?: number | null }

const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** The maintenance plan whose subscription unlocks a web plan's reduced price. */
export function findMinPlan<T extends Slugged>(slug: string | null | undefined, plans: readonly T[]): T | undefined {
  return slug ? plans.find((p) => p.slug === slug) : undefined
}

/**
 * Maintenance plans that unlock a web plan's reduced price: its minimum plan and every plan listed after it
 * (the pricing global lists them from basic to complete). Without a minimum plan, all of them.
 */
export function allowedMaintenance<T extends Slugged>(minPlan: string | null | undefined, plans: readonly T[]): T[] {
  const from = minPlan ? plans.findIndex((p) => p.slug === minPlan) : 0
  return from < 0 ? [...plans] : plans.slice(from)
}

/** Web plans that can be shown: both prices present (rows left by an older schema have none). */
export function completeWebPlans<T extends WebPlanPrices>(plans: readonly T[] | null | undefined): T[] {
  return (plans ?? []).filter((p) => isAmount(p.priceWithMaintenance) && isAmount(p.priceWebOnly))
}

/** Maintenance plans that can be shown: monthly fee and permanence present. */
export function completeMaintenancePlans<T extends MaintenancePrices>(plans: readonly T[] | null | undefined): T[] {
  return (plans ?? []).filter((p) => isAmount(p.monthlyPrice) && isAmount(p.permanenceMonths))
}

/** First slug used twice in an array field, if any. */
export function duplicateSlug(rows: unknown): string | undefined {
  const seen = new Set<string>()
  for (const row of Array.isArray(rows) ? rows : []) {
    const slug = (row as { slug?: unknown } | null)?.slug
    if (typeof slug !== 'string') continue
    if (seen.has(slug)) return slug
    seen.add(slug)
  }
  return undefined
}

/**
 * Payload validation for a web plan's minimum maintenance plan: empty, or the slug of a maintenance plan
 * in the same document. When the submitted data carries no maintenance plans, the save is not blocked.
 */
export function validateMinPlan(value: unknown, data: unknown): true | string {
  if (value == null || value === '') return true
  const plans = (data as { maintenancePlans?: unknown } | null | undefined)?.maintenancePlans
  if (!Array.isArray(plans) || plans.length === 0) return true
  const slugs = plans.map((p) => (p as { slug?: unknown } | null)?.slug)
  return slugs.includes(value) || `"${String(value)}" is not a maintenance plan slug (${slugs.join(', ')})`
}

/** One cell of the extras table: a price when there is an amount, otherwise its text ("Incluida", "Presupuesto"). */
export function extraCell(amount: number | null | undefined, text: string | null | undefined, locale: Locale): string {
  if (isAmount(amount)) return formatEuro(amount, locale)
  return text?.trim() || '—'
}
