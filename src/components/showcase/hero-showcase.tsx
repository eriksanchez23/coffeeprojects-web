'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/components/motion/use-reduced-motion'
import { cn } from '@/lib/cn'
import type { ShowcaseSlide } from '@/lib/showcase'
import { BrowserFrame, PhoneFrame, SiteSketch } from './device-frames'

const INTERVAL_MS = 5000

/**
 * Home hero visual: real screenshots of our projects in a browser and a phone frame, cross-fading from one project
 * to the next every few seconds (paused on hover/focus and for reduced motion). The first slide is server-rendered
 * and loads with priority, so the hero paints the same with or without JS. `showLabel` names each dot, with
 * `{title}` replaced by the project title.
 */
export function HeroShowcase({ slides, showLabel }: { slides: ShowcaseSlide[]; showLabel: string }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = useReducedMotion()
  const count = slides.length

  useEffect(() => {
    if (count < 2 || paused || reduced) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [count, paused, reduced])

  const current = slides[active]
  const hasPhone = slides.some((s) => s.mobile)

  return (
    <div
      className="relative mx-auto w-full max-w-[600px] pb-10 lg:pb-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div aria-hidden className="hero-glow pointer-events-none absolute -inset-10 -z-10" />
      <BrowserFrame url={current?.url ?? 'tunegocio.es'} className="hero-float">
        {count === 0 ? (
          <SiteSketch />
        ) : (
          <div className="relative aspect-[16/10] overflow-hidden bg-bg-2">
            {slides.map((s, i) => (
              <Image
                key={s.slug}
                src={s.desktop.src}
                alt={s.desktop.alt}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 600px, 100vw"
                aria-hidden={i !== active}
                className={cn(
                  'object-cover object-top transition-[opacity,transform] duration-1000 ease-out',
                  i === active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
                )}
              />
            ))}
          </div>
        )}
      </BrowserFrame>
      <PhoneFrame className="hero-float-slow absolute -bottom-6 -left-8 hidden w-[24%] sm:block lg:-bottom-14 lg:-left-12">
        {hasPhone ? (
          <div className="relative aspect-[390/844] bg-bg-2">
            {slides.map((s, i) =>
              s.mobile ? (
                <Image
                  key={s.slug}
                  src={s.mobile.src}
                  alt={s.mobile.alt}
                  fill
                  sizes="180px"
                  aria-hidden={i !== active}
                  className={cn('object-cover object-top transition-opacity duration-1000', i === active ? 'opacity-100' : 'opacity-0')}
                />
              ) : null,
            )}
          </div>
        ) : (
          <SiteSketch variant="mobile" />
        )}
      </PhoneFrame>
      {count > 1 && (
        <div className="absolute -bottom-2 right-0 flex gap-2 lg:-bottom-12" role="group">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setActive(i)}
              aria-label={showLabel.replace('{title}', s.title)}
              aria-pressed={i === active}
              className={cn('h-2 rounded-full transition-all duration-500', i === active ? 'w-8 bg-brand' : 'w-2 bg-line-hi hover:bg-ink-3')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
