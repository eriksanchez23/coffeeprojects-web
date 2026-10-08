import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { CommissionTable } from '@/components/partners/commission-table'
import { JsonLd } from '@/components/seo/json-ld'
import { Button, buttonClasses } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { Link } from '@/i18n/navigation'
import { localizedPaths } from '@/i18n/paths'
import { getPartners, getPricing, getSettings } from '@/lib/cms/queries'
import { formatEuro } from '@/lib/format'
import { commissionRows, fillTemplate, formatRate, registerMailto, savingsRange } from '@/lib/partners'
import { completeMaintenancePlans, completeWebPlans } from '@/lib/pricing'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'
import type { Partner, Pricing } from '@/payload-types'

export const revalidate = 3600

/** Values for the {placeholders} editors may use in the Partners texts. */
function templateVars(partners: Partner, pricing: Pricing, locale: Locale): Record<string, string> {
  const high = partners.rateWithMaintenance
  const low = partners.rateWebOnly
  const savings = savingsRange(pricing.packages)
  return {
    high: formatRate(high, locale),
    low: formatRate(low, locale),
    diff: formatRate(Math.max(high - low, 0), locale),
    ...(savings ? { min: formatEuro(savings.min, locale), max: formatEuro(savings.max, locale) } : {}),
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [partners, pricing] = await Promise.all([getPartners(locale), getPricing(locale)])
  if (!partners.title) return {}
  const vars = templateVars(partners, pricing, locale)
  return buildMetadata({
    locale,
    paths: localizedPaths('/partners'),
    title: fillTemplate(partners.seo?.title || partners.title, vars),
    description: fillTemplate(partners.seo?.description || partners.intro || partners.title, vars),
  })
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [partners, pricing, settings, tn, t, tp] = await Promise.all([
    getPartners(locale),
    getPricing(locale),
    getSettings(locale),
    getTranslations('nav'),
    getTranslations('partners'),
    getTranslations('pricing'),
  ])
  // Not seeded / not published yet: no half-empty programme page.
  if (!partners.title) notFound()

  const vars = templateVars(partners, pricing, locale)
  const fill = (text: string | null | undefined) => fillTemplate(text, vars)
  const high = vars.high
  const low = vars.low
  const rows = commissionRows(pricing.packages, { withMaintenance: partners.rateWithMaintenance, webOnly: partners.rateWebOnly })
  const webPlans = completeWebPlans(pricing.packages)
  const maintenancePlans = completeMaintenancePlans(pricing.maintenancePlans)
  const vat = pricing.vatNote ?? ''
  const { notice, dontPromise, cta } = partners
  const steps = partners.steps ?? []
  const conditions = partners.conditions ?? []
  const paths = localizedPaths('/partners')
  const pageUrl = absoluteUrl(paths[locale])
  const h2 = 'text-3xl font-semibold sm:text-4xl'

  return (
    <PageShell locale={locale} alternates={paths}>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
            { name: tn('partners'), url: pageUrl },
          ]),
        ]}
      />
      <section className="steam-glow relative pt-20 pb-16 sm:pt-28" aria-labelledby="partners-title">
        <Container>
          <header className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{partners.eyebrow}</p>
            <h1 id="partners-title" className="text-4xl font-semibold leading-tight sm:text-6xl">
              {partners.title}
            </h1>
            {partners.intro && <p className="mt-6 text-xl text-ink-1">{fill(partners.intro)}</p>}
          </header>

          {notice?.title && (
            // The programme's one hard rule (S16): unmissable, right under the header.
            <aside
              aria-labelledby="partners-notice-title"
              data-testid="partners-notice"
              className="mt-10 flex max-w-4xl gap-5 rounded-[var(--radius-lg)] border-2 border-amber bg-amber/10 p-6 shadow-[var(--shadow-amber)] sm:p-8"
            >
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber font-mono text-xl font-bold text-bg-0">
                !
              </span>
              <div>
                <h2 id="partners-notice-title" className="font-display text-2xl font-semibold text-amber-hi sm:text-3xl">
                  {notice.title}
                </h2>
                {notice.text && <p className="mt-2 text-lg text-ink-0">{fill(notice.text)}</p>}
              </div>
            </aside>
          )}

          <ul aria-label={t('rates')} className="mt-12 grid gap-5 md:grid-cols-2">
            <li className="relative rounded-[var(--radius-lg)] border border-line-amber bg-bg-2 bg-[linear-gradient(180deg,rgb(245_167_66/0.12),transparent_55%)] p-7 sm:p-8">
              {partners.withMaintenanceBadge && (
                <p className="absolute -top-3 left-7 rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-bg-0">
                  {partners.withMaintenanceBadge}
                </p>
              )}
              <p className="font-mono text-xs uppercase tracking-widest text-ink-2">{partners.withMaintenanceTitle}</p>
              <p className="mt-3 font-display text-6xl font-semibold text-amber-hi">{high}</p>
              {partners.rateNote && <p className="mt-2 text-ink-1">{partners.rateNote}</p>}
            </li>
            <li className="rounded-[var(--radius-lg)] border border-line bg-bg-1/60 p-7 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-widest text-ink-2">{partners.webOnlyTitle}</p>
              <p className="mt-3 font-display text-6xl font-semibold text-ink-0">{low}</p>
              {partners.rateNote && <p className="mt-2 text-ink-1">{partners.rateNote}</p>}
            </li>
          </ul>
        </Container>
      </section>

      {rows.length > 0 && (
        <section className="py-16 sm:py-20" aria-labelledby="partners-table-title">
          <Container>
            <h2 id="partners-table-title" className={`${h2} mb-8`}>
              {partners.tableTitle || t('rates')}
            </h2>
            <CommissionTable
              rows={rows}
              locale={locale}
              labels={{
                caption: partners.tableTitle || t('rates'),
                plan: t('plan'),
                priceWithMaintenance: t('priceWithMaintenance'),
                commissionWithMaintenance: t('commission', { rate: high }),
                priceWebOnly: t('priceWebOnly'),
                commissionWebOnly: t('commission', { rate: low }),
                from: (price) => tp('fromPrice', { price }),
              }}
            />
            <p className="mt-4 text-sm text-ink-3">{t('amountsNote')}</p>
            {partners.tableNote && <p className="mt-2 max-w-3xl text-sm text-ink-2">{fill(partners.tableNote)}</p>}
          </Container>
        </section>
      )}

      {partners.sellTitle && (webPlans.length > 0 || maintenancePlans.length > 0) && (
        <section className="py-16 sm:py-20" aria-labelledby="partners-sell-title">
          <Container>
            <h2 id="partners-sell-title" className={`${h2} mb-10`}>
              {partners.sellTitle}
            </h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {webPlans.length > 0 && (
                <section aria-labelledby="partners-web-title" className="rounded-[var(--radius-lg)] border border-line bg-bg-1/60 p-7 sm:p-8">
                  <h3 id="partners-web-title" className="font-mono text-xs uppercase tracking-widest text-amber">
                    {partners.webPlansTitle}
                  </h3>
                  <ul className="mt-5 grid gap-3 text-sm">
                    {webPlans.map((p) => (
                      <li key={p.id ?? p.slug} className="text-ink-1">
                        <span className="font-medium text-ink-0">{p.name}</span>
                        {p.pitch && <>: {p.pitch}</>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section aria-labelledby="partners-maintenance-title" className="rounded-[var(--radius-lg)] border border-line bg-bg-1/60 p-7 sm:p-8">
                <h3 id="partners-maintenance-title" className="font-mono text-xs uppercase tracking-widest text-amber">
                  {partners.maintenanceTitle}
                </h3>
                {maintenancePlans.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {maintenancePlans.map((p) => (
                      <li key={p.id ?? p.slug} className="rounded-full border border-line-hi px-4 py-2 text-sm text-ink-0">
                        {p.name} · {t('perMonth', { price: formatEuro(p.monthlyPrice, locale) })}
                        {vat && <span className="text-ink-3"> {vat}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {partners.maintenanceText && <p className="mt-5 text-sm text-ink-2">{fill(partners.maintenanceText)}</p>}
                {partners.sellArgument && (
                  <p className="mt-5 rounded-[var(--radius-md)] border border-line-amber bg-bg-2 p-4 text-ink-0">{fill(partners.sellArgument)}</p>
                )}
                <Link href="/pricing" className="mt-6 inline-block text-sm font-medium text-amber hover:text-amber-hi">
                  {tp('seePackages')} <span aria-hidden>→</span>
                </Link>
              </section>
            </div>
          </Container>
        </section>
      )}

      {steps.length > 0 && (
        <section className="py-16 sm:py-20" aria-labelledby="partners-steps-title">
          <Container>
            <h2 id="partners-steps-title" className={`${h2} mb-10`}>
              {partners.stepsTitle}
            </h2>
            <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.id ?? i} data-reveal className="rounded-[var(--radius-lg)] border border-line bg-bg-1/60 p-6">
                  <span aria-hidden className="font-mono text-sm text-amber">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-sm text-ink-2">{fill(s.text)}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {conditions.length > 0 && (
        <section className="py-16 sm:py-20" aria-labelledby="partners-conditions-title">
          <Container>
            <h2 id="partners-conditions-title" className={`${h2} mb-10`}>
              {partners.conditionsTitle}
            </h2>
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1/60">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">{partners.conditionsTitle}</caption>
                <tbody>
                  {conditions.map((c, i) => (
                    <tr key={c.id ?? i} className="block border-b border-line last:border-b-0 sm:table-row">
                      <th scope="row" className="block px-6 pt-5 font-medium text-ink-0 sm:table-cell sm:w-1/3 sm:py-5 sm:align-top">
                        {c.topic}
                      </th>
                      <td className="block px-6 pt-2 pb-5 text-ink-1 sm:table-cell sm:py-5">{fill(c.condition)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dontPromise?.title && (
              <aside
                aria-labelledby="partners-dont-title"
                className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-berry/60 bg-bg-1/60 p-6 sm:p-8"
              >
                <h3 id="partners-dont-title" className="font-mono text-xs uppercase tracking-widest text-berry">
                  {dontPromise.title}
                </h3>
                {dontPromise.text && <p className="mt-3 text-ink-1">{fill(dontPromise.text)}</p>}
              </aside>
            )}
            {partners.footnote && <p className="mt-10 max-w-3xl text-sm text-ink-3">{fill(partners.footnote)}</p>}
          </Container>
        </section>
      )}

      {cta?.registerLabel && (
        <section className="py-16 sm:py-24" aria-labelledby="partners-cta-title">
          <Container>
            <div className="steam-glow rounded-[var(--radius-lg)] border border-line-amber bg-bg-1 p-8 sm:p-14">
              <h2 id="partners-cta-title" className="text-4xl font-semibold sm:text-5xl">
                {cta.title || cta.registerLabel}
              </h2>
              {cta.text && <p className="mt-4 max-w-2xl text-ink-2">{fill(cta.text)}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={registerMailto(settings.contactEmail, cta.emailSubject, cta.emailBody)} className={buttonClasses({ size: 'lg' })}>
                  {cta.registerLabel}
                </a>
                {cta.contactLabel && (
                  <Button href="/contact" variant="outline" size="lg">
                    {cta.contactLabel}
                  </Button>
                )}
              </div>
              {/* Visible address for partners without a mail app configured. */}
              <p className="mt-4 font-mono text-sm text-ink-3">{settings.contactEmail}</p>
            </div>
          </Container>
        </section>
      )}
    </PageShell>
  )
}
