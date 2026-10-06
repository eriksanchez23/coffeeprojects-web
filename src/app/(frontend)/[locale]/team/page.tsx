import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { TeamGrid } from '@/components/sections/team-preview'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome } from '@/lib/cms/queries'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [home, t, tn] = await Promise.all([getHome(locale), getTranslations({ locale, namespace: 'meta' }), getTranslations({ locale, namespace: 'nav' })])
  return buildMetadata({
    locale,
    paths: localizedPaths('/team'),
    title: home.sections.teamTitle || tn('team'),
    description: home.sections.teamLead || t('defaultDescription'),
  })
}

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [home, ts, tn] = await Promise.all([getHome(locale), getTranslations('sections'), getTranslations('nav')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/team')}>
      <JsonLd
        data={breadcrumbLd([
          { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
          { name: tn('team'), url: absoluteUrl(localizedPaths('/team')[locale]) },
        ])}
      />
      <section className="steam-glow pt-20 pb-24" aria-labelledby="team-title">
        <Container>
          <header className="mb-14 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{ts('team')}</p>
            <h1 id="team-title" data-split className="text-5xl font-semibold sm:text-6xl lg:text-7xl">
              {home.sections.teamTitle || tn('team')}
            </h1>
            {home.sections.teamLead && <p className="mt-6 text-lg text-ink-2">{home.sections.teamLead}</p>}
          </header>
          <TeamGrid locale={locale} headingAs="h2" />
        </Container>
      </section>
      <CtaBand />
    </PageShell>
  )
}
