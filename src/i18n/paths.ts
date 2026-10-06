import { type Locale, locales } from './locales'
import { getPathname } from './navigation'
import type { AppPathname } from './routing'

export function localizedPaths(pathname: AppPathname, slugs?: Record<Locale, string>): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => {
      const href = slugs ? { pathname, params: { slug: slugs[locale] } } : pathname
      // next-intl types require a literal pathname/params pair; the runtime accepts this shape.
      return [locale, getPathname({ locale, href: href as never })]
    }),
  ) as Record<Locale, string>
}
