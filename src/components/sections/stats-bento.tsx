import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import type { Home } from '@/payload-types'

export function StatsBento({ stats }: { stats: NonNullable<Home['stats']> }) {
  return (
    <section aria-label="coffeeProjects" className="py-10">
      <Container className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <GlassCard key={s.id ?? i}>
            <p className="font-display text-5xl font-semibold text-ink-0">
              {s.prefix}
              <span data-count-to={s.value}>{s.value}</span>
              {s.suffix}
            </p>
            <p className="mt-2 text-sm text-ink-2">{s.label}</p>
          </GlassCard>
        ))}
      </Container>
    </section>
  )
}
