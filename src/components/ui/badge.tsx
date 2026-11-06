import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-line bg-bg-2 px-3 py-1 text-xs font-medium text-ink-1', className)}>
      {children}
    </span>
  )
}
