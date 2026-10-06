import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/ui/section'

export async function FaqList({ title, items }: { title: string; items: { id: string | number; question: string; answer: string }[] }) {
  const t = await getTranslations('sections')
  return (
    <Section id="faq" eyebrow={t('faq')} title={title}>
      <div className="divide-y divide-line rounded-[var(--radius-lg)] border border-line">
        {items.map((f) => (
          <details key={f.id} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg text-ink-0">
              {f.question}
              <span aria-hidden className="font-mono text-amber transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 text-ink-2">{f.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
