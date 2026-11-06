import type { Locale } from '@/i18n/locales'
import { formatEuro } from '@/lib/format'
import { type CommissionRow, formatCommission } from '@/lib/partners'

type Labels = {
  caption: string
  plan: string
  priceWithMaintenance: string
  commissionWithMaintenance: string
  priceWebOnly: string
  commissionWebOnly: string
  /** Formats a "desde" amount, e.g. "desde 49,00 €". */
  from: (amount: string) => string
}

/**
 * Per-plan commission table (S16): prices from the Pricing global, commissions computed from the Partners rates.
 * Scrolls inside its own focusable box on narrow screens so the page never scrolls sideways.
 */
export function CommissionTable({ rows, locale, labels }: { rows: CommissionRow[]; locale: Locale; labels: Labels }) {
  const money = (amount: number, fromPrice: boolean, cents: boolean) => {
    const figure = cents ? formatCommission(amount, locale) : formatEuro(amount, locale)
    return fromPrice ? labels.from(figure) : figure
  }
  const head = 'px-5 py-4 text-xs font-semibold uppercase tracking-wider'
  return (
    <div
      role="region"
      aria-label={labels.caption}
      tabIndex={0}
      data-reveal
      className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-bg-1/60"
    >
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <caption className="sr-only">{labels.caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={`${head} text-ink-3`}>{labels.plan}</th>
            <th scope="col" className={`${head} text-ink-3`}>{labels.priceWithMaintenance}</th>
            <th scope="col" className={`${head} text-amber`}>{labels.commissionWithMaintenance}</th>
            <th scope="col" className={`${head} text-ink-3`}>{labels.priceWebOnly}</th>
            <th scope="col" className={`${head} text-ink-3`}>{labels.commissionWebOnly}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-5 py-4 font-medium text-ink-0">{r.name}</th>
              <td className="px-5 py-4 whitespace-nowrap text-ink-2">{money(r.withMaintenance.price, r.fromPrice, false)}</td>
              <td className="px-5 py-4 whitespace-nowrap font-semibold text-amber-hi">{money(r.withMaintenance.commission, r.fromPrice, true)}</td>
              <td className="px-5 py-4 whitespace-nowrap text-ink-2">{money(r.webOnly.price, r.fromPrice, false)}</td>
              <td className="px-5 py-4 whitespace-nowrap font-medium text-ink-0">{money(r.webOnly.commission, r.fromPrice, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
