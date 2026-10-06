import type { Metadata } from 'next'
import { defaultLocale, type Locale, locales, ogLocales } from '@/i18n/locales'
import { env } from '@/lib/env'

/** Absolute URL for a site path. The home path has no trailing slash, so canonicals stay consistent. */
export const absoluteUrl = (path: string) => (path === '/' ? env.SITE_URL : `${env.SITE_URL}${path}`)

const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`)

export function buildMetadata(a: {
  locale: Locale
  paths: Record<Locale, string>
  title: string
  description: string
  image?: string | null
  noindex?: boolean
}): Metadata {
  const url = absoluteUrl(a.paths[a.locale])
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(a.paths[l])])) as Record<string, string>
  languages['x-default'] = absoluteUrl(a.paths[defaultLocale])
  const title = clip(a.title, 60)
  const description = clip(a.description, 160)

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'website',
      siteName: 'coffeeProjects',
      url,
      title,
      description,
      locale: ogLocales[a.locale],
      alternateLocale: locales.filter((l) => l !== a.locale).map((l) => ogLocales[l]),
      ...(a.image ? { images: [{ url: a.image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(a.image ? { images: [a.image] } : {}) },
    // Only production is indexable; staging also sends X-Robots-Tag (see http-headers.ts).
    ...(a.noindex || !env.isProduction ? { robots: { index: false, follow: false } } : {}),
  }
}
