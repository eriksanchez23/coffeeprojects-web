import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { contactHref, formatEuro } from '@/lib/format'
import type { Pricing } from '@/payload-types'

type Props = { pricing: Pricing; locale: Locale }
type Package = NonNullable<Pricing['packages']>[number]

/** The package cards plus the wide custom-service card. Prices are VAT-excluded EUR from the CMS. */
export async function PricingPlans({ pricing, locale }: Props) {
  const [t, tc] = await Promise.all([getTranslations('pricing'), getTranslations('common')])
  const vat = pricing.vatNote ?? ''
  const packages = pricing.packages ?? []
  const custom = pricing.custom

  return (
    <>
      <h2 className="sr-only">{t('packagesList')}</h2>
      <ul className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
        {packages.map((p) => (
          <PackageCard key={p.id ?? p.slug} pkg={p} locale={locale} vat={vat} t={t} perMonth={tc('perMonth')} />
        ))}
      </ul>

      {custom?.title && (
        <section
          aria-labelledby="pricing-custom-title"
          data-reveal
          className="relative mt-6 grid gap-8 lg:mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-line-hi bg-bg-1/60 p-7 sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-center"
        >
          <div>
            {custom.subtitle && <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">{custom.subtitle}</p>}
            <h2 id="pricing-custom-title" className="mt-3 text-3xl font-semibold sm:text-4xl">
              {custom.title}
            </h2>
            {custom.description && <p className="mt-4 max-w-xl text-ink-2">{custom.description}</p>}
          </div>
          <div className="grid gap-5 md:justify-items-end md:text-right">
            {custom.fromPrice != null && (
              <dl className="grid gap-2">
                <div>
                  <dt className="font-mono text-xs uppercase tracking-widest text-ink-3">{tc('from')}</dt>
                  <dd className="mt-1 flex items-baseline gap-2 md:justify-end">
                    <span className="font-display text-4xl text-ink-0 sm:text-5xl">{formatEuro(custom.fromPrice, locale)}</span>
                    <span className="text-sm text-ink-2">{vat}</span>
                  </dd>
                </div>
                {custom.monthlyPrice != null && (
                  <MonthlyFee
                    amount={custom.monthlyPrice}
                    locale={locale}
                    vat={vat}
                    label={t('monthlyFee')}
                    perMonth={tc('perMonth')}
                    className="md:justify-end"
                  />
                )}
              </dl>
            )}
            <Button href={contactHref('custom')} variant="outline" size="lg" className="w-full md:w-auto">
              {custom.ctaLabel || t('viewAll')}
            </Button>
          </div>
        </section>
      )}

      {pricing.footnote && <p className="mt-10 max-w-3xl text-sm text-ink-3">{pricing.footnote}</p>}
    </>
  )
}

function PackageCard({
  pkg,
  locale,
  vat,
  t,
  perMonth,
}: {
  pkg: Package
  locale: Locale
  vat: string
  t: Awaited<ReturnType<typeof getTranslations<'pricing'>>>
  perMonth: string
}) {
  const titleId = `plan-${pkg.slug}`
  return (
    <li
      data-reveal
      className={cn(
        'relative flex flex-col rounded-[var(--radius-lg)] border p-7 sm:p-8',
        pkg.featured
          ? 'border-line-amber bg-bg-2 bg-[linear-gradient(180deg,rgb(245_167_66/0.12),transparent_45%)] shadow-[var(--shadow-amber)] lg:-my-3 lg:py-11'
          : 'border-line bg-bg-1/60 transition-colors duration-300 hover:border-line-hi',
      )}
    >
      {pkg.featured && (
        <p className="absolute -top-3 left-7 rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-bg-0">
          {t('recommended')}
        </p>
      )}
      <h3 id={titleId} className="font-display text-2xl font-semibold">
        {pkg.name}
      </h3>

      <dl className="mt-6 grid gap-3 border-b border-line pb-6">
        <div>
          <dt className="font-mono text-xs uppercase tracking-widest text-ink-3">{t('initialPayment')}</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className={cn('font-display text-5xl', pkg.featured ? 'text-amber-hi' : 'text-ink-0')}>
              {formatEuro(pkg.initialPrice, locale)}
            </span>
            <span className="text-sm text-ink-2">{vat}</span>
          </dd>
        </div>
        {pkg.monthlyPrice != null && (
          <MonthlyFee amount={pkg.monthlyPrice} locale={locale} vat={vat} label={t('monthlyFee')} perMonth={perMonth} />
        )}
      </dl>

      <ul aria-label={t('includes', { name: pkg.name })} className="mt-6 grid flex-1 content-start gap-3">
        {(pkg.items ?? []).map((item, i) => (
          <li key={item.id ?? i} className={cn('flex items-start gap-3 text-sm', item.excluded ? 'text-ink-3' : 'text-ink-1')}>
            <span aria-hidden className={cn('mt-px font-mono', item.excluded ? 'text-ink-3' : 'text-mint')}>
              {item.excluded ? '–' : '✓'}
            </span>
            <span>
              {item.excluded && <span className="sr-only">{t('notIncluded')} </span>}
              {item.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        href={contactHref('web', pkg.slug)}
        variant={pkg.featured ? 'primary' : 'outline'}
        size="lg"
        className="mt-8 w-full"
        aria-describedby={titleId}
      >
        {pkg.ctaLabel || t('viewAll')}
      </Button>
    </li>
  )
}

type FeeProps = { amount: number; locale: Locale; vat: string; label: string; perMonth: string; className?: string }

function MonthlyFee({ amount, locale, vat, label, perMonth, className }: FeeProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3', className)}>
      <dt className="font-mono text-xs uppercase tracking-widest text-ink-3">{label}</dt>
      <dd className="text-ink-1">
        + {formatEuro(amount, locale)}
        {perMonth} <span className="text-sm text-ink-3">{vat}</span>
      </dd>
    </div>
  )
}
