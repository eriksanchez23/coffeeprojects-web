import { Section } from '@/components/ui/section'

export function FaqList({ title, items }: { title: string; items: { id: string | number; question: string; answer: string }[] }) {
  return (
    <Section id="faq" title={title}>
      <div className="mx-auto max-w-4xl divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-bg-1">
        {items.map((f) => (
          <details key={f.id} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium text-ink-0">
              {f.question}
              <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-2 text-xl text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 text-ink-2">{f.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
