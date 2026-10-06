import { getTranslations } from 'next-intl/server'
import { GlassCard } from '@/components/ui/glass-card'
import { Section } from '@/components/ui/section'

export async function WhyUs({ title, items }: { title: string; items: { id?: string | null; title: string; text: string }[] }) {
  const t = await getTranslations('sections')
  return (
    <Section id="why" eyebrow={t('why')} title={title}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
        {items.map((it, i) => (
          <li key={it.id ?? i} data-reveal>
            <GlassCard className="h-full">
              <p className="font-mono text-xs text-amber">0{i + 1}</p>
              <h3 className="mt-3 text-xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-ink-2">{it.text}</p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </Section>
  )
}
