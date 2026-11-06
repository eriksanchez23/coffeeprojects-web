import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { formatPrice } from '@/lib/format'
import type { Service } from '@/payload-types'
import { ServiceIcon } from './service-icon'

/** `compact`: secondary line — equal cards, no tags, smaller price. */
export async function ServicesGrid({ services, locale, compact = false }: { services: Service[]; locale: Locale; compact?: boolean }) {
  const t = await getTranslations('common')
  const labels = { from: t('from'), perMonth: t('perMonth'), custom: t('custom'), seeStore: t('seeStore'), vat: t('plusVat') }
  return (
    <ul className="grid gap-4 md:grid-cols-2" data-reveal-group>
      {services.map((s) => (
        <li key={s.id} data-reveal>
          <Link href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} className="group block h-full">
            <GlassCard className="flex h-full flex-col">
              <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-bg-2 text-brand">
                <ServiceIcon name={s.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-ink-2">{s.summary}</p>
              {compact && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {(s.tags ?? []).slice(0, 4).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-end justify-between pt-8">
                <div>
                  <p className={compact ? 'font-medium text-ink-0' : 'text-lg font-semibold text-ink-0'}>{formatPrice(s.pricing, locale, labels)}</p>
                  <p className="text-xs text-ink-3">
                    {t('typicalTime')}: {s.typicalTime}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand transition-transform group-hover:translate-x-1">{t('learnMore')} →</span>
              </div>
            </GlassCard>
          </Link>
        </li>
      ))}
    </ul>
  )
}
