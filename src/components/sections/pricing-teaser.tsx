import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { cn } from '@/lib/cn'
import { formatEuro } from '@/lib/format'
import type { Pricing } from '@/payload-types'

/** Compact home-page entry to /pricing: package names and prices only (server-rendered, no client JS). */
export async function PricingTeaser({ pricing, locale }: { pricing: Pricing; locale: Locale }) {
  const packages = pricing.packages ?? []
  if (packages.length === 0) return null
  const [t, tc] = await Promise.all([getTranslations('pricing'), getTranslations('common')])
  const vat = pricing.vatNote ?? ''

  return (
    <Section id="pricing" eyebrow={pricing.eyebrow} title={pricing.subtitle || pricing.title} lead={pricing.intro}>
      <ul className="grid gap-4 sm:grid-cols-3">
        {packages.map((p) => (
          <li
            key={p.id ?? p.slug}
            data-reveal
            className={cn(
              'rounded-[var(--radius-md)] border p-6',
              p.featured ? 'border-line-amber bg-bg-2' : 'border-line bg-bg-1',
            )}
          >
            <h3 className="font-display text-xl font-semibold">
              {p.name}
              {p.featured && <span className="ml-2 align-middle font-mono text-[11px] uppercase tracking-widest text-amber">{t('recommended')}</span>}
            </h3>
            <p className="mt-3 flex items-baseline gap-2">
              <span className={cn('font-display text-3xl', p.featured ? 'text-amber-hi' : 'text-ink-0')}>{formatEuro(p.initialPrice, locale)}</span>
              <span className="text-sm text-ink-2">{vat}</span>
            </p>
            {p.monthlyPrice != null && (
              <p className="mt-1 text-sm text-ink-2">
                + {formatEuro(p.monthlyPrice, locale)}
                {tc('perMonth')}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Button href="/pricing" variant="outline" size="lg" className="mt-10">
        {t('viewAll')} <span aria-hidden>→</span>
      </Button>
    </Section>
  )
}
