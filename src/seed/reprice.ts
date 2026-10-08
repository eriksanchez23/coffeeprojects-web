type ServicePricing = { mode?: string | null; amount?: number | null } | null | undefined

/**
 * Amounts the seed wrote before the v4 price sheet (T08 and T19/S14), per service contact type.
 * A service still showing one of them was never re-priced by the team, so the seed may update it.
 */
const PREVIOUS_AMOUNTS: Record<string, readonly number[]> = {
  web: [600, 300],
  ecommerce: [2500],
  maintenance: [35, 20],
}

/** True when an existing service should take the seed's new price (and its price-bearing texts). */
export function needsReprice(contactType: string, current: ServicePricing, target: ServicePricing): boolean {
  const previous = PREVIOUS_AMOUNTS[contactType]
  if (!previous || !current || !target || current.mode !== target.mode) return false
  if (current.amount == null || current.amount === target.amount) return false
  return previous.includes(current.amount)
}
