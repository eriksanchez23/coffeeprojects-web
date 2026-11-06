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
    <section id={id} className={cn('relative py-20 sm:py-28', className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <Container>
        {(eyebrow || title || lead) && (
          <header className="mb-14 max-w-3xl">
            {eyebrow && (
              <p className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-amber">
                <span aria-hidden className="h-0.5 w-8 rounded-full bg-[linear-gradient(90deg,#c2410c,#e11d48)]" />
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
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
