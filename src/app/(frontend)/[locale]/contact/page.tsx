import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactForm } from '@/components/contact/contact-form'
import { PageShell } from '@/components/layout/page-shell'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import { projectTypes } from '@/features/contact/options'
import { resolvePlan } from '@/features/contact/plan'
import type { WebPlanOption } from '@/components/contact/contact-form'
import { buildQuote, quoteLabelsFrom, quoteLines } from '@/features/contact/quote'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getPricing, getServices, getSettings } from '@/lib/cms/queries'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { allowedMaintenance, completeMaintenancePlans, completeWebPlans } from '@/lib/pricing'
import { formatEuro } from '@/lib/format'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'contact' })
  return buildMetadata({ locale, paths: localizedPaths('/contact'), title: t('title'), description: t('lead') })
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const sp = await searchParams
  // R21: the CTA band only ever sends ?type=; personal data never travels in URLs.
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type
  const type = projectTypes.find((p) => p === rawType)
  // ?url= from the home "free review" form: a public website address, never personal data. Only kept when it
  // looks like a plain http(s) URL; the form and the server validate it again.
  const rawUrl = Array.isArray(sp.url) ? sp.url[0] : sp.url
  const prefillUrl = typeof rawUrl === 'string' && rawUrl.length <= 300 && /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(rawUrl.trim()) ? rawUrl.trim() : undefined
  const [t, tn, settings, pricing, services] = await Promise.all([
    getTranslations('contact'),
    getTranslations('nav'),
    getSettings(locale),
    getPricing(locale),
    getServices(locale),
  ])
  // ?plan= from the pricing CTAs: kept only when it is a package of the published pricing global.
  const packages = completeWebPlans(pricing.packages)
  const plan = resolvePlan(Array.isArray(sp.plan) ? sp.plan[0] : sp.plan, packages.map((p) => p.slug))
  // S17: price with VAT + estimated time for every project type, so the select can switch them client-side.
  // Web plans (with or without maintenance) have their own quotes in `webOptions` below.
  const quoteLabels = quoteLabelsFrom(t)
  const quotes = Object.fromEntries(projectTypes.map((type) => [type, quoteLines(buildQuote({ type, services }), locale, quoteLabels)]))
  // "New website" path: every web plan with its prices (VAT excluded, like the pricing page) and the maintenance
  // plans that unlock its reduced price, plus the VAT-included summary for each combination, so the two selects
  // can switch it client-side. The Server Action rebuilds the stored summary from the CMS.
  const maintenancePlans = completeMaintenancePlans(pricing.maintenancePlans)
  const euro = (n: number) => formatEuro(n, locale)
  const from = (text: string, isFrom: boolean | null | undefined) => (isFrom ? quoteLabels.from.replace('{price}', text) : text)
  // Each choice also carries what it includes and a link to its card on the pricing page (opened in a new tab so
  // the form keeps what the visitor typed).
  const pricingPath = localizedPaths('/pricing')[locale]
  const items = (rows: { text: string; excluded?: boolean | null }[] | null | undefined) =>
    (rows ?? []).map((r) => ({ text: r.text, excluded: Boolean(r.excluded) }))
  const webOptions: WebPlanOption[] = packages.map((p) => {
    const allowed = allowedMaintenance(p.minPlan, maintenancePlans)
    const saving = (p.priceWebOnly as number) - (p.priceWithMaintenance as number)
    const webWith = from(euro(p.priceWithMaintenance as number), p.fromPrice)
    const webOnly = from(euro(p.priceWebOnly as number), p.fromPrice)
    const type = p.contactType ?? 'web'
    const quoteFor = (maintenance: { name: string; monthlyPrice: number; permanenceMonths: number } | 'none') =>
      quoteLines(
        buildQuote({ type, plan: p as Parameters<typeof buildQuote>[0]['plan'], maintenance, services }),
        locale,
        quoteLabels,
      )
    return {
      slug: p.slug,
      contactType: type,
      card: {
        name: p.name,
        withPrice: webWith,
        withoutPrice: t('webPlan.withoutLine', { price: webOnly }),
        featured: Boolean(p.featured),
        isNew: Boolean(p.isNew),
      },
      defaultMaintenance: allowed[0]?.slug ?? 'none',
      info: {
        name: p.name,
        pitch: p.pitch ?? undefined,
        lead: p.itemsLead ?? undefined,
        items: items(p.items),
        href: `${pricingPath}#plan-${p.slug}`,
      },
      maintenance: allowed.map((m) => ({
        slug: m.slug,
        card: {
          name: m.name,
          price: t('webPlan.perMonth', { price: euro(m.monthlyPrice as number) }),
          detail: t('webPlan.term', { months: m.permanenceMonths as number }),
          web: t('webPlan.webFor', { price: webWith }),
          featured: Boolean(m.featured),
        },
        quote: quoteFor({ name: m.name, monthlyPrice: m.monthlyPrice as number, permanenceMonths: m.permanenceMonths as number }),
        info: {
          name: m.name,
          pitch: m.pitch ?? undefined,
          meta: t('webPlan.maintenanceMeta', { monthly: euro(m.monthlyPrice as number), months: m.permanenceMonths as number }),
          note: saving > 0 ? t('webPlan.saving', { amount: euro(saving) }) : undefined,
          items: items(m.items),
          href: `${pricingPath}#maintenance-${m.slug}`,
        },
      })),
      none: {
        card: {
          name: t('quote.noMaintenance'),
          price: t('webPlan.noFee'),
          detail: t('webPlan.noTerm'),
          web: t('webPlan.webFor', { price: webOnly }),
          featured: false,
        },
        quote: quoteFor('none'),
        info: {
          name: t('webPlan.noneTitle'),
          pitch: t('webPlan.noneText'),
          note: saving > 0 ? t('webPlan.noneExtra', { amount: euro(saving) }) : undefined,
          items: [],
          href: `${pricingPath}#pricing-comparison-title`,
        },
      },
    }
  })
  const alternates = localizedPaths('/contact')

  return (
    <PageShell locale={locale} alternates={alternates} hideMobileCta>
      <JsonLd
        data={breadcrumbLd([
          { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
          { name: tn('contact'), url: absoluteUrl(alternates[locale]) },
        ])}
      />
      <section className="hero-wash pt-20 pb-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">{t('eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{t('title')}</h1>
            <p className="mt-6 text-lg text-ink-2">{t('lead')}</p>
            <GlassCard className="mt-10 space-y-3 text-sm">
              <a href={`mailto:${settings.contactEmail}`} className="block text-lg font-semibold text-ink-0 hover:text-brand" data-track="contact-email">
                {settings.contactEmail}
              </a>
              <p className="text-ink-2">{t('replyBy')}</p>
            </GlassCard>
          </div>
          <GlassCard className="p-6 sm:p-10">
            <ContactForm
              locale={locale}
              sourcePath={alternates[locale]}
              prefill={{ type, plan, url: prefillUrl }}
              quotes={quotes}
              webOptions={webOptions}
              pricingHref={pricingPath}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
            />
          </GlassCard>
        </Container>
      </section>
    </PageShell>
  )
}
