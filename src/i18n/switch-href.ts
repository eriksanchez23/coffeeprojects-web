import { buildPath } from './build-path'
import { locales } from './locales'

/** The thank-you page in every locale: its `?e=` is a one-off proof of submission, never carried to another language. */
const thanksPaths: ReadonlySet<string> = new Set(
  locales.map((l) => buildPath('/contact/thanks', l)),
)

/**
 * Where a language-switcher link goes: the same page in the other language (`base`), keeping the visitor's query
 * string (preselected project type, plan, website…) and hash (e.g. a plan card on the pricing page). Query values are
 * codes and slugs shared by every locale, so they stay valid after the switch.
 */
export function switchHref(
  base: string,
  { pathname, search, hash }: { pathname: string; search: string; hash: string },
): string {
  if (thanksPaths.has(pathname.replace(/\/$/, '') || '/')) return base
  const clean = base.replace(/[?#].*$/, '')
  return `${clean}${search === '?' ? '' : search}${hash === '#' ? '' : hash}`
}
