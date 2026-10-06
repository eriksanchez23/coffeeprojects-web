import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { FaqList } from '@/components/sections/faq-list'
import { ServiceIcon } from '@/components/sections/service-icon'
import { ServicesGrid } from '@/components/sections/services-grid'
import { TrackViewContent } from '@/components/tracking/track-view-content'
import { Badge } from '@/components/ui/badge'
import { Button, buttonClasses } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import { RichText } from '@/components/ui/rich-text'
import { Section } from '@/components/ui/section'
import { type Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getAllSlugs, getFaqs, getService, getServices } from '@/lib/cms/queries'
import { contactHref, formatPriceParts } from '@/lib/format'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, faqLd, serviceLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const all = await getAllSlugs('services')
  return all.map((slugs) => ({ slug: slugs[params.locale as Locale] }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const found = await getService(locale, slug)
  if (!found) return {}
  const { doc: s, slugs } = found
  return buildMetadata({
    locale,
    paths: localizedPaths('/services/[slug]', slugs),
    title: s.seo?.title || s.title,
    description: s.seo?.description || s.summary,
  })
}

export default async function ServicePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const found = await getService(locale, slug)
  if (!found) notFound()
  const { doc: s, slugs } = found

  const [all, faqs, t, ts, tn] = await Promise.all([
    getServices(locale),
    getFaqs(locale),
    getTranslations('common'),
    getTranslations('sections'),
    getTranslations('nav'),
  ])
  const labels = { from: t('from'), perMonth: t('perMonth'), custom: t('custom'), seeStore: t('seeStore') }
  const serviceFaq = (s.faq ?? []).map((f, i) => ({ id: f.id ?? i, question: f.question, answer: f.answer }))
  const faqItems = serviceFaq.length > 0 ? serviceFaq : faqs.slice(0, 4)
  const storeUrl = s.pricing.mode === 'store' ? s.pricing.storeUrl : null
  const price = formatPriceParts(s.pricing, locale, labels)
  const pageUrl = absoluteUrl(localizedPaths('/services/[slug]', slugs)[locale])

  return (
    <PageShell locale={locale} alternates={localizedPaths('/services/[slug]', slugs)}>
      <JsonLd
        data={[
          serviceLd(s, pageUrl, locale),
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: tn('services'), url: absoluteUrl(localizedPaths('/services')[locale]) },
            { name: s.title, url: pageUrl },
          ]),
          ...(faqItems.length > 0 ? [faqLd(faqItems)] : []),
        ]}
      />
      <TrackViewContent name={s.title} category={s.contactType} />
      <section className="steam-glow pt-20 pb-16" aria-labelledby="service-title">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <ServiceIcon name={s.icon} className="h-10 w-10 text-amber" />
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-amber">{s.title}</p>
            <h1 id="service-title" data-split className="mt-3 text-5xl font-semibold leading-tight sm:text-6xl">
              {s.promise}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">{s.summary}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href={contactHref(s.contactType)} size="lg" data-magnetic>
                {t('requestQuote')}
              </Button>
              {storeUrl && (
                <a href={storeUrl} className={buttonClasses({ size: 'lg', variant: 'outline' })} target="_blank" rel="noopener noreferrer">
                  {t('seeStore')} ↗
                </a>
              )}
            </div>
          </div>
          <GlassCard className="self-start">
            <dl className="grid gap-6">
              <div>
                <dt className={price.prefix ? 'text-xs uppercase tracking-widest text-ink-3' : 'sr-only'}>{price.prefix ?? t('price')}</dt>
                <dd className="font-display text-4xl text-amber-hi">{price.figure}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink-3">{t('typicalTime')}</dt>
                <dd className="text-xl text-ink-0">{s.typicalTime}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                {(s.tags ?? []).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              {s.note && <p className="text-sm text-ink-2">{s.note}</p>}
            </dl>
          </GlassCard>
        </Container>
      </section>

      <Section eyebrow={ts('includes')} title={t('deliverables')}>
        <ul className="grid gap-4 sm:grid-cols-2" data-reveal-group>
          {(s.features ?? []).map((f, i) => (
            <li key={f.id ?? i} data-reveal className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line bg-bg-1 p-5">
              <span aria-hidden className="mt-1 text-mint">✓</span>
              <span className="text-ink-0">{f.text}</span>
            </li>
          ))}
        </ul>
        {s.body && <RichText data={s.body} className="mt-12" />}
      </Section>

      <FaqList title={t('faqTitle')} items={faqItems} />

      <Section eyebrow={ts('more')} title={t('otherServices')}>
        <ServicesGrid services={all.filter((o) => o.id !== s.id).slice(0, 3)} locale={locale} />
      </Section>
      <CtaBand defaultType={s.contactType} />
    </PageShell>
  )
}
