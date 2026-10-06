/** Pricing package slugs: lowercase words joined by dashes. Shared by the CMS validation and the contact flow. */
export const PLAN_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const PLAN_MAX = 40

/** A well-formed slug, or undefined. Malformed input is dropped silently: `plan` is never worth failing a lead for. */
export function parsePlan(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const slug = value.trim()
  return slug.length <= PLAN_MAX && PLAN_SLUG.test(slug) ? slug : undefined
}

/** The plan only if it is a package currently published in the pricing global. */
export function resolvePlan(value: unknown, known: readonly string[]): string | undefined {
  const slug = parsePlan(value)
  return slug && known.includes(slug) ? slug : undefined
}
