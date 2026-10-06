'use client'
import dynamic from 'next/dynamic'
import { useDeferredStart } from './use-deferred-start'

// GSAP + plugins are an enhancement: load them after hydration so they stay out of every route's first-load JS.
const ScrollEffectsRuntime = dynamic(() => import('./scroll-effects-runtime'), { ssr: false })

/** Scroll reveals, split headlines, counters, pinned process and magnetic CTAs (see scroll-effects-runtime). */
export function ScrollEffects() {
  // Only below-the-fold elements are animated (R24), so starting on idle/first engagement is invisible.
  const started = useDeferredStart()
  return started ? <ScrollEffectsRuntime /> : null
}
