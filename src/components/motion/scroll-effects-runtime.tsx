'use client'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { usePathname } from 'next/navigation'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

const MOTION_OK = '(prefers-reduced-motion: no-preference)'

/**
 * Scroll-driven effects bound to data attributes rendered by the sections.
 * Everything is set up from JS after hydration, so server HTML (and no-JS / reduced-motion visitors)
 * always shows the final, fully visible content. gsap.matchMedia reverts all of it if the visitor
 * switches to reduced motion.
 */
export default function ScrollEffectsRuntime() {
  const pathname = usePathname()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        // 1. Reveal cards in batches
        gsap.set('[data-reveal]', { autoAlpha: 0, y: 40 })
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 88%',
          once: true,
          onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }),
        })

        // 2. Headline split reveal (SplitText keeps an aria-label with the full text)
        document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
          const split = SplitText.create(el, { type: 'words', mask: 'words' })
          gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.04 })
        })

        // 3. Counters: the final value is in the HTML; count up from 0 only here, restore it on revert
        const counters = gsap.utils.toArray<HTMLElement>('[data-count-to]')
        counters.forEach((el) => {
          const to = Number(el.dataset.countTo)
          if (!Number.isFinite(to)) return
          const decimals = Number.isInteger(to) ? 0 : 1
          const obj = { v: 0 }
          el.textContent = '0'
          gsap.to(obj, {
            v: to,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => {
              el.textContent = obj.v.toFixed(decimals)
            },
          })
        })
        return () =>
          counters.forEach((el) => {
            el.textContent = el.dataset.countTo ?? el.textContent
          })
      })

      // 4. Process: pinned step-by-step progress on desktop
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const list = document.querySelector<HTMLElement>('[data-process]')
        if (!list) return
        const steps = gsap.utils.toArray<HTMLElement>('[data-process-step]', list)
        gsap.set(steps, { opacity: 0.25 })
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: list,
            start: 'top 30%',
            end: `+=${steps.length * 220}`,
            pin: list.closest('section') ?? list,
            scrub: 0.6,
          },
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
