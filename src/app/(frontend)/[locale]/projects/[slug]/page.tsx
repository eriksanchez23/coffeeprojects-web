import Image from 'next/image'
import type { Metadata } from 'next'
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
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, projectLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const all = await getAllSlugs('projects')
  return all.flatMap((s) => {
    const slug = s[params.locale as Locale]
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
  const [t, tn] = await Promise.all([getTranslations('common'), getTranslations('nav')])
  const pageUrl = absoluteUrl(localizedPaths('/projects/[slug]', slugs)[locale])
  const url = projectPublicUrl(p)
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  const gallery = (p.gallery ?? []).filter((g): g is Media => typeof g === 'object' && g !== null && Boolean(g.url))

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
        <header className="steam-glow pt-20 pb-12">
          <Container>
            <div className="flex flex-wrap gap-2">
              <Badge>{p.category}</Badge>
              <Badge>{p.status === 'live' ? t('live') : t('inProgress')}</Badge>
              {p.nda && <Badge>{t('nda')}</Badge>}
              <Badge>{p.year}</Badge>
            </div>
            <h1 id="project-title" className="mt-6 text-5xl font-semibold sm:text-7xl">
              {p.title}
            </h1>
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
                  <Image src={g.url as string} alt={g.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
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
