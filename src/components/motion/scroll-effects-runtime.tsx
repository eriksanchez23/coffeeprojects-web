'use client'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { usePathname } from 'next/navigation'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

const MOTION_OK = '(prefers-reduced-motion: no-preference)'

/**
 * Elements the visitor can already see (or has scrolled past) when effects are set up are left untouched:
 * hiding them after the server HTML painted would flash and re-animate content (and the hero h1 is the LCP).
 */
function belowFold(el: Element): boolean {
  return el.getBoundingClientRect().top >= window.innerHeight
}

/**
 * Scroll-driven effects bound to data attributes rendered by the sections.
 * Everything is set up from JS after hydration and only for below-the-fold elements, so server HTML
 * (and no-JS / reduced-motion visitors) always shows the final, fully visible content.
 * gsap.matchMedia reverts all of it if the visitor switches to reduced motion.
 */
export default function ScrollEffectsRuntime() {
  const pathname = usePathname()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        // 1. Reveal cards in batches
        const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]').filter(belowFold)
        if (reveals.length > 0) {
          gsap.set(reveals, { autoAlpha: 0, y: 40 })
          ScrollTrigger.batch(reveals, {
            start: 'top 88%',
            once: true,
            onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }),
          })
        }

        // 2. Headline split reveal (SplitText keeps an aria-label with the full text)
        gsap.utils
          .toArray<HTMLElement>('[data-split]')
          .filter(belowFold)
          .forEach((el) => {
            const split = SplitText.create(el, { type: 'words', mask: 'words' })
            gsap.from(split.words, {
              yPercent: 110,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.04,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            })
          })

        // 3. Counters: React's span (with the final value) stays untouched and is swapped for a JS-owned
        //    display span that counts up; the screen-reader copy in the markup never changes.
        const restore: (() => void)[] = []
        gsap.utils
          .toArray<HTMLElement>('[data-count-to]')
          .filter(belowFold)
          .forEach((el) => {
            const finalText = el.dataset.countTo ?? ''
            const to = Number(finalText)
            if (!Number.isFinite(to)) return
            const decimals = Number.isInteger(to) ? 0 : 1
            const display = document.createElement('span')
            display.setAttribute('aria-hidden', 'true')
            display.textContent = '0'
            el.after(display)
            el.style.display = 'none'
            restore.push(() => {
              display.remove()
              el.style.display = ''
            })
            const obj = { v: 0 }
            gsap.to(obj, {
              v: to,
              duration: 1.8,
              ease: 'power3.out',
              scrollTrigger: { trigger: display, start: 'top 90%', once: true },
              onUpdate: () => {
                display.textContent = obj.v.toFixed(decimals)
              },
              onComplete: () => {
                display.textContent = finalText
              },
            })
          })

        // Web fonts change line heights and trigger positions once they load.
        void document.fonts?.ready.then(() => ScrollTrigger.refresh())

        // Ready marker (E2E): effects are set up for this route.
        document.documentElement.dataset.scrollEffects = 'ready'
        return () => {
          delete document.documentElement.dataset.scrollEffects
          restore.forEach((r) => r())
        }
      })

      // 4. Process: steps light up one by one while scrolling (no pinning: the page keeps its natural rhythm)
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const list = document.querySelector<HTMLElement>('[data-process]')
        if (!list || !belowFold(list)) return
        const steps = gsap.utils.toArray<HTMLElement>('[data-process-step]', list)
        gsap.set(steps, { opacity: 0.25 })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: list, start: 'top 85%', end: 'bottom 60%', scrub: 0.6 },
        })
        steps.forEach((s) => tl.to(s, { opacity: 1, y: -8, duration: 1 }))
      })

      // 5. Magnetic CTAs (pointer devices only)
      mm.add(`${MOTION_OK} and (hover: hover) and (pointer: fine)`, () => {
        const cleanups: (() => void)[] = []
        document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
          // The button's CSS transform transition would fight the per-frame GSAP tween.
          const previousTransition = el.style.transitionProperty
          el.style.transitionProperty = 'background-color, box-shadow'
          const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' })
          const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' })
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            xTo((e.clientX - (r.left + r.width / 2)) * 0.25)
            yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
          }
          const leave = () => {
            xTo(0)
            yTo(0)
          }
          el.addEventListener('pointermove', move)
          el.addEventListener('pointerleave', leave)
          cleanups.push(() => {
            el.removeEventListener('pointermove', move)
            el.removeEventListener('pointerleave', leave)
            el.style.transitionProperty = previousTransition
          })
        })
        return () => cleanups.forEach((c) => c())
      })

      return () => mm.revert()
    },
    { dependencies: [pathname], revertOnUpdate: true },
  )

  return null
}
