import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { AuditOffer } from '@/components/sections/audit-offer'
import { CtaBand } from '@/components/sections/cta-band'
import { FaqList } from '@/components/sections/faq-list'
import { Hero } from '@/components/sections/hero'
import { ProcessSteps } from '@/components/sections/process-steps'
import { ProjectsPreview } from '@/components/sections/projects-preview'
import { TrustStrip } from '@/components/sections/trust-strip'
import { TwoPaths } from '@/components/sections/two-paths'
import { WhyUs } from '@/components/sections/why-us'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getFaqs, getHome, getPricing, getProjects, getServices, getSettings } from '@/lib/cms/queries'
import { pickShowcase } from '@/lib/showcase'
import { formatPrice } from '@/lib/format'
import { completeWebPlans } from '@/lib/pricing'
import { serviceForType } from '@/features/contact/quote'
import { JsonLd } from '@/components/seo/json-ld'
import { buildMetadata } from '@/lib/seo/metadata'
import { faqLd } from '@/lib/seo/jsonld'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations({ locale, namespace: 'meta' })])
  return buildMetadata({
    locale,
    paths: localizedPaths('/'),
    title: settings.defaultSeo?.title || t('defaultTitle'),
    description: settings.defaultSeo?.description || t('defaultDescription'),
  })
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const [home, services, pricing, faqs, projects, tc, tn, tm] = await Promise.all([
    getHome(locale),
    getServices(locale),
    getPricing(locale),
    getFaqs(locale),
    getProjects(locale, { featuredOnly: true }),
    getTranslations('common'),
    getTranslations('nav'),
    getTranslations('meta'),
  ])
  // Unseeded/unpublished home global: translated fallbacks, and lists that have no items are skipped.
  const hero = { ...home.hero, headline: home.hero.headline || tm('defaultTitle'), subheadline: home.hero.subheadline || tm('defaultDescription') }
  const { sections } = home
  const priceLabels = { from: tc('from'), perMonth: tc('perMonth'), custom: tc('custom'), seeStore: tc('seeStore'), vat: tc('plusVat') }
  const extras = (['ecommerce', 'maintenance'] as const)
    .map((type) => serviceForType(type, services))
    .filter((s) => s !== undefined)
    .map((service) => ({ service, price: formatPrice(service.pricing, locale, priceLabels) }))

  return (
    <PageShell locale={locale} alternates={localizedPaths('/')}>
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
      <Hero hero={hero} slides={pickShowcase(projects)} />
      <TrustStrip items={home.guarantees ?? []} sectorsLine={home.sectorsLine} />
      <TwoPaths
        paths={home.paths ?? {}}
        newService={serviceForType('web', services)}
        redesignService={serviceForType('redesign', services)}
        extras={extras}
        plans={completeWebPlans(pricing.packages)}
        locale={locale}
        vat={pricing.vatNote ?? ''}
      />
      {home.audit && <AuditOffer audit={home.audit} />}
      <ProjectsPreview locale={locale} title={sections.projectsTitle || tn('projects')} lead={sections.projectsLead} kinds={['new-website', 'redesign', 'store']} layout="carousel" />
      {(home.process ?? []).length > 0 && <ProcessSteps title={sections.processTitle} steps={home.process ?? []} className="bg-bg-2" />}
      {(home.whyUs ?? []).length > 0 && <WhyUs title={sections.whyTitle} items={home.whyUs ?? []} />}
      {faqs.length > 0 && <FaqList title={tc('faqTitle')} items={faqs} />}
      <CtaBand />
    </PageShell>
  )
}
