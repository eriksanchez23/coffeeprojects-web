'use client'
import { useSyncExternalStore } from 'react'

/** Smooth scrolling applies to mouse wheels and trackpads only: touch screens keep their own native scrolling. */
export const SMOOTH_INPUT = '(hover: hover) and (pointer: fine)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(SMOOTH_INPUT)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** Live: does the visitor scroll with a mouse or trackpad? `false` on the server, so nothing loads before hydration. */
export function useSmoothInput(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(SMOOTH_INPUT).matches,
    () => false,
  )
}
