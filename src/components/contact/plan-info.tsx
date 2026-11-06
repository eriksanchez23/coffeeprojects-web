import { cn } from '@/lib/cn'

/**
 * What a choice in the "new website" selects includes, built on the server from the pricing global (localized):
 * name, pitch, a price/term line, a note (e.g. how much maintenance saves), the ✓ / – inclusions and a link to
 * its card on the pricing page.
 */
export type PlanInfo = {
  name: string
  pitch?: string
  lead?: string
  meta?: string
  note?: string
  items: { text: string; excluded: boolean }[]
  href: string
}

export function PlanInfoCard({
  info,
  eyebrow,
  linkLabel,
  newTab,
  notIncluded,
  testId,
}: {
  info: PlanInfo
  eyebrow: string
  linkLabel: string
  /** Screen-reader hint that the link opens in a new tab. */
  newTab: string
  notIncluded: string
  testId: string
}) {
  return (
    <article className="flex flex-col rounded-[var(--radius-md)] border border-line bg-bg-1 p-4" data-testid={testId}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber">{eyebrow}</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-ink-0">{info.name}</h3>
      {info.meta && <p className="text-sm font-medium text-ink-1">{info.meta}</p>}
      {info.pitch && <p className="mt-1 text-sm text-ink-2">{info.pitch}</p>}
      {info.note && <p className="mt-2 rounded-[var(--radius-sm)] bg-mint/10 px-2.5 py-1.5 text-xs font-medium text-ink-1">{info.note}</p>}
      {info.items.length > 0 && (
        <div className="mt-3 flex-1">
          {info.lead && <p className="mb-2 text-xs text-ink-3">{info.lead}</p>}
          <ul className="grid gap-1.5">
            {info.items.map((item, i) => (
              <li key={i} className={cn('flex items-start gap-2 text-sm', item.excluded ? 'text-ink-3' : 'text-ink-1')}>
                <span aria-hidden className={cn('font-mono', item.excluded ? 'text-ink-3' : 'text-mint')}>
                  {item.excluded ? '–' : '✓'}
                </span>
                <span>
                  {item.excluded && <span className="sr-only">{notIncluded} </span>}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <a
        href={info.href}
        target="_blank"
        rel="noopener"
        className="mt-4 self-start text-sm font-semibold text-brand underline-offset-4 hover:underline"
      >
        {linkLabel}
        <span aria-hidden> ↗</span>
        <span className="sr-only"> ({newTab})</span>
      </a>
    </article>
  )
}
