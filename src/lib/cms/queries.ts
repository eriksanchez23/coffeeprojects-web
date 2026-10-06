import 'server-only'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import type { Faq, Home, Legal, Project, Service, SiteSetting, TeamMember } from '@/payload-types'
import type { Locale } from '@/i18n/locales'
import { payloadClient } from './client'
import { toLocaleSlugs } from './slugs'

type Slugged = 'services' | 'projects' | 'team-members'
const REVALIDATE = 3600

async function isDraft(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
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
    const res = await payload.find({ collection, locale, draft, depth: 1, limit: 100, where, pagination: false })
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
        where: { and: [{ slug: { equals: slug } }, ...statusFilter] },
      })

    let found = (await query(locale)).docs[0] as unknown as T | undefined
    if (!found && locale !== 'es') {
      // The translation may not have its own slug yet: match the ES slug, render in the requested locale.
      const es = (await query('es')).docs[0]
      if (es) found = (await payload.findByID({ collection, id: es.id, locale, draft, depth: 1 })) as unknown as T
    }
    if (!found) return null

    const all = await payload.findByID({ collection, id: found.id, locale: 'all', draft, depth: 0, select: { slug: true } })
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

export async function getAllSlugs(collection: Slugged): Promise<Record<Locale, string>[]> {
  return read([collection, 'all-slugs'], [collection], async () => {
    const payload = await payloadClient()
    const res = await payload.find({
      collection,
      locale: 'all',
      depth: 0,
      pagination: false,
      where: published,
      select: { slug: true },
    })
    return res.docs.map((d) => toLocaleSlugs((d as { slug?: unknown }).slug))
  })
}

function getGlobal<T>(slug: 'home' | 'site-settings' | 'legal', locale: Locale): Promise<T> {
  return read([`global:${slug}`, locale], [`global:${slug}`], async (draft) => {
    const payload = await payloadClient()
    return (await payload.findGlobal({ slug, locale, draft, depth: 1 })) as T
  })
}

export const getHome = (locale: Locale) => getGlobal<Home>('home', locale)
export const getSettings = (locale: Locale) => getGlobal<SiteSetting>('site-settings', locale)
export const getLegal = (locale: Locale) => getGlobal<Legal>('legal', locale)
