'use client'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { useDeferredStart } from './use-deferred-start'
import { useReducedMotion } from './use-reduced-motion'

// Lenis + GSAP load after hydration, outside the first-load JS budget.
const SmoothScroll = dynamic(() => import('./smooth-scroll'), { ssr: false })

/**
 * Enables smooth scrolling unless the visitor prefers reduced motion (checked live).
 * Children keep the same position in the tree either way, so toggling never remounts the page.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  // Mounted on idle or first engagement, never inside the first-paint/hydration window.
  const started = useDeferredStart()
  return (
    <>
      {children}
      {!reduced && started && <SmoothScroll />}
    </>
  )
}
