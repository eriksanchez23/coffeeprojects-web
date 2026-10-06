import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { formatPrice } from '@/lib/format'
import type { Service } from '@/payload-types'
import { ServiceIcon } from './service-icon'

export async function ServicesGrid({ services, locale }: { services: Service[]; locale: Locale }) {
  const t = await getTranslations('common')
  const labels = { from: t('from'), perMonth: t('perMonth'), custom: t('custom'), seeStore: t('seeStore') }
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-reveal-group>
      {services.map((s, i) => (
        <li key={s.id} className={i === 0 ? 'lg:col-span-2' : ''} data-reveal>
          <Link href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} className="group block h-full">
            <GlassCard className="flex h-full flex-col">
              <ServiceIcon name={s.icon} />
              <h3 className="mt-5 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-ink-2">{s.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(s.tags ?? []).slice(0, 4).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <div className="mt-auto flex items-end justify-between pt-8">
                <div>
                  <p className="font-display text-xl text-amber-hi">{formatPrice(s.pricing, locale, labels)}</p>
                  <p className="text-xs text-ink-3">
                    {t('typicalTime')}: {s.typicalTime}
                  </p>
                </div>
                <span className="text-sm text-ink-1 transition-transform group-hover:translate-x-1">{t('learnMore')} →</span>
              </div>
            </GlassCard>
          </Link>
        </li>
      ))}
    </ul>
  )
}
