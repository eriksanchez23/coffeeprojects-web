import Image from 'next/image'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { BrowserFrame, PhoneFrame, SiteSketch } from '@/components/showcase/device-frames'
import { RichText } from '@/components/ui/rich-text'
import type { Locale } from '@/i18n/locales'
import { Link } from '@/i18n/navigation'
import { localizedPaths } from '@/i18n/paths'
import { getAllSlugs, getProject, getProjects } from '@/lib/cms/queries'
import { coverGradient, projectPublicUrl } from '@/lib/project-view'
import type { Media } from '@/payload-types'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, projectLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const all = await getAllSlugs('projects')
  return all.flatMap((s) => {
    const slug = s.slugs[params.locale as Locale]
    return slug ? [{ slug }] : []
  })
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const found = await getProject(locale, slug)
  if (!found) return {}
  const { doc: p, slugs } = found
  return buildMetadata({
    locale,
    paths: localizedPaths('/projects/[slug]', slugs),
    title: p.seo?.title || p.title,
    description: p.seo?.description || p.summary,
  })
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const found = await getProject(locale, slug)
  if (!found) notFound()
  const { doc: p, slugs } = found
  const [t, tn, tp, all] = await Promise.all([
    getTranslations('common'),
    getTranslations('nav'),
    getTranslations('projects'),
    getProjects(locale),
  ])
  // Previous / next project, in the same order as the projects page (websites first, then apps), wrapping around.
  const webKinds = ['new-website', 'redesign', 'store']
  const ordered = [...all.filter((x) => webKinds.includes(x.kind ?? 'other')), ...all.filter((x) => !webKinds.includes(x.kind ?? 'other'))]
  const index = ordered.findIndex((x) => x.id === p.id)
  const prev = index >= 0 && ordered.length > 1 ? ordered[(index - 1 + ordered.length) % ordered.length] : undefined
  const next = index >= 0 && ordered.length > 1 ? ordered[(index + 1) % ordered.length] : undefined
  const stack = p.stack ?? []
  const pageUrl = absoluteUrl(localizedPaths('/projects/[slug]', slugs)[locale])
  const url = projectPublicUrl(p)
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  const gallery = (p.gallery ?? []).filter((g): g is Media => typeof g === 'object' && g !== null && Boolean(g.url))
  // Portrait images are phone captures: shown in a phone frame; the rest as plain screenshots.
  const isPortrait = (g: Media) => (g.height ?? 0) > (g.width ?? 0)
  const phones = gallery.filter(isPortrait)
  const screens = gallery.filter((g) => !isPortrait(g))

  return (
    <PageShell locale={locale} alternates={localizedPaths('/projects/[slug]', slugs)}>
      <JsonLd
        data={[
          projectLd(p, pageUrl),
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: tn('projects'), url: absoluteUrl(localizedPaths('/projects')[locale]) },
            { name: p.title, url: pageUrl },
          ]),
        ]}
      />
      <article aria-labelledby="project-title">
        <header className="hero-wash pt-16 pb-12">
          <Container className="max-w-5xl">
            <nav aria-label={tn('breadcrumb')} className="mb-8 text-sm text-ink-3">
              <Link href="/" className="hover:text-ink-0">{tn('home')}</Link>
              <span aria-hidden className="mx-2">/</span>
              <Link href="/projects" className="hover:text-ink-0">{tn('projects')}</Link>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">
              {[p.sector || p.category, tp(`kinds.${p.kind ?? 'other'}`), p.year].filter(Boolean).join(' · ')}
            </p>
            <h1 id="project-title" className="mt-4 text-4xl font-semibold sm:text-5xl">
              {p.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-ink-2">{p.summary}</p>
            {(p.concept || p.nda) && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {p.concept && <Badge>{tp('concept')}</Badge>}
                {p.nda && <Badge>{t('nda')}</Badge>}
              </div>
            )}
            {p.concept && <p className="mt-4 max-w-3xl text-sm text-ink-3">{tp('conceptNote')}</p>}
            {p.nda && <p className="mt-4 max-w-3xl text-sm text-ink-3">{tp('ndaNote')}</p>}
            <section aria-labelledby="project-details" className="mt-10 rounded-[var(--radius-lg)] border border-line bg-bg-1/80 p-6 shadow-[var(--shadow-soft)] sm:p-7" data-testid="project-details">
              <h2 id="project-details" className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">
                {tp('details')}
              </h2>
              <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.6fr_1fr_1fr]">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-3">{tp('website')}</dt>
                  <dd className="mt-1.5">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline"
                        data-testid="project-url"
                      >
                        <span className="truncate">{new URL(url).hostname}</span> <span aria-hidden>↗</span>
                      </a>
                    ) : (
                      <span className="text-ink-2">{p.nda ? tp('private') : tp('notPublic')}</span>
                    )}
                  </dd>
                </div>
                {stack.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-ink-3">{tp('technologies')}</dt>
                    <dd className="mt-1.5">
                      <ul className="flex flex-wrap gap-1.5" data-testid="project-stack">
                        {stack.map((s) => (
                          <li key={s} className="rounded-full bg-bg-2 px-2.5 py-1 font-mono text-xs text-ink-1">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-3">{tp('type')}</dt>
                  <dd className="mt-1.5 text-ink-0">{[tp(`kinds.${p.kind ?? 'other'}`), p.sector].filter(Boolean).join(' · ')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-3">{tp('status')}</dt>
                  <dd className="mt-1.5 text-ink-0">
                    {p.status === 'in-progress' ? tp('inProgress') : tp('live')}
                    {p.year ? <span className="text-ink-3"> · {p.year}</span> : null}
                  </dd>
                </div>
              </dl>
            </section>
          </Container>
        </header>
        <Container className="max-w-5xl">
          <BrowserFrame url={url ? new URL(url).hostname : undefined}>
            {cover?.url ? (
              <Image src={cover.url} alt={cover.alt} width={cover.width ?? 1600} height={cover.height ?? 1000} preload sizes="(min-width: 1024px) 1024px, 100vw" className="block h-auto w-full" />
            ) : (
              <div style={{ background: coverGradient(p.slug) }} className="p-8 sm:p-14">
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-line shadow-[var(--shadow-soft)]">
                  <SiteSketch />
                </div>
              </div>
            )}
          </BrowserFrame>

          {(p.challenge || p.solution) && (
            <div className="mt-16 grid gap-10 md:grid-cols-2">
              {p.challenge && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">{tp('challenge')}</h2>
                  <p className="mt-4 text-lg text-ink-1">{p.challenge}</p>
                </section>
              )}
              {p.solution && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">{tp('solution')}</h2>
                  <p className="mt-4 text-lg text-ink-1">{p.solution}</p>
                </section>
              )}
            </div>
          )}

          {(p.results ?? []).length > 0 && (
            <section className="mt-16">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">{tp('results')}</h2>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(p.results ?? []).map((r, i) => (
                  <div key={r.id ?? i} className="rounded-[var(--radius-lg)] border border-line bg-bg-1 p-6">
                    <dt className="text-sm text-ink-2">{r.label}</dt>
                    <dd className="mt-2 text-3xl font-semibold text-ink-0">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {p.body && <RichText data={p.body} className="mx-auto mt-16 max-w-3xl" />}
          {phones.length > 0 && (
            <ul className="mt-16 flex flex-wrap justify-center gap-8">
              {phones.map((g) => (
                <li key={g.id} data-reveal className="w-[min(70vw,260px)]">
                  <PhoneFrame>
                    <Image src={g.url as string} alt={g.alt} width={g.width ?? 780} height={g.height ?? 1688} sizes="260px" className="block h-auto w-full" />
                  </PhoneFrame>
                </li>
              ))}
            </ul>
          )}
          {screens.length > 0 && (
            <ul className="mt-16 grid gap-4 md:grid-cols-2">
              {screens.map((g) => (
                <li key={g.id} data-reveal className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-line">
                  <Image src={g.url as string} alt={g.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-top" />
                </li>
              ))}
            </ul>
          )}
          {(prev || next) && (
            <nav aria-label={tn('projects')} className="mt-20 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
              {prev && (
                <Link
                  href={{ pathname: '/projects/[slug]', params: { slug: prev.slug } }}
                  className="group rounded-[var(--radius-md)] border border-line p-5 transition-colors hover:border-line-amber"
                  data-testid="project-prev"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">← {tp('prevProject')}</span>
                  <span className="mt-1 block font-semibold text-ink-0 group-hover:text-brand">{prev.title}</span>
                </Link>
              )}
              {next && (
                <Link
                  href={{ pathname: '/projects/[slug]', params: { slug: next.slug } }}
                  className="group rounded-[var(--radius-md)] border border-line p-5 text-right transition-colors hover:border-line-amber sm:col-start-2"
                  data-testid="project-next"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">{tp('nextProject')} →</span>
                  <span className="mt-1 block font-semibold text-ink-0 group-hover:text-brand">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </Container>
      </article>
      <CtaBand />
    </PageShell>
  )
}
