'use client'
import dynamic from 'next/dynamic'

// GSAP + plugins are an enhancement: load them after hydration so they stay out of every route's first-load JS.
const ScrollEffectsRuntime = dynamic(() => import('./scroll-effects-runtime'), { ssr: false })

/** Scroll reveals, split headlines, counters, pinned process and magnetic CTAs (see scroll-effects-runtime). */
export function ScrollEffects() {
  return <ScrollEffectsRuntime />
}
