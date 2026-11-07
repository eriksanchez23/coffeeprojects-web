import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { contactHref, formatEuro } from '@/lib/format'
import type { WebPlan } from './plan-cards'

/**
 * Every web plan in one compact list (name, price with maintenance), for places that used to show a single
 * "from" price: the "new website" path on the home page and the web design service page. Each row opens the
 * contact form with that plan preselected.
 */
export function WebPlanList({
  plans,
  locale,
  vat,
  from,
  markFeatured = true,
  className,
}: {
  plans: WebPlan[]
  locale: Locale
  vat: string
  from: string
  /** The dot next to the recommended plan; the home page leaves it to the pricing page. */
  markFeatured?: boolean
  className?: string
}) {
  return (
    <ul className={cn('divide-y divide-line overflow-hidden rounded-[var(--radius-md)] border border-line bg-bg-0/60', className)}>
      {plans.map((p) => (
        <li key={p.id ?? p.slug}>
          <Link
            href={contactHref(p.contactType ?? 'web', p.slug)}
            className="group flex items-baseline justify-between gap-4 px-4 py-3 transition-colors hover:bg-bg-2"
          >
            <span className="flex items-center gap-2 font-medium text-ink-0">
              {markFeatured && p.featured && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" data-testid="plan-list-featured" />}
              {p.name}
            </span>
            <span className="shrink-0 text-right text-sm text-ink-2">
              {p.fromPrice && <span>{from} </span>}
              <span className="font-semibold text-ink-0 tabular-nums">{formatEuro(p.priceWithMaintenance as number, locale)}</span>{' '}
              <span className="text-xs">{vat}</span>
              <span aria-hidden className="ml-2 inline-block text-brand transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
