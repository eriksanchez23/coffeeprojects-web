import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Note = { id?: string | null; title: string; text: string }

/** Titled text blocks (payment terms, change rules…) laid out as a grid of quiet cards. */
export function NotesGrid({ notes, className }: { notes: Note[]; className?: string }) {
  if (notes.length === 0) return null
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {notes.map((n, i) => (
        <section key={n.id ?? i} data-reveal className="rounded-[var(--radius-md)] border border-line bg-bg-1/60 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber">{n.title}</h3>
          <p className="mt-3 text-sm text-ink-1">{n.text}</p>
        </section>
      ))}
    </div>
  )
}

type Table = {
  caption: string
  columns: [string, string, string]
  rows: { key: string; cells: [ReactNode, ReactNode, ReactNode] }[]
  /** Visually hide the caption when a visible heading already names the table. */
  hideCaption?: boolean
}

/**
 * Three-column comparison table (row header + two values). Scrolls inside its own box on narrow
 * screens so the page itself never scrolls sideways.
 */
export function PricingTable({ caption, columns, rows, hideCaption }: Table) {
  return (
    // Focusable + labelled: keyboard users can scroll it when it overflows (axe scrollable-region-focusable).
    <div role="region" aria-label={caption} tabIndex={0} data-reveal className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-bg-1/60">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className={cn('px-6 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-ink-3', hideCaption && 'sr-only')}>
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={cn('px-6 py-4 text-xs font-semibold uppercase tracking-wider', i === 1 ? 'text-amber' : 'text-ink-3')}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-6 py-4 font-medium text-ink-0">
                {r.cells[0]}
              </th>
              <td className="px-6 py-4 text-ink-1">{r.cells[1]}</td>
              <td className="px-6 py-4 text-ink-2">{r.cells[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
