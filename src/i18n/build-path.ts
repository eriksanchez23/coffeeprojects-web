import { defaultLocale, type Locale } from './locales'
import { type AppPathname, routing } from './routing'

export function buildPath(pathname: AppPathname, locale: Locale, slug?: string): string {
  const entry = routing.pathnames[pathname]
  const template = typeof entry === 'string' ? entry : entry[locale]
  if (template.includes('[slug]') && !slug) throw new Error(`buildPath: ${pathname} needs a slug`)
  const path = slug ? template.replace('[slug]', slug) : template
  if (locale === defaultLocale) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}
