# T10 — Projects: portfolio index and project detail

**Files:**
- Create: `src/lib/project-view.ts`, `src/components/sections/project-card.tsx`, `src/components/sections/projects-preview.tsx`, `src/app/(frontend)/[locale]/projects/page.tsx`, `src/app/(frontend)/[locale]/projects/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/page.tsx` (insert `<ProjectsPreview />` after `<TeamPreview />`)
- Test: `tests/unit/project-view.test.ts`

**Interfaces:**
- Consumes: `getProjects`, `getProject`, `getAllSlugs`, `getHome` (T06); `PageShell` (T07); `RichText` (T06); UI primitives (T02).
- Produces:
  - `projectPublicUrl(p: Pick<Project,'nda'|'url'>): string | null` — never returns a URL for NDA projects
  - `coverGradient(seed: string): string` — deterministic brand gradient used when a project has no cover image (no stock/fake screenshots)
  - `<ProjectCard project />`, `<ProjectsPreview locale title lead as? />`

- [ ] **Step 1: Failing test** — `tests/unit/project-view.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { coverGradient, projectPublicUrl } from '@/lib/project-view'

describe('projectPublicUrl', () => {
  it('hides the URL for NDA projects even if one is stored', () => {
    expect(projectPublicUrl({ nda: true, url: 'https://secret.example' })).toBeNull()
  })
  it('returns the URL for public projects', () => {
    expect(projectPublicUrl({ nda: false, url: 'https://coffeeprojects.es' })).toBe('https://coffeeprojects.es')
  })
  it('rejects non-http URLs', () => {
    expect(projectPublicUrl({ nda: false, url: 'javascript:alert(1)' })).toBeNull()
  })
})

describe('coverGradient', () => {
  it('is deterministic per seed', () => {
    expect(coverGradient('abc')).toBe(coverGradient('abc'))
    expect(coverGradient('abc')).not.toBe(coverGradient('xyz'))
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/project-view.test.ts
```

- [ ] **Step 3: Implement `src/lib/project-view.ts`**

```ts
export function projectPublicUrl(p: { nda?: boolean | null; url?: string | null }): string | null {
  if (p.nda || !p.url) return null
  return /^https?:\/\//i.test(p.url) ? p.url : null
}

const hues = [32, 18, 40, 12, 150, 200]

export function coverGradient(seed: string): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const a = hues[h % hues.length]
  const b = hues[(h >> 3) % hues.length]
  return `radial-gradient(120% 120% at 0% 0%, hsl(${a} 85% 60% / .55), transparent 60%), radial-gradient(120% 120% at 100% 100%, hsl(${b} 80% 45% / .45), transparent 60%), #120c09`
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm vitest run tests/unit/project-view.test.ts
```

- [ ] **Step 5: Components**

`src/components/sections/project-card.tsx`:

```tsx
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { coverGradient } from '@/lib/project-view'
import type { Media, Project } from '@/payload-types'

export async function ProjectCard({ project: p }: { project: Project }) {
  const t = await getTranslations('common')
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  return (
    <Link href={{ pathname: '/projects/[slug]', params: { slug: p.slug } }} className="group block" data-reveal>
      <article className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1 transition-colors hover:border-line-amber">
        <div className="relative aspect-[16/10]" style={cover?.url ? undefined : { background: coverGradient(p.slug) }}>
          {cover?.url ? (
            <Image src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <span aria-hidden className="absolute inset-0 grid place-items-center font-mono text-sm text-ink-1/70">{`<${p.slug} />`}</span>
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge>{p.category}</Badge>
            <Badge className={p.status === 'live' ? 'text-mint' : 'text-amber'}>{p.status === 'live' ? t('live') : t('inProgress')}</Badge>
            {p.nda && <Badge>{t('nda')}</Badge>}
            <span className="ml-auto font-mono text-ink-3">{p.year}</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold">{p.title}</h3>
          <p className="mt-2 text-ink-2">{p.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(p.stack ?? []).map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}
```

`src/components/sections/projects-preview.tsx`:

```tsx
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { getProjects } from '@/lib/cms/queries'
import { ProjectCard } from './project-card'

export async function ProjectsPreview({ locale, title, lead, as, featuredOnly = true }: { locale: Locale; title: string; lead?: string | null; as?: 'h1' | 'h2'; featuredOnly?: boolean }) {
  const projects = await getProjects(locale, { featuredOnly })
  return (
    <Section id="projects" eyebrow="// projects" title={title} lead={lead} as={as}>
      <ul className="grid gap-6 md:grid-cols-2" data-reveal-group>
        {projects.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

Home: after `<TeamPreview …/>` insert:

```tsx
<ProjectsPreview locale={locale} title={home.sections.projectsTitle} lead={home.sections.projectsLead} />
```

- [ ] **Step 6: Projects index `src/app/(frontend)/[locale]/projects/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ProjectsPreview } from '@/components/sections/projects-preview'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome } from '@/lib/cms/queries'

export const revalidate = 3600

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const home = await getHome(locale)
  return (
    <PageShell locale={locale} alternates={localizedPaths('/projects')}>
      <ProjectsPreview locale={locale} title={home.sections.projectsTitle} lead={home.sections.projectsLead} as="h1" featuredOnly={false} />
      <CtaBand />
    </PageShell>
  )
}
```

- [ ] **Step 7: Project detail `src/app/(frontend)/[locale]/projects/[slug]/page.tsx`**

```tsx
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { RichText } from '@/components/ui/rich-text'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getAllSlugs, getProject } from '@/lib/cms/queries'
import { coverGradient, projectPublicUrl } from '@/lib/project-view'
import type { Media } from '@/payload-types'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return (await getAllSlugs('projects')).map((s) => ({ slug: s[params.locale as Locale] }))
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const found = await getProject(locale, slug)
  if (!found) notFound()
  const { doc: p, slugs } = found
  const t = await getTranslations('common')
  const url = projectPublicUrl(p)
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  const gallery = (p.gallery ?? []).filter((g): g is Media => typeof g === 'object' && g !== null)

  return (
    <PageShell locale={locale} alternates={localizedPaths('/projects/[slug]', slugs)}>
      <article>
        <header className="pt-20 pb-12">
          <Container>
            <div className="flex flex-wrap gap-2">
              <Badge>{p.category}</Badge>
              <Badge>{p.status === 'live' ? t('live') : t('inProgress')}</Badge>
              {p.nda && <Badge>{t('nda')}</Badge>}
              <Badge>{p.year}</Badge>
            </div>
            <h1 className="mt-6 text-5xl font-semibold sm:text-7xl">{p.title}</h1>
            <p className="mt-6 max-w-3xl text-lg text-ink-2">{p.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(p.stack ?? []).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className={`${buttonClasses({ variant: 'outline' })} mt-8`}>
                {t('visit')} ↗
              </a>
            )}
          </Container>
        </header>
        <Container>
          <div className="relative aspect-[16/8] overflow-hidden rounded-[var(--radius-lg)] border border-line" style={cover?.url ? undefined : { background: coverGradient(p.slug) }}>
            {cover?.url && <Image src={cover.url} alt={cover.alt} fill priority sizes="100vw" className="object-cover" />}
          </div>
          {p.body && <RichText data={p.body} className="mx-auto mt-16 max-w-3xl" />}
          {gallery.length > 0 && (
            <ul className="mt-16 grid gap-4 md:grid-cols-2">
              {gallery.map((g) => (
                <li key={g.id} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)]">
                  <Image src={g.url ?? ''} alt={g.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </article>
      <CtaBand />
    </PageShell>
  )
}
```

- [ ] **Step 8: Manual check**

`pnpm dev`: home shows 4 project cards with branded gradient covers; NDA projects show the "Bajo NDA" badge and no "Visitar" button; `/proyectos/coffeeprojects-es` shows "Visitar ↗"; `/en/projects/what-should-we-eat-today` resolves.

- [ ] **Step 9: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(projects): add portfolio index and project detail pages"
```
