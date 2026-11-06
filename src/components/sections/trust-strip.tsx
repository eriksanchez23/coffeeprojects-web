import { Container } from '@/components/ui/container'

type Item = { id?: string | null; title: string; text: string }

/** Four plain guarantees right under the hero, plus the sectors we have worked for. No inflated numbers. */
export function TrustStrip({ items, sectorsLine }: { items: Item[]; sectorsLine?: string | null }) {
  if (items.length === 0) return null
  return (
    <section aria-label={items.map((i) => i.title).join(', ')} className="border-y border-line bg-bg-1">
      <Container className="py-10">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.id ?? i} className="flex gap-3">
              <svg viewBox="0 0 24 24" aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <div>
                <p className="font-semibold text-ink-0">{it.title}</p>
                <p className="mt-1 text-sm text-ink-2">{it.text}</p>
              </div>
            </li>
          ))}
        </ul>
        {sectorsLine && <p className="mt-8 border-t border-line pt-6 text-center text-sm text-ink-2">{sectorsLine}</p>}
      </Container>
    </section>
  )
}
