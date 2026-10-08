import 'server-only'
import { draftMode } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import type { Faq, Home, Legal, Partner, Pricing, Project, Service, SiteSetting, TeamMember } from '@/payload-types'
import type { Locale } from '@/i18n/locales'
import { completeWebPlans } from '@/lib/pricing'
import { payloadClient } from './client'
import { withHomeDefaults, withLegalDefaults, withPartnersDefaults, withPricingDefaults, withSettingsDefaults } from './global-defaults'
import { type SlugEntry, toLocaleSlugs, toSlugEntries } from './slugs'

type Slugged = 'services' | 'projects' | 'team-members'
const REVALIDATE = 3600

async function isDraft(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch (err) {
    unstable_rethrow(err) // keep Next.js control-flow errors intact
    return false // called outside a request (build-time generateStaticParams)
  }
}

/** Cached in production reads; bypassed entirely in draft mode so editors see unpublished changes. */
async function read<T>(key: string[], tags: string[], fn: (draft: boolean) => Promise<T>): Promise<T> {
  const draft = await isDraft()
  if (draft) return fn(true)
  return unstable_cache(() => fn(false), key, { tags, revalidate: REVALIDATE })()
}

const published = { _status: { equals: 'published' } } as const

async function listCollection<T>(collection: Slugged | 'faqs', locale: Locale, extraWhere = {}): Promise<T[]> {
  return read([collection, locale, JSON.stringify(extraWhere)], [collection], async (draft) => {
    const payload = await payloadClient()
    const where = collection === 'faqs' || draft ? extraWhere : { and: [published, extraWhere] }
    const res = await payload.find({ collection, locale, draft, depth: 1, limit: 100, where, pagination: false, overrideAccess: draft })
    return res.docs as T[]
  })
}

async function findBySlug<T extends { id: number | string }>(collection: Slugged, locale: Locale, slug: string) {
  return read([collection, 'slug', locale, slug], [collection], async (draft) => {
    const payload = await payloadClient()
    const statusFilter = draft ? [] : [published]
    const query = (l: Locale) =>
      payload.find({
        collection,
        locale: l,
        draft,
        depth: 1,
        limit: 1,
        overrideAccess: draft,
        where: { and: [{ slug: { equals: slug } }, ...statusFilter] },
      })

    let found = (await query(locale)).docs[0] as unknown as T | undefined
    if (!found && locale !== 'es') {
      // The translation may not have its own slug yet: match the ES slug, render in the requested locale.
      const es = (await query('es')).docs[0]
      if (es) found = (await payload.findByID({ collection, id: es.id, locale, draft, depth: 1, overrideAccess: draft })) as unknown as T
    }
    if (!found) return null

    const all = await payload.findByID({ collection, id: found.id, locale: 'all', draft, depth: 0, select: { slug: true }, overrideAccess: draft })
    return { doc: found, slugs: toLocaleSlugs((all as { slug?: unknown }).slug) }
  })
}

export const getServices = (locale: Locale) => listCollection<Service>('services', locale)
export const getTeam = (locale: Locale) => listCollection<TeamMember>('team-members', locale)
export const getFaqs = (locale: Locale) => listCollection<Faq>('faqs', locale)
export const getProjects = (locale: Locale, opts: { featuredOnly?: boolean } = {}) =>
  listCollection<Project>('projects', locale, opts.featuredOnly ? { featured: { equals: true } } : {})

export const getService = (locale: Locale, slug: string) => findBySlug<Service>('services', locale, slug)
export const getMember = (locale: Locale, slug: string) => findBySlug<TeamMember>('team-members', locale, slug)
export const getProject = (locale: Locale, slug: string) => findBySlug<Project>('projects', locale, slug)

/** Published docs' per-locale slugs plus `updatedAt` (sitemap lastModified). Docs without an ES slug are skipped. */
export async function getAllSlugs(collection: Slugged): Promise<SlugEntry[]> {
  // 'v2': the cached shape changed (SlugEntry); a new key keeps an old persisted data cache from being served.
  return read([collection, 'all-slugs', 'v2'], [collection], async () => {
    const payload = await payloadClient()
    const res = await payload.find({
      collection,
      locale: 'all',
      depth: 0,
      pagination: false,
      overrideAccess: false,
      where: published,
      select: { slug: true, updatedAt: true },
    })
    const { entries, skippedIds } = toSlugEntries(res.docs as { id: number | string; slug?: unknown; updatedAt?: string }[])
    // One line per (cached) read; ids only, never document content.
    if (skippedIds.length > 0) console.warn(`getAllSlugs(${collection}): skipped docs without an es slug: ${skippedIds.join(', ')}`)
    return entries
  })
}

function getGlobal<T>(slug: 'home' | 'pricing' | 'partners' | 'site-settings' | 'legal', locale: Locale): Promise<T> {
  return read([`global:${slug}`, locale], [`global:${slug}`], async (draft) => {
    const payload = await payloadClient()
    return (await payload.findGlobal({ slug, locale, draft, depth: 1, overrideAccess: draft })) as T
  })
}

// Normalized so an empty (just-migrated / unseeded) database never breaks a prerender (global-defaults.ts).
export const getHome = async (locale: Locale) => withHomeDefaults(await getGlobal<Home>('home', locale))
export const getSettings = async (locale: Locale) => withSettingsDefaults(await getGlobal<SiteSetting>('site-settings', locale))
export const getLegal = async (locale: Locale) => withLegalDefaults(await getGlobal<Legal>('legal', locale))
export const getPricing = async (locale: Locale) => withPricingDefaults(await getGlobal<Pricing>('pricing', locale))
export const getPartners = async (locale: Locale) => withPartnersDefaults(await getGlobal<Partner>('partners', locale))

/** Web plan slugs of the published pricing global: the only values a contact `plan` may take. */
export async function getPlanSlugs(): Promise<string[]> {
  const pricing = withPricingDefaults(await getGlobal<Pricing>('pricing', 'es'))
  // Only priced plans: rows left over from an older pricing model are hidden on the page, so they must not validate either.
  return completeWebPlans(pricing.packages).map((p) => p.slug)
}
