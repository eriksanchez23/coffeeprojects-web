import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { PricingPlans } from '@/components/sections/pricing-plans'
import { JsonLd } from '@/components/seo/json-ld'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getPricing } from '@/lib/cms/queries'
import { breadcrumbLd, pricingLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const pricing = await getPricing(locale)
  if (!pricing.title) return {}
  return buildMetadata({
    locale,
    paths: localizedPaths('/pricing'),
    title: pricing.seo?.title || pricing.title,
    description: pricing.seo?.description || pricing.intro || pricing.subtitle || pricing.title,
  })
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [pricing, tn] = await Promise.all([getPricing(locale), getTranslations('nav')])
  // Not seeded / not published yet: no half-empty pricing page.
  if (!pricing.title || (pricing.packages ?? []).length === 0) notFound()
  const paths = localizedPaths('/pricing')
  const pageUrl = absoluteUrl(paths[locale])

  return (
    <PageShell locale={locale} alternates={paths}>
      <JsonLd
        data={[
          pricingLd(pricing, pageUrl, locale),
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: tn('pricing'), url: pageUrl },
          ]),
        ]}
      />
      <section className="steam-glow relative pt-20 pb-24 sm:pt-28 sm:pb-32" aria-labelledby="pricing-title">
        <Container>
          <header className="mb-14 max-w-3xl sm:mb-20">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{pricing.eyebrow}</p>
            <h1 id="pricing-title" className="text-4xl font-semibold leading-tight sm:text-6xl">
              {pricing.title}
            </h1>
            {pricing.subtitle && <p className="mt-6 text-xl text-ink-1">{pricing.subtitle}</p>}
            {pricing.intro && <p className="mt-3 text-ink-2">{pricing.intro}</p>}
          </header>
          <PricingPlans pricing={pricing} locale={locale} />
        </Container>
      </section>
    </PageShell>
  )
}
