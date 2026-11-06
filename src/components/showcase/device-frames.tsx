import Image from 'next/image'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Desktop browser frame around a screenshot (or any content). */
export function BrowserFrame({ url, children, className }: { url?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1 shadow-[var(--shadow-soft)]', className)}>
      <div className="flex items-center gap-2 border-b border-line bg-bg-2 px-4 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e0d4c4]" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e0d4c4]" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#e0d4c4]" />
        {url && <span className="ml-3 truncate rounded-full bg-bg-1 px-3 py-0.5 text-[11px] text-ink-3">{url}</span>}
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

/** Phone frame around a screenshot. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[28px] border-[6px] border-espresso bg-espresso shadow-[var(--shadow-soft)]', className)}>
      <div className="relative overflow-hidden rounded-[22px] bg-bg-1">{children}</div>
    </div>
  )
}

export type Shot = { src: string; alt: string; width: number; height: number }

export function ShotImage({ shot, priority, sizes, className }: { shot: Shot; priority?: boolean; sizes: string; className?: string }) {
  return (
    <Image
      src={shot.src}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      priority={priority}
      sizes={sizes}
      className={cn('block h-auto w-full', className)}
    />
  )
}

/**
 * Stand-in "website" drawn with CSS, used where no real screenshot exists yet: neutral blocks in brand colors,
 * never a fake client name or fake numbers.
 */
export function SiteSketch({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const mobile = variant === 'mobile'
  return (
    <div aria-hidden className={cn('bg-bg-1', mobile ? 'aspect-[9/17] p-4' : 'aspect-[16/10] p-6')}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded-full bg-brand/80" />
        {!mobile && (
          <div className="flex gap-3">
            <div className="h-2 w-10 rounded-full bg-bg-3" />
            <div className="h-2 w-10 rounded-full bg-bg-3" />
            <div className="h-2 w-10 rounded-full bg-bg-3" />
          </div>
        )}
      </div>
      <div className={cn('grid gap-4', mobile ? 'mt-6' : 'mt-8 grid-cols-[1.2fr_1fr]')}>
        <div>
          <div className="h-4 w-11/12 rounded-full bg-ink-0/85" />
          <div className="mt-2 h-4 w-8/12 rounded-full bg-ink-0/85" />
          <div className="mt-4 h-2 w-10/12 rounded-full bg-bg-3" />
          <div className="mt-2 h-2 w-9/12 rounded-full bg-bg-3" />
          <div className="mt-5 flex gap-2">
            <div className="h-6 w-20 rounded-md bg-brand" />
            <div className="h-6 w-16 rounded-md border border-line-hi" />
          </div>
        </div>
        <div className={cn('rounded-[var(--radius-md)] bg-[linear-gradient(135deg,#e9dccb,#c7a17a)]', mobile ? 'h-28' : 'h-full min-h-28')} />
      </div>
      <div className={cn('mt-6 grid gap-3', mobile ? 'grid-cols-1' : 'grid-cols-3')}>
        {[0, 1, 2].slice(0, mobile ? 2 : 3).map((i) => (
          <div key={i} className="rounded-[var(--radius-sm)] border border-line p-3">
            <div className="h-5 w-5 rounded bg-bg-3" />
            <div className="mt-3 h-2 w-9/12 rounded-full bg-bg-3" />
            <div className="mt-1.5 h-2 w-7/12 rounded-full bg-bg-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
