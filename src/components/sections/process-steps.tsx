import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/ui/section'

export async function ProcessSteps({ title, steps }: { title: string; steps: { id?: string | null; title: string; text: string }[] }) {
  const t = await getTranslations('sections')
  return (
    <Section id="process" eyebrow={t('process')} title={title}>
      <ol className="relative grid gap-6 border-l border-line-amber pl-8 lg:grid-cols-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-10" data-process>
        {steps.map((s, i) => (
          <li key={s.id ?? i} className="relative" data-process-step>
            <span className="absolute -left-[41px] top-1 grid h-5 w-5 place-items-center rounded-full bg-amber font-mono text-[10px] text-bg-0 lg:-top-[51px] lg:left-0">
              {i + 1}
            </span>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
