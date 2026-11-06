import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Surface card (name kept from the dark theme): white panel, hairline border, soft shadow on hover. */
export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1 p-6',
        'card-lift',
        className,
      )}
    >
      {children}
    </div>
  )
}
