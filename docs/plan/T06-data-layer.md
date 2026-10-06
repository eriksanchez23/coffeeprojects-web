# T06 — Data layer: cached CMS queries, revalidation hooks, draft preview

**Files:**
- Create: `src/lib/cms/client.ts`, `src/lib/cms/slugs.ts`, `src/lib/cms/queries.ts`, `src/i18n/build-path.ts`, `src/hooks/revalidate.ts`, `src/app/(frontend)/next/preview/route.ts`, `src/app/(frontend)/next/exit-preview/route.ts`, `src/components/ui/rich-text.tsx`
- Modify: `src/collections/{Services,Projects,TeamMembers,Faqs}.ts`, `src/globals/{Home,SiteSettings,Legal}.ts` (add hooks + `admin.preview`)
- Test: `tests/unit/cms-slugs.test.ts`, `tests/unit/build-path.test.ts`

**Interfaces:**
- Consumes: Payload config + generated types (T04), `routing`, `Locale` (T03).
- Produces (all `async`, server-only, from `src/lib/cms/queries.ts`):
  - `getHome(locale: Locale): Promise<Home>`
  - `getSettings(locale): Promise<SiteSetting>`
  - `getLegal(locale): Promise<Legal>`
  - `getServices(locale): Promise<Service[]>`
  - `getService(locale, slug): Promise<{ doc: Service; slugs: Record<Locale,string> } | null>`
  - `getTeam(locale): Promise<TeamMember[]>`
  - `getMember(locale, slug): Promise<{ doc: TeamMember; slugs: Record<Locale,string> } | null>`
  - `getProjects(locale, opts?: { featuredOnly?: boolean }): Promise<Project[]>`
  - `getProject(locale, slug): Promise<{ doc: Project; slugs: Record<Locale,string> } | null>`
  - `getFaqs(locale): Promise<Faq[]>`
  - `getAllSlugs(collection: 'services'|'projects'|'team-members'): Promise<Record<Locale,string>[]>` (for `generateStaticParams` and sitemap)
  - `toLocaleSlugs(value: unknown): Record<Locale,string>` (pure, `src/lib/cms/slugs.ts`)
  - `buildPath(pathname: AppPathname, locale: Locale, slug?: string): string` (pure, `src/i18n/build-path.ts`)
  - Cache tags: `'services' | 'projects' | 'team-members' | 'faqs' | 'global:home' | 'global:site-settings' | 'global:legal'`
  - `<RichText data />`

- [ ] **Step 1: Failing tests**

`tests/unit/cms-slugs.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toLocaleSlugs } from '@/lib/cms/slugs'

describe('toLocaleSlugs', () => {
  it('returns each locale slug', () => {
    expect(toLocaleSlugs({ es: 'a', en: 'b', fr: 'c' })).toEqual({ es: 'a', en: 'b', fr: 'c' })
  })
  it('falls back to the ES slug when a translation is missing', () => {
    expect(toLocaleSlugs({ es: 'tiendas-online', en: '', fr: null })).toEqual({
      es: 'tiendas-online',
      en: 'tiendas-online',
      fr: 'tiendas-online',
    })
  })
  it('accepts a plain string (non-localized response)', () => {
    expect(toLocaleSlugs('x')).toEqual({ es: 'x', en: 'x', fr: 'x' })
  })
  it('throws when there is no ES slug at all', () => {
    expect(() => toLocaleSlugs({ en: 'b' })).toThrow('missing es slug')
  })
})
```

`tests/unit/build-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildPath } from '@/i18n/build-path'

describe('buildPath', () => {
  it('builds unprefixed ES paths', () => {
    expect(buildPath('/services/[slug]', 'es', 'tiendas-online')).toBe('/servicios/tiendas-online')
  })
  it('prefixes non-default locales', () => {
    expect(buildPath('/projects', 'fr')).toBe('/fr/projets')
    expect(buildPath('/', 'en')).toBe('/en')
    expect(buildPath('/', 'es')).toBe('/')
  })
  it('throws when a dynamic path has no slug', () => {
    expect(() => buildPath('/team/[slug]', 'es')).toThrow()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/cms-slugs.test.ts tests/unit/build-path.test.ts
```

- [ ] **Step 3: Implement pure helpers**

`src/lib/cms/slugs.ts`:

```ts
import { type Locale, locales } from '@/i18n/locales'

export function toLocaleSlugs(value: unknown): Record<Locale, string> {
  if (typeof value === 'string') return Object.fromEntries(locales.map((l) => [l, value])) as Record<Locale, string>
  const map = (value ?? {}) as Partial<Record<Locale, string | null>>
  const es = map.es
  if (!es) throw new Error('missing es slug')
  return Object.fromEntries(locales.map((l) => [l, map[l] || es])) as Record<Locale, string>
}
```

`src/i18n/build-path.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm vitest run tests/unit/cms-slugs.test.ts tests/unit/build-path.test.ts
```

- [ ] **Step 5: Payload client + queries**

`src/lib/cms/client.ts`:

```ts
import 'server-only'
import config from '@payload-config'
import { getPayload } from 'payload'

export const payloadClient = () => getPayload({ config })
```

(`pnpm add server-only` if not installed.)

`src/lib/cms/queries.ts`:

```ts
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

    let found = (await query(locale)).docs[0] as T | undefined
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
```

- [ ] **Step 6: Revalidation hooks `src/hooks/revalidate.ts`**

```ts
import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

function safeRevalidate(tag: string, log: (msg: string) => void) {
  try {
    revalidateTag(tag, 'max')
  } catch {
    // Outside a Next.js request (e.g. `pnpm seed`) there is no cache to revalidate.
    log(`skip revalidate ${tag} (no Next.js context)`)
  }
}

export const revalidateCollection =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, (m) => req.payload.logger.debug(m))
    return doc
  }

export const revalidateCollectionDelete =
  (tag: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, (m) => req.payload.logger.debug(m))
    return doc
  }

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, (m) => req.payload.logger.debug(m))
    return doc
  }
```

Add to each collection config (example for `Services`; repeat with its own tag for `Projects` → `'projects'`, `TeamMembers` → `'team-members'`, `Faqs` → `'faqs'`):

```ts
hooks: {
  afterChange: [revalidateCollection('services')],
  afterDelete: [revalidateCollectionDelete('services')],
},
```

Add to globals: `Home` → `hooks: { afterChange: [revalidateGlobal('global:home')] }`, `SiteSettings` → `'global:site-settings'`, `Legal` → `'global:legal'`.

- [ ] **Step 7: Draft preview routes**

`src/app/(frontend)/next/preview/route.ts`:

```ts
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? '/'
  if (url.searchParams.get('secret') !== process.env.PREVIEW_SECRET || !path.startsWith('/')) {
    return new Response('Invalid preview request', { status: 401 })
  }
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Login to the admin panel first', { status: 403 })

  ;(await draftMode()).enable()
  redirect(path)
}
```

`src/app/(frontend)/next/exit-preview/route.ts`:

```ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
  ;(await draftMode()).disable()
  redirect('/')
}
```

Add `admin.preview` to `Services` (same pattern for `Projects` with `'/projects/[slug]'` and `TeamMembers` with `'/team/[slug]'`):

```ts
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'

// inside admin: { ... }
preview: (doc, { locale }) => {
  const slug = typeof doc?.slug === 'string' ? doc.slug : ''
  const path = buildPath('/services/[slug]', (locale as Locale) ?? 'es', slug)
  return `${process.env.NEXT_PUBLIC_SITE_URL}/next/preview?path=${encodeURIComponent(path)}&secret=${process.env.PREVIEW_SECRET}`
},
```

`Home` global: `admin.preview: (_, { locale }) => ... buildPath('/', locale) ...`.

- [ ] **Step 8: RichText component `src/components/ui/rich-text.tsx`**

```tsx
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import { cn } from '@/lib/cn'

export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data) return null
  return (
    <div
      className={cn(
        'max-w-none space-y-5 text-ink-1 [&_a]:text-amber [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:text-xl [&_li]:ml-5 [&_ul]:list-disc',
        className,
      )}
    >
      <LexicalRichText data={data as SerializedEditorState} />
    </div>
  )
}
```

- [ ] **Step 9: Manual verification**

Temporarily render `await getServices('en')` titles in the stub home page (`[locale]/page.tsx`, make it `async`), run `pnpm dev`, open `/en`: 7 English titles listed. Edit one service title in `/admin` (EN locale) → publish → reload `/en`: new title shows within a refresh (tag revalidated). Click "Preview" in the admin on a draft change → page shows the unpublished draft. Remove the temporary rendering afterwards.

- [ ] **Step 10: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(cms): add cached localized queries, revalidation hooks and draft preview"
```
