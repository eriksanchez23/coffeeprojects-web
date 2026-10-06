import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1/60 p-6 backdrop-blur-xl',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgb(245_167_66/0.12),transparent_40%)]',
        'transition-colors duration-300 hover:border-line-amber',
        className,
      )}
    >
      {children}
    </div>
  )
}
