import type { MetadataRoute } from 'next'
import { defaultLocale } from '@/i18n/locales'
import { type Locale, locales } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import type { AppPathname } from '@/i18n/routing'
import { getAllSlugs } from '@/lib/cms/queries'
import { absoluteUrl } from '@/lib/seo/metadata'

export const revalidate = 3600

// Legal pages exist (T15); keep this guard in case they are ever removed.
const LEGAL_PAGES_LIVE = true

function entries(paths: Record<Locale, string>, priority: number, lastModified?: string): MetadataRoute.Sitemap {
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, absoluteUrl(paths[l])]))
  languages['x-default'] = absoluteUrl(paths[defaultLocale])
  return locales.map((l) => ({
    url: absoluteUrl(paths[l]),
    // CMS docs carry their real updatedAt; static pages fall back to the (hourly) regeneration time.
    lastModified: lastModified || new Date(),
    changeFrequency: 'weekly',
    priority,
    alternates: { languages },
  }))
}

// getAllSlugs already skips bad docs; this only keeps the sitemap alive if the CMS itself is unreachable.
const safeSlugs = (collection: Parameters<typeof getAllSlugs>[0]) =>
  getAllSlugs(collection).catch((err: unknown) => {
    console.error('sitemap: skipping collection', collection, err instanceof Error ? err.message : err)
    return []
  })

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: [AppPathname, number][] = [
    ['/', 1],
    ['/services', 0.9],
    ['/team', 0.7],
    ['/projects', 0.7],
    ['/contact', 0.8],
    ...(LEGAL_PAGES_LIVE ? ([['/legal-notice', 0.1], ['/privacy', 0.1], ['/cookies', 0.1]] as [AppPathname, number][]) : []),
  ]
  const [services, team, projects] = await Promise.all([safeSlugs('services'), safeSlugs('team-members'), safeSlugs('projects')])
  return [
    ...staticPages.flatMap(([p, prio]) => entries(localizedPaths(p), prio)),
    ...services.flatMap((s) => entries(localizedPaths('/services/[slug]', s.slugs), 0.9, s.updatedAt)),
    ...team.flatMap((s) => entries(localizedPaths('/team/[slug]', s.slugs), 0.6, s.updatedAt)),
    ...projects.flatMap((s) => entries(localizedPaths('/projects/[slug]', s.slugs), 0.6, s.updatedAt)),
  ]
}
