import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Container } from './container'

type Props = {
  id?: string
  eyebrow?: string
  title?: ReactNode
  lead?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ id, eyebrow, title, lead, children, className }: Props) {
  return (
    <section id={id} className={cn('relative py-24 sm:py-32', className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <Container>
        {(eyebrow || title || lead) && (
          <header className="mb-14 max-w-3xl">
            {eyebrow && (
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{eyebrow}</p>
            )}
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="text-4xl font-semibold sm:text-5xl lg:text-6xl">
                {title}
              </h2>
            )}
            {lead && <p className="mt-6 text-lg text-ink-2">{lead}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  )
}
