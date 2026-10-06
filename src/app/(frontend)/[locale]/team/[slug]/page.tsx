import type { Metadata } from 'next'
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
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, personLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const all = await getAllSlugs('team-members')
  return all.flatMap((s) => {
    const slug = s[params.locale as Locale]
    return slug ? [{ slug }] : []
  })
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const found = await getMember(locale, slug)
  if (!found) return {}
  const { doc: m, slugs } = found
  return buildMetadata({
    locale,
    paths: localizedPaths('/team/[slug]', slugs),
    title: m.seo?.title || `${m.name} — ${m.role}`,
    description: m.seo?.description || m.shortBio,
  })
}

export default async function MemberPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const found = await getMember(locale, slug)
  if (!found) notFound()
  const { doc: m, slugs } = found
  const [t, tn] = await Promise.all([getTranslations('common'), getTranslations('nav')])
  const pageUrl = absoluteUrl(localizedPaths('/team/[slug]', slugs)[locale])
  const stats = await getGithubStats(m.github?.username, { repos: m.github?.fallbackRepos, stars: m.github?.fallbackStars })
  const socials = m.socials ?? []

  return (
    <PageShell locale={locale} alternates={localizedPaths('/team/[slug]', slugs)}>
      <JsonLd
        data={[
          personLd(m, pageUrl),
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: tn('team'), url: absoluteUrl(localizedPaths('/team')[locale]) },
            { name: m.name, url: pageUrl },
          ]),
        ]}
      />
      <section className="steam-glow pt-20 pb-16" aria-labelledby="member-title">
        <Container className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">{m.role}</p>
            <h1 id="member-title" className="mt-3 text-6xl font-semibold sm:text-7xl">
              {m.name}
            </h1>
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
            <GithubStatsView stats={stats} labels={{ repos: t('repos'), stars: t('stars') }} />
            {stats && stats.top.length > 0 && (
              <div>
                <h2 className="text-xs font-normal uppercase text-ink-3">{t('topRepos')}</h2>
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
            {socials.length > 0 && (
              <ul aria-label={t('socials')} className="flex flex-wrap gap-3 text-sm">
                {socials.map((s) => (
                  <li key={s.id ?? s.url}>
                    <a href={s.url} target={s.url.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer me" className="text-amber hover:text-amber-hi">
                      {s.network}
                      {s.handle && ` · ${s.handle}`}
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
