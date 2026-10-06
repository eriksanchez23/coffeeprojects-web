# T09 — Team: cards, team page, member profiles, GitHub stats with fallback

**Files:**
- Create: `src/features/github/stats.ts`, `src/components/sections/team-card.tsx`, `src/components/sections/team-preview.tsx`, `src/components/sections/github-stats.tsx`, `src/app/(frontend)/[locale]/team/page.tsx`, `src/app/(frontend)/[locale]/team/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/page.tsx` (insert `<TeamPreview />` after `ProcessSteps`)
- Test: `tests/unit/github-stats.test.ts`

**Interfaces:**
- Consumes: `getTeam`, `getMember`, `getAllSlugs`, `getHome` (T06); `PageShell` (T07); UI primitives (T02); `TeamMember` type (T04).
- Produces:
  - `type Repo = { name: string; description: string | null; stars: number; language: string | null; url: string }`
  - `type GithubStats = { repos: number; stars: number; top: Repo[]; source: 'live' | 'fallback' }`
  - `summarizeRepos(publicRepos: number, raw: RawRepo[]): GithubStats`
  - `getGithubStats(username: string | null | undefined, fallback: { repos?: number | null; stars?: number | null }): Promise<GithubStats | null>`
  - `visibleStats(stats: GithubStats | null): { key: 'repos' | 'stars'; value: number }[]` — drops zero/negative values
  - `<TeamCard member locale />`, `<TeamPreview locale title lead />`, `<GithubStatsView stats labels />`

- [ ] **Step 1: Failing test** — `tests/unit/github-stats.test.ts`

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGithubStats, summarizeRepos, visibleStats } from '@/features/github/stats'

const raw = [
  { name: 'nek_deliveryjob', description: 'Delivery job', stargazers_count: 18, language: 'Lua', html_url: 'https://github.com/x/a', fork: false },
  { name: 'nek_vehicleshop', description: null, stargazers_count: 8, language: 'Lua', html_url: 'https://github.com/x/b', fork: false },
  { name: 'forked', description: null, stargazers_count: 100, language: 'JS', html_url: 'https://github.com/x/c', fork: true },
]

afterEach(() => vi.unstubAllGlobals())

describe('summarizeRepos', () => {
  it('sums stars of own repos and picks top 2 by stars, ignoring forks', () => {
    const s = summarizeRepos(12, raw)
    expect(s.repos).toBe(12)
    expect(s.stars).toBe(26)
    expect(s.top.map((r) => r.name)).toEqual(['nek_deliveryjob', 'nek_vehicleshop'])
    expect(s.source).toBe('live')
  })
})

describe('getGithubStats', () => {
  it('uses the fallback when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('rate limited', { status: 403 })))
    const s = await getGithubStats('someone', { repos: 3, stars: 5 })
    expect(s).toEqual({ repos: 3, stars: 5, top: [], source: 'fallback' })
  })
  it('uses the fallback when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect((await getGithubStats('someone', { repos: 3 }))?.source).toBe('fallback')
  })
  it('uses the fallback when there is no username', async () => {
    expect(await getGithubStats(undefined, { repos: 3 })).toEqual({ repos: 3, stars: 0, top: [], source: 'fallback' })
  })
  it('returns null when there is neither data nor fallback', async () => {
    expect(await getGithubStats(undefined, {})).toBeNull()
  })
})

describe('visibleStats', () => {
  it('never exposes zero values', () => {
    expect(visibleStats({ repos: 3, stars: 0, top: [], source: 'fallback' })).toEqual([{ key: 'repos', value: 3 }])
    expect(visibleStats(null)).toEqual([])
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/github-stats.test.ts
```

- [ ] **Step 3: Implement `src/features/github/stats.ts`**

```ts
export type Repo = { name: string; description: string | null; stars: number; language: string | null; url: string }
export type GithubStats = { repos: number; stars: number; top: Repo[]; source: 'live' | 'fallback' }
type RawRepo = { name: string; description: string | null; stargazers_count: number; language: string | null; html_url: string; fork: boolean }

const TWELVE_HOURS = 60 * 60 * 12

export function summarizeRepos(publicRepos: number, raw: RawRepo[]): GithubStats {
  const own = raw.filter((r) => !r.fork)
  const stars = own.reduce((sum, r) => sum + r.stargazers_count, 0)
  const top = [...own]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 2)
    .map((r) => ({ name: r.name, description: r.description, stars: r.stargazers_count, language: r.language, url: r.html_url }))
  return { repos: publicRepos, stars, top, source: 'live' }
}

function fromFallback(fallback: { repos?: number | null; stars?: number | null }): GithubStats | null {
  const repos = fallback.repos ?? 0
  const stars = fallback.stars ?? 0
  if (repos <= 0 && stars <= 0) return null
  return { repos, stars, top: [], source: 'fallback' }
}

export async function getGithubStats(
  username: string | null | undefined,
  fallback: { repos?: number | null; stars?: number | null },
): Promise<GithubStats | null> {
  if (!username) return fromFallback(fallback)
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const init = { headers, next: { revalidate: TWELVE_HOURS, tags: ['github'] } } as RequestInit
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, init),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner`, init),
    ])
    if (!userRes.ok || !reposRes.ok) return fromFallback(fallback)
    const user = (await userRes.json()) as { public_repos: number }
    const repos = (await reposRes.json()) as RawRepo[]
    return summarizeRepos(user.public_repos, repos)
  } catch {
    return fromFallback(fallback)
  }
}

export function visibleStats(stats: GithubStats | null): { key: 'repos' | 'stars'; value: number }[] {
  if (!stats) return []
  return (['repos', 'stars'] as const).filter((k) => stats[k] > 0).map((k) => ({ key: k, value: stats[k] }))
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm vitest run tests/unit/github-stats.test.ts
```

- [ ] **Step 5: Components**

`src/components/sections/github-stats.tsx`:

```tsx
import { type GithubStats, visibleStats } from '@/features/github/stats'

export function GithubStatsView({ stats, labels }: { stats: GithubStats | null; labels: { repos: string; stars: string; since: string }; since?: number }) {
  const items = visibleStats(stats)
  if (items.length === 0) return null
  return (
    <dl className="flex gap-6 font-mono text-sm">
      {items.map((i) => (
        <div key={i.key}>
          <dt className="text-xs uppercase text-ink-3">{labels[i.key]}</dt>
          <dd className="text-xl text-ink-0">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
```

`src/components/sections/team-card.tsx`:

```tsx
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { getGithubStats } from '@/features/github/stats'
import { Link } from '@/i18n/navigation'
import type { Media, TeamMember } from '@/payload-types'
import { GithubStatsView } from './github-stats'

export async function TeamCard({ member }: { member: TeamMember }) {
  const t = await getTranslations('common')
  const stats = await getGithubStats(member.github?.username, {
    repos: member.github?.fallbackRepos,
    stars: member.github?.fallbackStars,
  })
  const photo = typeof member.photo === 'object' ? (member.photo as Media | null) : null

  return (
    <Link href={{ pathname: '/team/[slug]', params: { slug: member.slug } }} className="group block h-full" data-reveal>
      <GlassCard className="flex h-full flex-col">
        <div className="flex items-center gap-4">
          {photo?.url ? (
            <Image src={photo.url} alt={photo.alt} width={72} height={72} className="h-18 w-18 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="grid h-[72px] w-[72px] place-items-center rounded-full bg-gradient-to-br from-amber to-amber-deep font-display text-3xl text-bg-0">
              {member.name.charAt(0)}
            </span>
          )}
          <div>
            <h3 className="text-2xl font-semibold">{member.name}</h3>
            <p className="text-sm text-amber">{member.role}</p>
          </div>
        </div>
        <p className="mt-5 text-ink-2">{member.shortBio}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(member.skills ?? []).slice(0, 6).map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <div className="space-y-2 text-xs text-ink-3">
            <p>
              {member.location} · {t('since')} {member.since}
            </p>
            {member.available && (
              <p className="flex items-center gap-2 text-mint">
                <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-mint" /> {t('available')}
              </p>
            )}
          </div>
          <GithubStatsView stats={stats} labels={{ repos: t('repos'), stars: t('stars'), since: t('since') }} />
        </div>
      </GlassCard>
    </Link>
  )
}
```

`src/components/sections/team-preview.tsx`:

```tsx
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { getTeam } from '@/lib/cms/queries'
import { TeamCard } from './team-card'

export async function TeamPreview({ locale, title, lead, as }: { locale: Locale; title: string; lead?: string | null; as?: 'h1' | 'h2' }) {
  const team = await getTeam(locale)
  return (
    <Section id="team" eyebrow="// team" title={title} lead={lead} as={as}>
      <ul className="grid gap-4 lg:grid-cols-3" data-reveal-group>
        {team.map((m) => (
          <li key={m.id}>
            <TeamCard member={m} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

Insert into home after `<ProcessSteps …/>`:

```tsx
<TeamPreview locale={locale} title={home.sections.teamTitle} lead={home.sections.teamLead} />
```

- [ ] **Step 6: Team page `src/app/(frontend)/[locale]/team/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { TeamPreview } from '@/components/sections/team-preview'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome } from '@/lib/cms/queries'

export const revalidate = 3600

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const home = await getHome(locale)
  return (
    <PageShell locale={locale} alternates={localizedPaths('/team')}>
      <TeamPreview locale={locale} title={home.sections.teamTitle} lead={home.sections.teamLead} as="h1" />
      <CtaBand />
    </PageShell>
  )
}
```

- [ ] **Step 7: Member page `src/app/(frontend)/[locale]/team/[slug]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { GithubStatsView } from '@/components/sections/github-stats'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import { getGithubStats } from '@/features/github/stats'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getAllSlugs, getMember } from '@/lib/cms/queries'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return (await getAllSlugs('team-members')).map((s) => ({ slug: s[params.locale as Locale] }))
}

export default async function MemberPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const found = await getMember(locale, slug)
  if (!found) notFound()
  const { doc: m, slugs } = found
  const t = await getTranslations('common')
  const stats = await getGithubStats(m.github?.username, { repos: m.github?.fallbackRepos, stars: m.github?.fallbackStars })

  return (
    <PageShell locale={locale} alternates={localizedPaths('/team/[slug]', slugs)}>
      <section className="steam-glow pt-20 pb-16" aria-labelledby="member-title">
        <Container className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">{m.role}</p>
            <h1 id="member-title" className="mt-3 text-6xl font-semibold sm:text-7xl">{m.name}</h1>
            <p className="mt-8 text-lg leading-relaxed text-ink-1">{m.bio}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {(m.skills ?? []).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
          <GlassCard className="self-start space-y-6">
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-ink-3">{t('location')}</dt>
                <dd className="text-ink-0">{m.location}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink-3">{t('since')}</dt>
                <dd className="text-ink-0">{m.since}</dd>
              </div>
            </dl>
            <GithubStatsView stats={stats} labels={{ repos: t('repos'), stars: t('stars'), since: t('since') }} />
            {stats && stats.top.length > 0 && (
              <div>
                <p className="text-xs uppercase text-ink-3">{t('topRepos')}</p>
                <ul className="mt-3 space-y-3">
                  {stats.top.map((r) => (
                    <li key={r.name}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="block rounded-[var(--radius-sm)] border border-line p-3 hover:border-line-amber">
                        <span className="font-mono text-ink-0">{r.name}</span>
                        <span className="ml-2 text-xs text-amber">★ {r.stars}</span>
                        {r.description && <span className="mt-1 block text-xs text-ink-2">{r.description}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(m.socials ?? []).length > 0 && (
              <ul className="flex flex-wrap gap-3 text-sm">
                {(m.socials ?? []).map((s) => (
                  <li key={s.id ?? s.url}>
                    <a href={s.url} target={s.url.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer me" className="text-amber hover:text-amber-hi">
                      {s.network} {s.handle && `· ${s.handle}`}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </Container>
      </section>
      <CtaBand />
    </PageShell>
  )
}
```

- [ ] **Step 8: Manual check**

`pnpm dev`: home shows 3 cards (Erik, Diego, Juan) with real stats; Erik shows "Repos 3" (fallback) and no stars; disconnect network → cards still show fallback stats or hide the block, never `—`/`0`; `/equipo/juan` lists `nek_deliveryjob` and `nek_vehicleshop`; `/en/team/juan` works from the language switcher.

- [ ] **Step 9: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(team): add team section, member profiles and GitHub stats with fallback"
```
