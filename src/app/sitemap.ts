import type { MetadataRoute } from 'next'
import { defaultLocale } from '@/i18n/locales'
import { type Locale, locales } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import type { AppPathname } from '@/i18n/routing'
import { getAllSlugs, getLegalOwnLocale } from '@/lib/cms/queries'
import { legalPagesToIndex } from '@/lib/legal'
import { absoluteUrl } from '@/lib/seo/metadata'

export const revalidate = 3600

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
    ['/other-development', 0.5],
    ['/pricing', 0.8],
    ['/partners', 0.5],
    ['/team', 0.7],
    ['/projects', 0.7],
    ['/contact', 0.8],
  ]
  const [services, team, projects, legalPages] = await Promise.all([
    safeSlugs('services'),
    safeSlugs('team-members'),
    safeSlugs('projects'),
    // Legal pages are listed only once their text is final in every locale (they are noindex until then); a locale
    // still showing the Spanish fallback does not count.
    Promise.all(locales.map((l) => getLegalOwnLocale(l)))
      .then(legalPagesToIndex)
      .catch(() => []),
  ])
  for (const p of legalPages) staticPages.push([p, 0.1])
  return [
    ...staticPages.flatMap(([p, prio]) => entries(localizedPaths(p), prio)),
    ...services.flatMap((s) => entries(localizedPaths('/services/[slug]', s.slugs), 0.9, s.updatedAt)),
    ...team.flatMap((s) => entries(localizedPaths('/team/[slug]', s.slugs), 0.6, s.updatedAt)),
    ...projects.flatMap((s) => entries(localizedPaths('/projects/[slug]', s.slugs), 0.6, s.updatedAt)),
  ]
}
