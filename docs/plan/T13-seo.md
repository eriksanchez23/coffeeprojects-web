# T13 — SEO: metadata, hreflang, sitemap, robots, JSON-LD, Open Graph images

**Files:**
- Create: `src/lib/seo/metadata.ts`, `src/lib/seo/jsonld.ts`, `src/components/seo/json-ld.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/(frontend)/[locale]/opengraph-image.tsx`, `src/app/(frontend)/[locale]/services/[slug]/opengraph-image.tsx`, `src/lib/http-headers.ts`
- Modify: every page under `src/app/(frontend)/[locale]/**/page.tsx` (add `generateMetadata` + JSON-LD), `[locale]/layout.tsx` (`metadataBase`, Organization + WebSite JSON-LD), `next.config.mjs` (`headers()`)
- Test: `tests/unit/seo-metadata.test.ts`, `tests/unit/jsonld.test.ts`, `tests/unit/http-headers.test.ts`

**Interfaces:**
- Consumes: `env` (T01), `localizedPaths`, `ogLocales`, `Locale` (T03), queries (T06), types (T04).
- Produces:
  - `buildMetadata(a: { locale: Locale; paths: Record<Locale,string>; title: string; description: string; image?: string | null; noindex?: boolean }): Metadata`
  - `absoluteUrl(path: string): string`
  - JSON-LD builders: `organizationLd(email)`, `websiteLd(locale)`, `serviceLd(s, url, locale)`, `personLd(m, url)`, `faqLd(items)`, `breadcrumbLd(items: {name, url}[])`, `projectLd(p, url)`
  - `<JsonLd data={object | object[]} />`
  - `responseHeaders(siteEnv): { source: string; headers: { key: string; value: string }[] }[]` (extended with security headers in T15)

- [ ] **Step 1: Failing tests**

`tests/unit/seo-metadata.test.ts`:

```ts
import { beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://coffeeprojects.es')
  vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'production')
})

describe('buildMetadata', () => {
  it('sets canonical, hreflang alternates and x-default', async () => {
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const m = buildMetadata({
      locale: 'en',
      paths: { es: '/servicios', en: '/en/services', fr: '/fr/services' },
      title: 'Services',
      description: 'desc',
    })
    expect(m.alternates?.canonical).toBe('https://coffeeprojects.es/en/services')
    expect(m.alternates?.languages).toEqual({
      es: 'https://coffeeprojects.es/servicios',
      en: 'https://coffeeprojects.es/en/services',
      fr: 'https://coffeeprojects.es/fr/services',
      'x-default': 'https://coffeeprojects.es/servicios',
    })
    expect(m.openGraph).toMatchObject({ locale: 'en_US', url: 'https://coffeeprojects.es/en/services', siteName: 'CoffeeProjects' })
  })

  it('marks noindex pages', async () => {
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const m = buildMetadata({ locale: 'es', paths: { es: '/a', en: '/en/a', fr: '/fr/a' }, title: 't', description: 'd', noindex: true })
    expect(m.robots).toEqual({ index: false, follow: false })
  })

  it('truncates long titles and descriptions', async () => {
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const m = buildMetadata({ locale: 'es', paths: { es: '/', en: '/en', fr: '/fr' }, title: 'x'.repeat(80), description: 'y'.repeat(300) })
    expect(String(m.title).length).toBeLessThanOrEqual(60)
    expect(String(m.description).length).toBeLessThanOrEqual(160)
  })
})
```

`tests/unit/jsonld.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { breadcrumbLd, faqLd, organizationLd, serviceLd } from '@/lib/seo/jsonld'

describe('json-ld', () => {
  it('organization is a ProfessionalService with contact point', () => {
    const o = organizationLd('contact@coffeeprojects.es')
    expect(o['@type']).toBe('ProfessionalService')
    expect(o.contactPoint).toMatchObject({ email: 'contact@coffeeprojects.es', availableLanguage: ['es', 'en'] })
  })
  it('service includes a price offer only when there is an amount', () => {
    const s = serviceLd({ title: 'Webs', summary: 's', pricing: { mode: 'one-off', amount: 600 } } as never, 'https://x/s', 'es')
    expect(s.offers).toMatchObject({ '@type': 'Offer', price: 600, priceCurrency: 'EUR' })
    const c = serviceLd({ title: 'A medida', summary: 's', pricing: { mode: 'custom' } } as never, 'https://x/c', 'es')
    expect(c.offers).toBeUndefined()
  })
  it('faq maps questions', () => {
    expect(faqLd([{ question: 'Q', answer: 'A' }]).mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Q',
      acceptedAnswer: { '@type': 'Answer', text: 'A' },
    })
  })
  it('breadcrumb numbers positions from 1', () => {
    expect(breadcrumbLd([{ name: 'Inicio', url: 'https://x/' }, { name: 'Servicios', url: 'https://x/servicios' }]).itemListElement[1].position).toBe(2)
  })
})
```

`tests/unit/http-headers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { responseHeaders } from '@/lib/http-headers'

const all = (env: 'staging' | 'production') => responseHeaders(env).flatMap((r) => r.headers)

describe('responseHeaders', () => {
  it('adds noindex on staging', () => {
    expect(all('staging')).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
  })
  it('does not noindex public pages in production', () => {
    expect(responseHeaders('production').find((r) => r.source === '/:path*')).toBeUndefined()
  })
  it('always noindexes the admin', () => {
    const admin = responseHeaders('production').find((r) => r.source === '/admin/:path*')
    expect(admin?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/seo-metadata.test.ts tests/unit/jsonld.test.ts tests/unit/http-headers.test.ts
```

- [ ] **Step 3: Implement `src/lib/seo/metadata.ts`**

```ts
import type { Metadata } from 'next'
import { defaultLocale, type Locale, locales, ogLocales } from '@/i18n/locales'
import { env } from '@/lib/env'

export const absoluteUrl = (path: string) => `${env.SITE_URL}${path === '/' ? '' : path}` || env.SITE_URL

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
      siteName: 'CoffeeProjects',
      url,
      title,
      description,
      locale: ogLocales[a.locale],
      alternateLocale: locales.filter((l) => l !== a.locale).map((l) => ogLocales[l]),
      ...(a.image ? { images: [{ url: a.image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(a.image ? { images: [a.image] } : {}) },
    ...(a.noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
```

> `absoluteUrl('/')` returns `https://coffeeprojects.es` (no trailing slash) — keep canonical formatting consistent everywhere.

- [ ] **Step 4: Implement `src/lib/seo/jsonld.ts`**

```ts
import type { Locale } from '@/i18n/locales'
import type { Project, Service, TeamMember } from '@/payload-types'
import { env } from '@/lib/env'

const ORG_ID = () => `${env.SITE_URL}/#organization`

export function organizationLd(email: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID(),
    name: 'CoffeeProjects',
    url: env.SITE_URL,
    logo: `${env.SITE_URL}/icon.png`,
    email,
    slogan: 'Sin café no hay código',
    areaServed: [{ '@type': 'Country', name: 'Spain' }, 'Worldwide'],
    address: { '@type': 'PostalAddress', addressCountry: 'ES' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email, availableLanguage: ['es', 'en'] },
    knowsAbout: ['Web development', 'E-commerce', 'Next.js', 'SEO', 'FiveM', 'Discord bots'],
  }
}

export function websiteLd(locale: Locale) {
  return { '@context': 'https://schema.org', '@type': 'WebSite', url: env.SITE_URL, name: 'CoffeeProjects', inLanguage: locale, publisher: { '@id': ORG_ID() } }
}

export function serviceLd(s: Pick<Service, 'title' | 'summary' | 'pricing'>, url: string, locale: Locale) {
  const amount = s.pricing?.mode === 'one-off' || s.pricing?.mode === 'monthly' ? s.pricing.amount : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.summary,
    url,
    inLanguage: locale,
    provider: { '@id': ORG_ID() },
    areaServed: 'Worldwide',
    offers:
      amount != null
        ? {
            '@type': 'Offer',
            price: amount,
            priceCurrency: 'EUR',
            ...(s.pricing?.mode === 'monthly' ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: amount, priceCurrency: 'EUR', unitCode: 'MON' } } : {}),
          }
        : undefined,
  }
}

export function personLd(m: Pick<TeamMember, 'name' | 'role' | 'shortBio' | 'skills' | 'socials'>, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: m.name,
    jobTitle: m.role,
    description: m.shortBio,
    url,
    worksFor: { '@id': ORG_ID() },
    knowsAbout: m.skills ?? [],
    sameAs: (m.socials ?? []).map((s) => s.url).filter((u) => u.startsWith('http')),
  }
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
  }
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  }
}

export function projectLd(p: Pick<Project, 'title' | 'summary' | 'year' | 'stack'>, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.summary,
    dateCreated: String(p.year),
    keywords: (p.stack ?? []).join(', '),
    url,
    creator: { '@id': ORG_ID() },
  }
}
```

- [ ] **Step 5: Headers `src/lib/http-headers.ts`**

```ts
type Header = { key: string; value: string }
type Rule = { source: string; headers: Header[] }

const NOINDEX: Header = { key: 'X-Robots-Tag', value: 'noindex, nofollow' }

export function responseHeaders(siteEnv: 'development' | 'staging' | 'production'): Rule[] {
  const rules: Rule[] = [{ source: '/admin/:path*', headers: [NOINDEX] }]
  if (siteEnv !== 'production') rules.push({ source: '/:path*', headers: [NOINDEX] })
  return rules
}
```

`next.config.mjs`: next.config cannot import TS directly; inline the same rule there and keep the TS module as the tested source of truth by **generating** the config from it is overkill — instead convert `next.config.mjs` to `next.config.ts` (supported by Next.js) and:

```ts
import { responseHeaders } from './src/lib/http-headers'
// in nextConfig:
async headers() {
  return responseHeaders((process.env.NEXT_PUBLIC_SITE_ENV as 'development' | 'staging' | 'production') ?? 'development')
},
```

(When renaming to `next.config.ts`, keep the `withPayload(withNextIntl(nextConfig))` export.)

- [ ] **Step 6: Run — expect PASS**

```bash
pnpm vitest run tests/unit/seo-metadata.test.ts tests/unit/jsonld.test.ts tests/unit/http-headers.test.ts
```

- [ ] **Step 7: JSON-LD component `src/components/seo/json-ld.tsx`**

```tsx
export function JsonLd({ data }: { data: object | object[] }) {
  // Escape "<" so content can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
```

- [ ] **Step 8: Page metadata (one per page)**

Layout: add

```ts
export const metadata: Metadata = { metadataBase: new URL(env.SITE_URL) }
```

and render `<JsonLd data={[organizationLd(settings.contactEmail), websiteLd(locale)]} />` in `<body>` (fetch `getSettings(locale)` in the layout).

Home (`[locale]/page.tsx`):

```ts
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations({ locale, namespace: 'meta' })])
  return buildMetadata({
    locale,
    paths: localizedPaths('/'),
    title: settings.defaultSeo?.title || t('defaultTitle'),
    description: settings.defaultSeo?.description || t('defaultDescription'),
  })
}
```

and in the page body: `<JsonLd data={faqLd(faqs)} />`.

Service landing:

```ts
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const found = await getService(locale, slug)
  if (!found) return {}
  const { doc: s, slugs } = found
  return buildMetadata({
    locale,
    paths: localizedPaths('/services/[slug]', slugs),
    title: s.seo?.title || s.title,
    description: s.seo?.description || s.summary,
  })
}
```

Body: `<JsonLd data={[serviceLd(s, absoluteUrl(localizedPaths('/services/[slug]', slugs)[locale]), locale), breadcrumbLd([{ name: tNav('home'), url: absoluteUrl(localizedPaths('/')[locale]) }, { name: tNav('services'), url: absoluteUrl(localizedPaths('/services')[locale]) }, { name: s.title, url: absoluteUrl(localizedPaths('/services/[slug]', slugs)[locale]) }]), ...(faqItems.length ? [faqLd(faqItems)] : [])]} />` (with `tNav = await getTranslations('nav')`).

Apply the same pattern to:

| Page | paths | title / description | JSON-LD |
|------|-------|---------------------|---------|
| services index | `localizedPaths('/services')` | `home.sections.servicesTitle` / `home.sections.servicesLead` | breadcrumb |
| team | `localizedPaths('/team')` | `home.sections.teamTitle` / `home.sections.teamLead` | breadcrumb |
| member | `localizedPaths('/team/[slug]', slugs)` | `` `${m.name} — ${m.role}` `` / `m.shortBio` | `personLd` + breadcrumb |
| projects | `localizedPaths('/projects')` | `home.sections.projectsTitle` / `home.sections.projectsLead` | breadcrumb |
| project | `localizedPaths('/projects/[slug]', slugs)` | `p.seo?.title || p.title` / `p.seo?.description || p.summary` | `projectLd` + breadcrumb |
| contact | `localizedPaths('/contact')` | `t('contact.title')` / `t('contact.lead')` | breadcrumb |
| thanks | `localizedPaths('/contact/thanks')` | `t('thanks.title')` / `t('thanks.body')` | none, `noindex: true` (replace the static `metadata` export from T11) |

- [ ] **Step 9: Sitemap and robots**

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { type Locale, locales } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import type { AppPathname } from '@/i18n/routing'
import { getAllSlugs } from '@/lib/cms/queries'
import { absoluteUrl } from '@/lib/seo/metadata'

export const revalidate = 3600

function entries(paths: Record<Locale, string>, priority: number): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(paths[l])]))
  return locales.map((l) => ({ url: absoluteUrl(paths[l]), lastModified: new Date(), changeFrequency: 'weekly', priority, alternates: { languages } }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: [AppPathname, number][] = [
    ['/', 1],
    ['/services', 0.9],
    ['/team', 0.7],
    ['/projects', 0.7],
    ['/contact', 0.8],
    ['/legal-notice', 0.1],
    ['/privacy', 0.1],
    ['/cookies', 0.1],
  ]
  const [services, team, projects] = await Promise.all([getAllSlugs('services'), getAllSlugs('team-members'), getAllSlugs('projects')])
  return [
    ...staticPages.flatMap(([p, prio]) => entries(localizedPaths(p), prio)),
    ...services.flatMap((s) => entries(localizedPaths('/services/[slug]', s), 0.9)),
    ...team.flatMap((s) => entries(localizedPaths('/team/[slug]', s), 0.6)),
    ...projects.flatMap((s) => entries(localizedPaths('/projects/[slug]', s), 0.6)),
  ]
}
```

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  if (!env.isProduction) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    sitemap: `${env.SITE_URL}/sitemap.xml`,
    host: env.SITE_URL,
  }
}
```

> `sitemap.ts`/`robots.ts` live at `src/app/` root (outside route groups) and are excluded from the proxy matcher because they contain a dot.

- [ ] **Step 10: Open Graph images**

`src/app/(frontend)/[locale]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'footer' })
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: 'radial-gradient(80% 80% at 50% 0%, rgba(245,167,66,.35), #0b0706 70%)', color: '#fff7e8' }}>
        <div style={{ fontSize: 36, color: '#f5a742', fontFamily: 'monospace' }}>~ coffeeprojects $ brew</div>
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1 }}>{t('tagline')}</div>
        <div style={{ fontSize: 32, color: '#a89584' }}>coffeeprojects.es</div>
      </div>
    ),
    size,
  )
}
```

`src/app/(frontend)/[locale]/services/[slug]/opengraph-image.tsx`: same layout, but fetch `getService(locale, slug)` and render `s.title` (small amber eyebrow) + `s.promise` (big text); return the generic image when not found.

- [ ] **Step 10b: Old URL audit (spec §10)**

```bash
curl -s https://coffeeprojects.es/sitemap.xml
```

The current site is a single page with `#anchors`; anchors need no redirects. For every **real path** listed in the old sitemap that no longer exists (e.g. a legal page with a different slug), add a permanent redirect in `next.config.ts`:

```ts
async redirects() {
  return [
    // { source: '/politica-privacidad', destination: '/privacidad', permanent: true },
  ]
},
```

Record the audited list (even if empty) in the task log.

- [ ] **Step 11: Manual check**

`pnpm build && pnpm start` with `NEXT_PUBLIC_SITE_ENV=production`:
- `curl -s localhost:3000/en/services | grep -E 'hreflang|canonical'` → 4 alternates + canonical
- `curl -s localhost:3000/sitemap.xml | head` → URLs for 3 locales with `xhtml:link` alternates
- `curl -s localhost:3000/robots.txt` → allow + sitemap
- `curl -sI localhost:3000/admin | grep -i x-robots` → noindex
- Paste a service URL's HTML into Google Rich Results Test (or validator.schema.org) → Service, BreadcrumbList, FAQPage valid
Then with `NEXT_PUBLIC_SITE_ENV=staging`: `robots.txt` → `Disallow: /` and every response has `X-Robots-Tag: noindex, nofollow`.

- [ ] **Step 12: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(seo): add localized metadata, hreflang, sitemap, robots, JSON-LD and OG images"
```
