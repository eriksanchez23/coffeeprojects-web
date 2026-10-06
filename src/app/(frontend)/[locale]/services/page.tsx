import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ServicesGrid } from '@/components/sections/services-grid'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome, getServices } from '@/lib/cms/queries'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [home, t, tn] = await Promise.all([getHome(locale), getTranslations({ locale, namespace: 'meta' }), getTranslations({ locale, namespace: 'nav' })])
  return buildMetadata({
    locale,
    paths: localizedPaths('/services'),
    title: home.sections.servicesTitle || tn('services'),
    description: home.sections.servicesLead || t('defaultDescription'),
  })
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [home, services, ts, tn] = await Promise.all([getHome(locale), getServices(locale), getTranslations('sections'), getTranslations('nav')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/services')}>
      <JsonLd
        data={breadcrumbLd([
          { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
          { name: tn('services'), url: absoluteUrl(localizedPaths('/services')[locale]) },
        ])}
      />
      {/* The section title is the page title here, so it is the page's single <h1>. */}
      <section className="steam-glow relative py-24 sm:py-32" aria-labelledby="services-title">
        <Container>
          <header className="mb-14 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{ts('services')}</p>
            <h1 id="services-title" className="text-5xl font-semibold sm:text-7xl">
              {home.sections.servicesTitle || tn('services')}
            </h1>
            {home.sections.servicesLead && <p className="mt-6 text-lg text-ink-2">{home.sections.servicesLead}</p>}
          </header>
          <h2 className="sr-only">{ts('servicesList')}</h2>
          <ServicesGrid services={services} locale={locale} />
        </Container>
      </section>
      <CtaBand />
    </PageShell>
  )
}
