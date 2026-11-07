'use client'
import { type ReactNode, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/** `role`: what screen readers announce instead of the English word "carousel". */
type Labels = { region: string; role: string; prev: string; next: string }

/**
 * Horizontal, swipeable list of project cards (server-rendered `<li>`s passed as children).
 * Touch: native scrolling with snap points. Mouse: drag to scroll, or the arrow buttons. Keyboard: Tab moves
 * through the cards (each one scrolls into view) and the arrows are real buttons. A drag never opens a card.
 */
export function ProjectCarousel({ children, labels }: { children: ReactNode; labels: Labels }) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  const step = (dir: 1 | -1) => {
    const el = track.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: 'smooth' })
  }

  // Mouse drag (touch and pen already scroll natively).
  const onPointerDown = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !track.current) return
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLUListElement>) => {
    const d = drag.current
    const el = track.current
    if (!d || !el) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < 6) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
      el.setPointerCapture(e.pointerId)
    }
    el.scrollLeft = d.left - dx
  }
  const endDrag = () => {
    const d = drag.current
    if (!d) return
    setDragging(false)
    // Keep the flag through the click that follows the release, then forget the drag.
    if (d.moved) window.setTimeout(() => (drag.current = null))
    else drag.current = null
  }

  return (
    <div className="relative" role="region" aria-roledescription={labels.role} aria-label={labels.region}>
      <ul
        ref={track}
        data-lenis-prevent-horizontal
        data-testid="project-carousel"
        className={cn(
          'no-scrollbar -mx-4 -mt-2 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pt-2 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0',
          dragging ? 'cursor-grabbing snap-none select-none' : 'cursor-grab',
          '[&>li]:w-[84%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[46%] lg:[&>li]:w-[calc((100%-2.5rem)/3)]',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        onFocusCapture={(e) => {
          // A card reached with Tab is brought fully into view.
          const li = (e.target as HTMLElement).closest('li')
          li?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }}
      >
        {children}
      </ul>
      <div className="mt-4 flex justify-end gap-2" data-testid="project-carousel-controls">
        <CarouselButton label={labels.prev} disabled={edges.start} onClick={() => step(-1)} dir="prev" />
        <CarouselButton label={labels.next} disabled={edges.end} onClick={() => step(1)} dir="next" />
      </div>
    </div>
  )
}

function CarouselButton({ label, disabled, onClick, dir }: { label: string; disabled: boolean; onClick: () => void; dir: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-line-hi bg-bg-1 text-ink-0 transition-colors hover:border-brand hover:text-brand disabled:cursor-default disabled:opacity-35 disabled:hover:border-line-hi disabled:hover:text-ink-0"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}
