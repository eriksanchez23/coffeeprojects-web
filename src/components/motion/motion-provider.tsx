'use client'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useDeferredStart } from './use-deferred-start'
import { useReducedMotion } from './use-reduced-motion'
import { useSmoothInput } from './use-smooth-input'

// Lenis + GSAP load after hydration, outside the first-load JS budget.
const SmoothScroll = dynamic(() => import('./smooth-scroll'), { ssr: false })

/**
 * Enables smooth scrolling unless the visitor prefers reduced motion (checked live).
 * Children keep the same position in the tree either way, so toggling never remounts the page.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  // Phones and tablets never download Lenis: it would not smooth touch scrolling anyway.
  const smoothInput = useSmoothInput()
  // Mounted on idle or first engagement, never inside the first-paint/hydration window.
  const started = useDeferredStart()
  return (
    <>
      {children}
      {!reduced && smoothInput && started && <SmoothScroll />}
    </>
  )
}
