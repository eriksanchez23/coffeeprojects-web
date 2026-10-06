import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { FaqList } from '@/components/sections/faq-list'
import { Hero } from '@/components/sections/hero'
import { ProcessSteps } from '@/components/sections/process-steps'
import { ProjectsPreview } from '@/components/sections/projects-preview'
import { ServicesGrid } from '@/components/sections/services-grid'
import { StackMarquee } from '@/components/sections/stack-marquee'
import { StatsBento } from '@/components/sections/stats-bento'
import { TeamPreview } from '@/components/sections/team-preview'
import { WhyUs } from '@/components/sections/why-us'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getFaqs, getHome, getServices, getSettings } from '@/lib/cms/queries'
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
  const [home, services, faqs, t, ts] = await Promise.all([
    getHome(locale),
    getServices(locale),
    getFaqs(locale),
    getTranslations('common'),
    getTranslations('sections'),
  ])

  return (
    <PageShell locale={locale} alternates={localizedPaths('/')}>
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
      <Hero hero={home.hero} />
      <StatsBento stats={home.stats ?? []} />
      <Section id="services" eyebrow={ts('services')} title={home.sections.servicesTitle} lead={home.sections.servicesLead}>
        <ServicesGrid services={services} locale={locale} />
      </Section>
      <WhyUs title={home.sections.whyTitle} items={home.whyUs ?? []} />
      <ProcessSteps title={home.sections.processTitle} steps={home.process ?? []} />
      <TeamPreview locale={locale} title={home.sections.teamTitle} lead={home.sections.teamLead} />
      <ProjectsPreview locale={locale} title={home.sections.projectsTitle} lead={home.sections.projectsLead} />
      <StackMarquee title={home.sections.stackTitle} items={home.stack ?? []} />
      <FaqList title={t('faqTitle')} items={faqs} />
      <CtaBand />
    </PageShell>
  )
}
