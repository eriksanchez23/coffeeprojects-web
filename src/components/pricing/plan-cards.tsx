import type { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { contactHref, formatEuro } from '@/lib/format'
import type { Pricing } from '@/payload-types'

export type PricingT = Awaited<ReturnType<typeof getTranslations<'pricing'>>>
export type WebPlan = NonNullable<Pricing['packages']>[number]
export type MaintenancePlan = NonNullable<Pricing['maintenancePlans']>[number]
type Item = NonNullable<WebPlan['items']>[number]

/** Shared card frame: featured cards get the amber treatment used across the site. */
function cardClasses(featured: boolean | null | undefined) {
  return cn(
    'relative flex flex-col rounded-[var(--radius-lg)] border p-7 sm:p-8',
    featured
      ? 'border-line-amber bg-bg-2 bg-[linear-gradient(180deg,rgb(245_167_66/0.12),transparent_45%)] shadow-[var(--shadow-amber)]'
      : 'border-line bg-bg-1/60 transition-colors duration-300 hover:border-line-hi',
  )
}

function Badges({ featured, isNew, t }: { featured?: boolean | null; isNew?: boolean | null; t: PricingT }) {
  if (!featured && !isNew) return null
  return (
    <p className="absolute -top-3 left-7 flex gap-2">
      {featured && (
        <span className="rounded-full bg-amber px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-bg-0">
          {t('recommended')}
        </span>
      )}
      {isNew && (
        <span className="rounded-full border border-line-amber bg-bg-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-hi">
          {t('new')}
        </span>
      )}
    </p>
  )
}

function InclusionList({ items, name, lead, t }: { items: Item[]; name: string; lead?: string | null; t: PricingT }) {
  return (
    <div className="mt-6 flex-1">
      {lead && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-3">{lead}</p>}
      <ul aria-label={t('includes', { name })} className="grid content-start gap-3">
        {items.map((item, i) => (
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
    </div>
  )
}

type WebCardProps = { plan: WebPlan; minPlanName?: string; locale: Locale; vat: string; t: PricingT; from: string }

/** Step 1 card: the price with maintenance is the big one, the web-only price sits below it. */
export function WebPlanCard({ plan, minPlanName, locale, vat, t, from }: WebCardProps) {
  const titleId = `plan-${plan.slug}`
  const webOnly = formatEuro(plan.priceWebOnly, locale)
  return (
    <li data-reveal className={cardClasses(plan.featured)}>
      <Badges featured={plan.featured} isNew={plan.isNew} t={t} />
      <h3 id={titleId} className="font-display text-2xl font-semibold">
        {plan.name}
      </h3>
      {plan.pitch && <p className="mt-2 text-sm text-ink-2">{plan.pitch}</p>}

      <dl className="mt-6 grid gap-3 border-b border-line pb-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{t('withMaintenance')}</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
            {plan.fromPrice && <span className="text-sm text-ink-2">{from}</span>}{' '}
            <span className={cn('font-display text-5xl', plan.featured ? 'text-amber-hi' : 'text-ink-0')}>
              {formatEuro(plan.priceWithMaintenance, locale)}
            </span>{' '}
            <span className="text-sm text-ink-2">{vat}</span>
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{t('webOnly')}</dt>
          <dd className="text-ink-1">
            {plan.fromPrice ? t('fromPrice', { price: webOnly }) : webOnly} <span className="text-sm text-ink-3">{vat}</span>
          </dd>
        </div>
      </dl>

      <InclusionList items={plan.items ?? []} name={plan.name} lead={plan.itemsLead} t={t} />

      {minPlanName && (
        <p className="mt-6 flex flex-wrap items-baseline justify-between gap-x-3 border-t border-line pt-4 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">{t('minPlan')}</span>
          <span className="font-medium text-amber">{minPlanName}</span>
        </p>
      )}

      <Button
        href={contactHref(plan.contactType ?? 'web', plan.slug)}
        variant={plan.featured ? 'primary' : 'outline'}
        size="lg"
        className="mt-6 w-full"
        aria-describedby={titleId}
      >
        {plan.ctaLabel || t('requestPlan')}
      </Button>
    </li>
  )
}

type MaintenanceCardProps = { plan: MaintenancePlan; locale: Locale; vat: string; t: PricingT; perMonth: string }

/** Step 2 card: monthly fee, permanence and inclusions. */
export function MaintenancePlanCard({ plan, locale, vat, t, perMonth }: MaintenanceCardProps) {
  const titleId = `maintenance-${plan.slug}`
  return (
    <li data-reveal className={cardClasses(plan.featured)}>
      <Badges featured={plan.featured} t={t} />
      <h3 id={titleId} className="font-display text-2xl font-semibold">
        {plan.name}
      </h3>
      {plan.pitch && <p className="mt-2 text-sm text-ink-2">{plan.pitch}</p>}

      <dl className="mt-6 grid gap-3 border-b border-line pb-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{t('monthlyFee')}</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className={cn('font-display text-5xl', plan.featured ? 'text-amber-hi' : 'text-ink-0')}>
              {formatEuro(plan.monthlyPrice, locale)}
              {perMonth}
            </span>{' '}
            <span className="text-sm text-ink-2">{vat}</span>
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{t('permanence')}</dt>
          <dd className="text-ink-1">{t('months', { months: plan.permanenceMonths })}</dd>
        </div>
      </dl>

      <InclusionList items={plan.items ?? []} name={plan.name} t={t} />

      <Button
        href={contactHref('maintenance')}
        variant={plan.featured ? 'primary' : 'outline'}
        size="lg"
        className="mt-8 w-full"
        aria-describedby={titleId}
      >
        {plan.ctaLabel || t('requestMaintenance')}
      </Button>
    </li>
  )
}
