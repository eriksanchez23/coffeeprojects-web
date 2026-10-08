import { getTranslations } from 'next-intl/server'
import { MaintenancePlanCard, WebPlanCard } from '@/components/pricing/plan-cards'
import { NotesGrid, PricingTable } from '@/components/pricing/pricing-blocks'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/locales'
import { contactHref, formatEuro } from '@/lib/format'
import { completeMaintenancePlans, completeWebPlans, extraCell, findMinPlan } from '@/lib/pricing'
import type { Pricing } from '@/payload-types'

type Props = { pricing: Pricing; locale: Locale }

/**
 * Pricing v4 body (S15): "1. Choose your website" (price with maintenance big, web-only below), then
 * "2. Choose your maintenance (optional)" with tailored support, change rules, the comparison table and the
 * permanence rules, and finally the extras table. Prices are VAT-excluded EUR from the CMS.
 */
export async function PricingPlans({ pricing, locale }: Props) {
  const [t, tc] = await Promise.all([getTranslations('pricing'), getTranslations('common')])
  const vat = pricing.vatNote ?? ''
  const webPlans = completeWebPlans(pricing.packages)
  const maintenancePlans = completeMaintenancePlans(pricing.maintenancePlans)
  const support = pricing.customSupport
  const comparison = pricing.comparison
  const extras = pricing.extras
  const perMonth = tc('perMonth')

  return (
    <>
      <section aria-labelledby="pricing-web-title">
        <header className="mb-10 max-w-3xl">
          <h2 id="pricing-web-title" className="text-3xl font-semibold sm:text-4xl">
            {pricing.webTitle}
          </h2>
          {pricing.webIntro && <p className="mt-4 text-ink-2">{pricing.webIntro}</p>}
        </header>
        <ul className="grid items-stretch gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {webPlans.map((p) => (
            <WebPlanCard
              key={p.id ?? p.slug}
              plan={p}
              minPlanName={findMinPlan(p.minPlan, maintenancePlans)?.name}
              locale={locale}
              vat={vat}
              t={t}
              from={tc('from')}
            />
          ))}
        </ul>
        <NotesGrid notes={pricing.webNotes ?? []} className="mt-8" />
      </section>

      {maintenancePlans.length > 0 && (
        <section aria-labelledby="pricing-maintenance-title" className="mt-24 sm:mt-32">
          <header className="mb-10 max-w-3xl">
            <h2 id="pricing-maintenance-title" className="text-3xl font-semibold sm:text-4xl">
              {pricing.maintenanceTitle}
            </h2>
            {pricing.maintenanceIntro && <p className="mt-4 text-ink-2">{pricing.maintenanceIntro}</p>}
          </header>
          <ul className="grid items-stretch gap-x-5 gap-y-8 lg:grid-cols-3">
            {maintenancePlans.map((p) => (
              <MaintenancePlanCard key={p.id ?? p.slug} plan={p} locale={locale} vat={vat} t={t} perMonth={perMonth} />
            ))}
          </ul>

          {support?.title && (
            <section
              aria-labelledby="pricing-support-title"
              data-reveal
              className="mt-8 grid gap-6 rounded-[var(--radius-lg)] border border-dashed border-line-hi bg-bg-1/60 p-7 sm:p-8 md:grid-cols-[1.6fr_1fr] md:items-center"
            >
              <div>
                <h3 id="pricing-support-title" className="font-display text-2xl font-semibold">
                  {support.title}
                </h3>
                {support.text && <p className="mt-3 text-sm text-ink-2">{support.text}</p>}
                {support.fromPrice != null && support.permanenceMonths != null && (
                  <p className="mt-3 text-sm text-ink-1">
                    {t('customSupportReference', {
                      price: `${formatEuro(support.fromPrice, locale)}${perMonth} ${vat}`.trim(),
                      months: t('months', { months: support.permanenceMonths }),
                    })}
                  </p>
                )}
              </div>
              <Button href={contactHref('maintenance')} variant="outline" size="lg" className="w-full md:w-auto md:justify-self-end">
                {t('requestQuote')}
              </Button>
            </section>
          )}

          <NotesGrid notes={pricing.changeNotes ?? []} className="mt-8 lg:grid-cols-2" />

          {comparison?.title && (comparison.rows ?? []).length > 0 && (
            <section aria-labelledby="pricing-comparison-title" className="mt-16">
              <h3 id="pricing-comparison-title" className="text-2xl font-semibold sm:text-3xl">
                {comparison.title}
              </h3>
              {comparison.intro && <p className="mt-3 mb-8 max-w-3xl text-ink-2">{comparison.intro}</p>}
              <div className={comparison.intro ? '' : 'mt-8'}>
                <PricingTable
                  caption={comparison.title}
                  hideCaption
                  columns={[t('item'), t('withMaintenance'), t('webOnly')]}
                  rows={(comparison.rows ?? []).map((r, i) => ({ key: r.id ?? String(i), cells: [r.label, r.withPlan, r.webOnly] }))}
                />
              </div>
            </section>
          )}

          {(pricing.permanenceRules ?? []).length > 0 && (
            <section aria-labelledby="pricing-permanence-title" className="mt-16">
              <h3 id="pricing-permanence-title" className="text-2xl font-semibold sm:text-3xl">
                {t('permanenceTitle')}
              </h3>
              <dl className="mt-8 grid gap-4 md:grid-cols-2">
                {(pricing.permanenceRules ?? []).map((r, i) => (
                  <div key={r.id ?? i} data-reveal className="rounded-[var(--radius-md)] border border-line bg-bg-1/60 p-6">
                    <dt className="font-mono text-xs uppercase tracking-widest text-amber">{r.title}</dt>
                    <dd className="mt-3 text-sm text-ink-1">{r.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </section>
      )}

      {extras?.title && (extras.rows ?? []).length > 0 && (
        <section aria-labelledby="pricing-extras-title" className="mt-24 sm:mt-32">
          <header className="mb-8 max-w-3xl">
            <h2 id="pricing-extras-title" className="text-3xl font-semibold sm:text-4xl">
              {extras.title}
            </h2>
            {extras.intro && <p className="mt-4 text-ink-2">{extras.intro}</p>}
          </header>
          <PricingTable
            caption={extras.title}
            hideCaption
            columns={[t('service'), t('withPlan'), t('withoutPlan')]}
            rows={(extras.rows ?? []).map((r, i) => ({
              key: r.id ?? String(i),
              cells: [r.service, withVat(extraCell(r.withPlan, r.withPlanText, locale), r.withPlan, vat), withVat(extraCell(r.withoutPlan, r.withoutPlanText, locale), r.withoutPlan, vat)],
            }))}
          />
        </section>
      )}

      {pricing.footnote && <p className="mt-16 max-w-3xl text-sm text-ink-3">{pricing.footnote}</p>}
    </>
  )
}

/** Amounts carry the VAT note like every other price; texts ("Incluida", "Presupuesto") do not. */
function withVat(cell: string, amount: number | null | undefined, vat: string) {
  if (amount == null || !vat) return cell
  return (
    <>
      {cell} <span className="text-xs text-ink-3">{vat}</span>
    </>
  )
}
