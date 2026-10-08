import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { formatEuro } from '@/lib/format'
import { completeMaintenancePlans, completeWebPlans } from '@/lib/pricing'
import type { Pricing } from '@/payload-types'

/** Compact home-page entry to /pricing: web plan names and prices with maintenance (server-rendered, no client JS). */
export async function PricingTeaser({ pricing, locale }: { pricing: Pricing; locale: Locale }) {
  const plans = completeWebPlans(pricing.packages)
  if (plans.length === 0) return null
  const [t, tc] = await Promise.all([getTranslations('pricing'), getTranslations('common')])
  const vat = pricing.vatNote ?? ''
  const cheapestMaintenance = Math.min(...completeMaintenancePlans(pricing.maintenancePlans).map((p) => p.monthlyPrice))

  return (
    <Section id="pricing" eyebrow={pricing.eyebrow} title={pricing.subtitle || pricing.title} lead={pricing.intro}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <li
            key={p.id ?? p.slug}
            data-reveal
            className={cn('rounded-[var(--radius-md)] border p-6', p.featured ? 'border-line-amber bg-bg-2' : 'border-line bg-bg-1')}
          >
            {p.featured && <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-amber">{t('recommended')}</p>}
            <h3 className="font-display text-xl font-semibold">{p.name}</h3>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              {p.fromPrice && <span className="text-sm text-ink-2">{tc('from')}</span>}{' '}
              <span className={cn('font-display text-3xl', p.featured ? 'text-amber-hi' : 'text-ink-0')}>
                {formatEuro(p.priceWithMaintenance, locale)}
              </span>{' '}
              <span className="text-sm text-ink-2">{vat}</span>
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-3">{t('withMaintenance')}</p>
          </li>
        ))}
      </ul>
      {Number.isFinite(cheapestMaintenance) && (
        <p className="mt-6 text-sm text-ink-2">
          {t('teaserMaintenance', { price: `${formatEuro(cheapestMaintenance, locale)}${tc('perMonth')} ${vat}`.trim() })}
        </p>
      )}
      <Button href="/pricing" variant="outline" size="lg" className="mt-10">
        {t('viewAll')} <span aria-hidden>→</span>
      </Button>
    </Section>
  )
}
