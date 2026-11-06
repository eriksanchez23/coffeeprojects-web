import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { PricingPlans } from '@/components/sections/pricing-plans'
import { JsonLd } from '@/components/seo/json-ld'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getPricing, getServices } from '@/lib/cms/queries'
import { serviceForType } from '@/features/contact/quote'
import { Button } from '@/components/ui/button'
import { contactHref, formatEuro } from '@/lib/format'
import { completeWebPlans } from '@/lib/pricing'
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
  const [pricing, services, tn, tp, tc] = await Promise.all([
    getPricing(locale),
    getServices(locale),
    getTranslations('nav'),
    getTranslations('pricing'),
    getTranslations('common'),
  ])
  // Existing websites are not priced as plans: a redesign starts at the service's "from" price, after the free review.
  const redesign = serviceForType('redesign', services)
  const redesignPrice =
    redesign?.pricing.mode === 'one-off' && redesign.pricing.amount != null
      ? `${formatEuro(redesign.pricing.amount, locale)} ${tc('plusVat')}`
      : null
  // Not seeded / not published yet (or only pre-v4 rows without prices): no half-empty pricing page.
  if (!pricing.title || completeWebPlans(pricing.packages).length === 0) notFound()
  const paths = localizedPaths('/pricing')
  const pageUrl = absoluteUrl(paths[locale])

  return (
    <PageShell locale={locale} alternates={paths}>
      <JsonLd
        data={[
          pricingLd(pricing, pageUrl, { withMaintenance: tp('withMaintenance'), webOnly: tp('webOnly') }),
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: tn('pricing'), url: pageUrl },
          ]),
        ]}
      />
      <section className="hero-wash relative pt-20 pb-24 sm:pt-28 sm:pb-32" aria-labelledby="pricing-title">
        <Container>
          <header className="mb-14 max-w-3xl sm:mb-20">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-amber">{pricing.eyebrow}</p>
            <h1 id="pricing-title" className="text-4xl font-semibold leading-tight sm:text-6xl">
              {pricing.title}
            </h1>
            {pricing.subtitle && <p className="mt-6 text-xl text-ink-1">{pricing.subtitle}</p>}
            {pricing.intro && <p className="mt-3 text-ink-2">{pricing.intro}</p>}
          </header>
          {redesign && redesignPrice && (
            <aside
              data-reveal
              className="on-dark mb-16 flex flex-col gap-6 rounded-[var(--radius-lg)] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8"
            >
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold">{tp('redesignTitle')}</h2>
                <p className="mt-2 text-ink-2">{tp('redesignText', { price: redesignPrice })}</p>
              </div>
              <Button href={contactHref('audit')} size="lg" className="shrink-0">
                {tc('requestReview')}
              </Button>
            </aside>
          )}
          <PricingPlans pricing={pricing} locale={locale} />
        </Container>
      </section>
    </PageShell>
  )
}
