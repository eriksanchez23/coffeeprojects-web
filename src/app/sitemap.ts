import type { MetadataRoute } from 'next'
import { type Locale, locales } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import type { AppPathname } from '@/i18n/routing'
import { getAllSlugs } from '@/lib/cms/queries'
import { absoluteUrl } from '@/lib/seo/metadata'

export const revalidate = 3600

// Flip to true once the legal pages exist (T15); listing routes that 404 would hurt crawling.
const LEGAL_PAGES_LIVE = false

function entries(paths: Record<Locale, string>, priority: number): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(paths[l])]))
  return locales.map((l) => ({
    url: absoluteUrl(paths[l]),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: [AppPathname, number][] = [
    ['/', 1],
    ['/services', 0.9],
    ['/team', 0.7],
    ['/projects', 0.7],
    ['/contact', 0.8],
    ...(LEGAL_PAGES_LIVE ? ([['/legal-notice', 0.1], ['/privacy', 0.1], ['/cookies', 0.1]] as [AppPathname, number][]) : []),
  ]
  const [services, team, projects] = await Promise.all([getAllSlugs('services'), getAllSlugs('team-members'), getAllSlugs('projects')])
  return [
    ...staticPages.flatMap(([p, prio]) => entries(localizedPaths(p), prio)),
    ...services.flatMap((s) => entries(localizedPaths('/services/[slug]', s), 0.9)),
    ...team.flatMap((s) => entries(localizedPaths('/team/[slug]', s), 0.6)),
    ...projects.flatMap((s) => entries(localizedPaths('/projects/[slug]', s), 0.6)),
  ]
}
