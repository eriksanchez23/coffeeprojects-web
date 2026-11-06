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
import { Link } from '@/i18n/navigation'
import { localizedPaths } from '@/i18n/paths'
import { getAllSlugs, getFaqs, getService, getServices } from '@/lib/cms/queries'
import { contactHref, formatPriceParts } from '@/lib/format'
import { isWebService } from '@/lib/services'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, faqLd, serviceLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const all = await getAllSlugs('services')
  return all.map((s) => ({ slug: s.slugs[params.locale as Locale] }))
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

  const [all, faqs, t, ts, tn, tp] = await Promise.all([
    getServices(locale),
    getFaqs(locale),
    getTranslations('common'),
    getTranslations('sections'),
    getTranslations('nav'),
    getTranslations('pricing'),
  ])
  const labels = { from: t('from'), perMonth: t('perMonth'), custom: t('custom'), seeStore: t('seeStore'), vat: t('plusVat') }
  const serviceFaq = (s.faq ?? []).map((f, i) => ({ id: f.id ?? i, question: f.question, answer: f.answer }))
  const faqItems = serviceFaq.length > 0 ? serviceFaq : faqs.slice(0, 4)
  const storeUrl = s.pricing.mode === 'store' ? s.pricing.storeUrl : null
  const price = formatPriceParts(s.pricing, locale, labels)
  const pageUrl = absoluteUrl(localizedPaths('/services/[slug]', slugs)[locale])
  const mainLine = isWebService(s)
  const parent = mainLine
    ? { name: tn('services'), href: '/services' as const }
    : { name: tn('otherDevelopment'), href: '/other-development' as const }
  const isRedesign = s.contactType === 'redesign'

  return (
    <PageShell locale={locale} alternates={localizedPaths('/services/[slug]', slugs)}>
      <JsonLd
        data={[
          serviceLd(s, pageUrl, locale),
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: parent.name, url: absoluteUrl(localizedPaths(parent.href)[locale]) },
            { name: s.title, url: pageUrl },
          ]),
          ...(faqItems.length > 0 ? [faqLd(faqItems)] : []),
        ]}
      />
      <TrackViewContent name={s.title} category={s.contactType} />
      <section className="hero-wash pt-20 pb-16" aria-labelledby="service-title">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <nav aria-label={tn('breadcrumb')} className="mb-8 text-sm text-ink-3">
              <Link href="/" className="hover:text-ink-0">{tn('home')}</Link>
              <span aria-hidden className="mx-2">/</span>
              <Link href={parent.href} className="hover:text-ink-0">{parent.name}</Link>
            </nav>
            <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-bg-2 text-brand">
              <ServiceIcon name={s.icon} className="h-6 w-6" />
            </span>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-amber">{s.title}</p>
            <h1 id="service-title" data-split className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {s.promise}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">{s.summary}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href={isRedesign ? contactHref('audit') : contactHref(s.contactType)} size="lg">
                {isRedesign ? t('requestReview') : t('requestQuote')}
              </Button>
              {storeUrl && (
                <a href={storeUrl} className={buttonClasses({ size: 'lg', variant: 'outline' })} target="_blank" rel="noopener noreferrer">
                  {t('seeStore')} ↗
                </a>
              )}
            </div>
          </div>
          <GlassCard className="grid gap-6 self-start">
            {/* Only dt/dd groups may live inside <dl>; tags and the note follow it. */}
            <dl className="grid gap-6">
              <div>
                <dt className={price.prefix && !isRedesign ? 'text-xs font-semibold uppercase tracking-wider text-ink-3' : 'sr-only'}>{isRedesign ? t('price') : (price.prefix ?? t('price'))}</dt>
                <dd className="text-3xl font-semibold text-ink-0">
                  {isRedesign ? t('freeReview') : price.figure}
                  {price.vat && <span className="ml-2 font-sans text-sm text-ink-2">{' '}{price.vat}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{t('typicalTime')}</dt>
                <dd className="text-xl text-ink-0">{s.typicalTime}</dd>
              </div>
            </dl>
            {(s.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(s.tags ?? []).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
            {s.note && <p className="text-sm text-ink-2">{s.note}</p>}
            {/* Web, online stores and maintenance are priced as plans on /pricing (S15). */}
            {(s.contactType === 'web' || s.contactType === 'ecommerce' || s.contactType === 'maintenance') && (
              <Link href="/pricing" className="text-sm font-medium text-amber hover:text-amber-hi">
                {tp('seePackages')} <span aria-hidden>→</span>
              </Link>
            )}
          </GlassCard>
        </Container>
      </section>

      <Section title={t('deliverables')}>
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
        <ServicesGrid services={all.filter((o) => o.id !== s.id && isWebService(o) === mainLine).slice(0, 3)} locale={locale} />
      </Section>
      <CtaBand defaultType={isRedesign ? 'audit' : s.contactType} />
    </PageShell>
  )
}
