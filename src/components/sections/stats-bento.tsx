import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import type { Home } from '@/payload-types'

export async function StatsBento({ stats }: { stats: NonNullable<Home['stats']> }) {
  const t = await getTranslations('sections')
  return (
    <section aria-label={t('statsLabel')} className="py-10">
      <Container className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <GlassCard key={s.id ?? i}>
            <p className="font-display text-5xl font-semibold text-ink-0">
              {s.prefix}
              <span className="sr-only">{s.value}</span>
              <span aria-hidden data-count-to={s.value}>
                {s.value}
              </span>
              {s.suffix}
            </p>
            <p className="mt-2 text-sm text-ink-2">{s.label}</p>
          </GlassCard>
        ))}
      </Container>
    </section>
  )
}
