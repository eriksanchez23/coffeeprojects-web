import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { TeamGrid } from '@/components/sections/team-preview'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome } from '@/lib/cms/queries'

export const revalidate = 3600

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [home, ts] = await Promise.all([getHome(locale), getTranslations('sections')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/team')}>
      <section className="steam-glow pt-20 pb-24" aria-labelledby="team-title">
        <Container>
          <header className="mb-14 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{ts('team')}</p>
            <h1 id="team-title" data-split className="text-5xl font-semibold sm:text-6xl lg:text-7xl">
              {home.sections.teamTitle}
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
