'use client'
import { useEffect, useState } from 'react'

const ENGAGEMENT = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'wheel', 'keydown'] as const

/**
 * Becomes true once the browser is idle (at most `timeoutMs` after mount) or the visitor engages, whichever
 * comes first. Used to keep enhancement-only code (smooth scroll, scroll effects) out of the first paint and
 * hydration window; above-the-fold content never depends on it (R24).
 */
export function useDeferredStart(timeoutMs = 2000): boolean {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (started) return
    const start = () => setStarted(true)
    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(start, { timeout: timeoutMs })
        : window.setTimeout(start, timeoutMs)
    ENGAGEMENT.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }))
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
      ENGAGEMENT.forEach((e) => window.removeEventListener(e, start))
    }
  }, [started, timeoutMs])

  return started
}
