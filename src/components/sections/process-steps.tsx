import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/ui/section'

export async function ProcessSteps({ title, steps, className }: { title: string; steps: { id?: string | null; title: string; text: string }[]; className?: string }) {
  const t = await getTranslations('sections')
  return (
    <Section id="process" eyebrow={t('process')} className={className} title={title}>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-process>
        {steps.map((s, i) => (
          <li key={s.id ?? i} className="rounded-[var(--radius-lg)] border border-line bg-bg-1 p-6" data-process-step>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
