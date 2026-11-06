import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ServicesGrid } from '@/components/sections/services-grid'
import { Container } from '@/components/ui/container'
import { JsonLd } from '@/components/seo/json-ld'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getServices } from '@/lib/cms/queries'
import { otherServices } from '@/lib/services'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'otherDevelopment' })
  return buildMetadata({ locale, paths: localizedPaths('/other-development'), title: t('seoTitle'), description: t('seoDescription') })
}

/** Secondary line (custom software, Discord bots, FiveM): reachable from the footer and /services, never the main menu. */
export default async function OtherDevelopmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [services, t, tn] = await Promise.all([getServices(locale), getTranslations('otherDevelopment'), getTranslations('nav')])
  const alternates = localizedPaths('/other-development')
  return (
    <PageShell locale={locale} alternates={alternates}>
      <JsonLd
        data={breadcrumbLd([
          { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
          { name: tn('otherDevelopment'), url: absoluteUrl(alternates[locale]) },
        ])}
      />
      <section className="py-20 sm:py-24" aria-labelledby="other-title">
        <Container>
          <nav aria-label={tn('breadcrumb')} className="mb-8 text-sm text-ink-3">
            <Link href="/" className="hover:text-ink-0">{tn('home')}</Link>
            <span aria-hidden className="mx-2">/</span>
            <Link href="/services" className="hover:text-ink-0">{tn('services')}</Link>
          </nav>
          <header className="mb-12 max-w-3xl">
            <h1 id="other-title" className="text-4xl font-semibold sm:text-5xl">{t('title')}</h1>
            <p className="mt-6 text-lg text-ink-2">{t('lead')}</p>
          </header>
          <h2 className="sr-only">{t('listLabel')}</h2>
          <ServicesGrid services={otherServices(services)} locale={locale} compact />
        </Container>
      </section>
      <CtaBand defaultType="custom" />
    </PageShell>
  )
}
