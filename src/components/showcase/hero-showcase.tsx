'use client'
import Image from 'next/image'
import { type PointerEvent, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/components/motion/use-reduced-motion'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { ShowcaseSlide } from '@/lib/showcase'
import { BrowserFrame, PhoneFrame, SiteSketch } from './device-frames'

const INTERVAL_MS = 5000
/** Horizontal distance (px) that turns a press on the frame into a swipe instead of a click. */
const SWIPE_PX = 40

export type HeroShowcaseLabels = {
  /** `dots[i]`: accessible name of the dot that shows slide i. */
  dots: string[]
  /** `open[i]`: accessible name of the frame link to project i. */
  open: string[]
  prev: string
  next: string
  viewProject: string
}

/**
 * Home hero visual: real screenshots of our projects in a browser and a phone frame, cross-fading from one project
 * to the next every few seconds (paused on hover/focus, after a manual change and for reduced motion). Visitors
 * can swipe the frame (or use the arrows and dots) and click it to open the project page; the caption under it
 * names the project and its technologies. The first slide is server-rendered and fetched with high priority, so the hero
 * paints the same with or without JS. Labels are translated on the server.
 */
export function HeroShowcase({ slides, labels }: { slides: ShowcaseSlide[]; labels: HeroShowcaseLabels }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  // A manual change (swipe, arrow, dot) stops the autoplay for good: the visitor is in control.
  const [stopped, setStopped] = useState(false)
  const reduced = useReducedMotion()
  const count = slides.length
  const drag = useRef<{ x: number; y: number; swiped: boolean } | null>(null)

  useEffect(() => {
    if (count < 2 || paused || stopped || reduced) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [count, paused, stopped, reduced])

  const go = (i: number) => {
    setStopped(true)
    setActive(((i % count) + count) % count)
  }
  const onPointerDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, swiped: false }
  }
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d || d.swiped || count < 2) return
    const dx = e.clientX - d.x
    // Mostly horizontal and far enough: one swipe per press. Vertical moves stay a page scroll (touch-action).
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
      d.swiped = true
      go(active + (dx < 0 ? 1 : -1))
    }
  }

  const current = slides[active]
  const hasPhone = slides.some((s) => s.mobile)

  return (
    <div
      className="relative mx-auto w-full max-w-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div aria-hidden className="hero-glow pointer-events-none absolute -inset-10 -z-10" />
      <div className="relative">
        <BrowserFrame url={current?.url ?? 'tunegocio.es'} className="hero-float">
          {count === 0 || !current ? (
            <SiteSketch />
          ) : (
            <Link
              href={{ pathname: '/projects/[slug]', params: { slug: current.slug } }}
              aria-label={labels.open[active]}
              data-testid="hero-showcase-link"
              draggable={false}
              className="group relative block aspect-[16/10] cursor-pointer touch-pan-y overflow-hidden bg-bg-2 select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => {
                // A swipe keeps its flag until the click that follows the release has been cancelled.
                if (drag.current?.swiped) window.setTimeout(() => (drag.current = null))
                else drag.current = null
              }}
              onPointerLeave={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              onClickCapture={(e) => {
                // The press that swiped must not also open the project.
                if (drag.current?.swiped) e.preventDefault()
              }}
            >
              {slides.map((s, i) => (
                <Image
                  key={s.slug}
                  src={s.desktop.src}
                  alt={i === active ? s.desktop.alt : ''}
                  fill
                  draggable={false}
                  // The first slide is fetched first (it is what paints); the others wait their turn.
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  sizes="(min-width: 1024px) 600px, 100vw"
                  aria-hidden={i !== active}
                  className={cn(
                    'pointer-events-none object-cover object-top transition-[opacity,transform] duration-700 ease-out',
                    i === active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
                  )}
                />
              ))}
              <span
                aria-hidden
                className="absolute right-3 bottom-3 rounded-full bg-espresso/85 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[var(--shadow-soft)] transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {labels.viewProject} →
              </span>
            </Link>
          )}
        </BrowserFrame>
        <PhoneFrame className="hero-float-slow pointer-events-none absolute -bottom-6 -left-8 hidden w-[24%] sm:block lg:-bottom-14 lg:-left-12">
          {hasPhone ? (
            <div className="relative aspect-[390/844] bg-bg-2">
              {/* A project without a phone capture shows the neutral sketch instead of an empty screen. */}
              <div className={cn('absolute inset-0 transition-opacity duration-700', current?.mobile ? 'opacity-0' : 'opacity-100')}>
                <SiteSketch variant="mobile" />
              </div>
              {slides.map((s, i) =>
                s.mobile ? (
                  <Image
                    key={s.slug}
                    src={s.mobile.src}
                    alt={i === active ? s.mobile.alt : ''}
                    fill
                    sizes="180px"
                    aria-hidden={i !== active}
                    className={cn('object-cover object-top transition-opacity duration-700', i === active ? 'opacity-100' : 'opacity-0')}
                  />
                ) : null,
              )}
            </div>
          ) : (
            <SiteSketch variant="mobile" />
          )}
        </PhoneFrame>
      </div>

      {count > 0 && current && (
        // From `sm` up the phone frame overlaps the bottom-left corner of the browser frame: the row starts after it.
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:pl-[22%] lg:mt-6 lg:pl-[20%]">
          <p className="min-w-0 text-sm" aria-live="polite" data-testid="hero-showcase-caption">
            <Link
              href={{ pathname: '/projects/[slug]', params: { slug: current.slug } }}
              className="font-semibold text-ink-0 underline-offset-4 hover:text-brand hover:underline"
            >
              {current.title}
            </Link>
            {current.stack.length > 0 && <span className="block truncate text-xs text-ink-3">{current.stack.join(' · ')}</span>}
          </p>
          {count > 1 && (
            <div className="flex items-center gap-1.5" role="group" data-testid="hero-showcase-controls">
              <ArrowButton label={labels.prev} onClick={() => go(active - 1)} dir="prev" />
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={labels.dots[i] ?? s.title}
                  aria-pressed={i === active}
                  className="group/dot flex h-8 items-center px-0.5"
                >
                  <span
                    className={cn(
                      'block h-2 rounded-full transition-all duration-500',
                      i === active ? 'w-8 bg-brand' : 'w-2 bg-line-hi group-hover/dot:bg-ink-3',
                    )}
                  />
                </button>
              ))}
              <ArrowButton label={labels.next} onClick={() => go(active + 1)} dir="next" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ArrowButton({ label, onClick, dir }: { label: string; onClick: () => void; dir: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full border border-line-hi bg-bg-1 text-ink-1 transition-colors hover:border-brand hover:text-brand"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}
