import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { FaqList } from '@/components/sections/faq-list'
import { Hero } from '@/components/sections/hero'
import { ProcessSteps } from '@/components/sections/process-steps'
import { ServicesGrid } from '@/components/sections/services-grid'
import { StackMarquee } from '@/components/sections/stack-marquee'
import { StatsBento } from '@/components/sections/stats-bento'
import { TeamPreview } from '@/components/sections/team-preview'
import { WhyUs } from '@/components/sections/why-us'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getFaqs, getHome, getServices } from '@/lib/cms/queries'

export const revalidate = 3600

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
      <Hero hero={home.hero} />
      <StatsBento stats={home.stats ?? []} />
      <Section id="services" eyebrow={ts('services')} title={home.sections.servicesTitle} lead={home.sections.servicesLead}>
        <ServicesGrid services={services} locale={locale} />
      </Section>
      <WhyUs title={home.sections.whyTitle} items={home.whyUs ?? []} />
      <ProcessSteps title={home.sections.processTitle} steps={home.process ?? []} />
      <TeamPreview locale={locale} title={home.sections.teamTitle} lead={home.sections.teamLead} />
      {/* T10: <ProjectsPreview /> slots in here */}
      <StackMarquee title={home.sections.stackTitle} items={home.stack ?? []} />
      <FaqList title={t('faqTitle')} items={faqs} />
      <CtaBand />
    </PageShell>
  )
}
