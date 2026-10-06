import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ServicesGrid } from '@/components/sections/services-grid'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome, getServices } from '@/lib/cms/queries'

export const revalidate = 3600

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [home, services, ts] = await Promise.all([getHome(locale), getServices(locale), getTranslations('sections')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/services')}>
      {/* The section title is the page title here, so it is the page's single <h1>. */}
      <section className="steam-glow relative py-24 sm:py-32" aria-labelledby="services-title">
        <Container>
          <header className="mb-14 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{ts('services')}</p>
            <h1 id="services-title" className="text-5xl font-semibold sm:text-7xl">
              {home.sections.servicesTitle}
            </h1>
            <p className="mt-6 text-lg text-ink-2">{home.sections.servicesLead}</p>
          </header>
          <h2 className="sr-only">{ts('servicesList')}</h2>
          <ServicesGrid services={services} locale={locale} />
        </Container>
      </section>
      <CtaBand />
    </PageShell>
  )
}
