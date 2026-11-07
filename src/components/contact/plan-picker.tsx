'use client'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** A web plan as a selectable card: prices are formatted on the server (VAT excluded, like the pricing page). */
export type WebPlanCard = { name: string; withPrice: string; withoutPrice: string; featured: boolean; isNew: boolean }
/** A maintenance choice (a plan or "none") as a selectable card. */
export type MaintenanceCard = { name: string; price: string; detail: string; web: string; featured: boolean }

type Labels = { recommended: string; isNew: string; withMaintenance: string }

/**
 * One radio card. The native radio stays in the DOM (visually hidden), so the group keeps arrow-key navigation,
 * form submission (`name`/`value`) and screen-reader semantics; the card only restyles it.
 */
function RadioCard({
  name,
  value,
  checked,
  onChange,
  className,
  testId,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  className?: string
  testId?: string
  children: ReactNode
}) {
  return (
    <label
      data-testid={testId}
      className={cn(
        'relative flex cursor-pointer gap-2.5 rounded-[var(--radius-md)] border bg-bg-1 p-3 transition-[border-color,background-color,box-shadow] duration-200',
        'border-line-hi hover:border-ink-3',
        'has-[:checked]:border-brand has-[:checked]:bg-bg-2 has-[:checked]:shadow-[0_0_0_1px_var(--color-brand)]',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
        'sm:gap-3 sm:p-3.5',
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 border-line-hi transition-colors peer-checked:border-brand peer-checked:[&>span]:scale-100"
      >
        <span className="h-2 w-2 scale-0 rounded-full bg-brand transition-transform duration-200" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

function Badge({ children, tone }: { children: ReactNode; tone: 'amber' | 'outline' }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        tone === 'amber' ? 'bg-amber text-bg-0' : 'border border-line-amber text-amber',
      )}
    >
      {children}
    </span>
  )
}

/** Step 1: the type of website. "Not sure yet" (value "") is a full-width option after the plans. */
export function WebPlanPicker({
  legend,
  hint,
  notSure,
  plans,
  value,
  onChange,
  labels,
}: {
  legend: string
  hint: string
  notSure: string
  plans: { slug: string; card: WebPlanCard }[]
  value: string
  onChange: (slug: string) => void
  labels: Labels
}) {
  return (
    <fieldset aria-describedby="plan-hint" data-testid="plan-picker">
      <legend className="mb-1 text-sm font-semibold text-ink-0">{legend}</legend>
      <p id="plan-hint" className="mb-3 text-xs text-ink-3">
        {hint}
      </p>
      {/* Phones: one compact row per plan (name left, prices right). From `sm`: two columns of cards. */}
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
        {plans.map(({ slug, card }) => (
          <RadioCard key={slug} name="plan" value={slug} checked={value === slug} onChange={() => onChange(slug)} testId={`plan-${slug}`}>
            <span className="flex items-start justify-between gap-3 sm:block">
              <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1 sm:items-start">
                <span className="font-semibold text-ink-0">{card.name}</span>
                {card.featured ? <Badge tone="amber">{labels.recommended}</Badge> : card.isNew ? <Badge tone="outline">{labels.isNew}</Badge> : null}
              </span>
              <span className="max-w-[52%] shrink-0 text-right sm:mt-1 sm:block sm:max-w-none sm:text-left">
                <span className="flex flex-col items-end sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5">
                  <span className="font-display text-lg leading-tight font-semibold text-ink-0 sm:text-xl">{card.withPrice}</span>
                  <span className="text-[11px] text-ink-2 sm:text-xs">{labels.withMaintenance}</span>
                </span>
                <span className="block text-[11px] text-ink-3 sm:text-xs">{card.withoutPrice}</span>
              </span>
            </span>
          </RadioCard>
        ))}
        <RadioCard name="plan" value="" checked={value === ''} onChange={() => onChange('')} className="sm:col-span-2" testId="plan-unsure">
          <span className="text-sm font-medium text-ink-1">{notSure}</span>
        </RadioCard>
      </div>
    </fieldset>
  )
}

/** Step 2: the maintenance plans that unlock the chosen website's reduced price, then "no maintenance". */
export function MaintenancePicker({
  legend,
  hint,
  options,
  value,
  onChange,
  labels,
}: {
  legend: string
  hint: string
  options: { slug: string; card: MaintenanceCard }[]
  value: string
  onChange: (slug: string) => void
  labels: Labels
}) {
  return (
    <fieldset aria-describedby="maintenance-hint" data-testid="maintenance-picker">
      <legend className="mb-1 text-sm font-semibold text-ink-0">{legend}</legend>
      <p id="maintenance-hint" className="mb-3 text-xs text-ink-3">
        {hint}
      </p>
      {/* Two columns; with an odd number of options the last one ("no maintenance") takes the whole row. */}
      <div className="grid gap-2.5 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        {options.map(({ slug, card }) => (
          <RadioCard key={slug} name="maintenance" value={slug} checked={value === slug} onChange={() => onChange(slug)} testId={`maintenance-${slug}`}>
            <span className="flex items-start justify-between gap-2">
              <span className="font-semibold text-ink-0">{card.name}</span>
              {card.featured && <Badge tone="amber">{labels.recommended}</Badge>}
            </span>
            <span className="mt-1 block font-display text-lg font-semibold text-ink-0">{card.price}</span>
            <span className="block text-xs text-ink-3">{card.detail}</span>
            <span className="mt-2 block border-t border-line pt-2 text-xs font-medium text-ink-1">{card.web}</span>
          </RadioCard>
        ))}
      </div>
    </fieldset>
  )
}
