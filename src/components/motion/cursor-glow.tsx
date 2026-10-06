'use client'
import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './device'

/** Amber glow that follows the pointer on fine-pointer desktops. Decorative only. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let cancelled = false
    let move: ((e: PointerEvent) => void) | undefined
    // GSAP is loaded lazily so it stays out of the first-load JS.
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return
      el.style.opacity = '1'
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
      move = (e: PointerEvent) => {
        xTo(e.clientX - 200)
        yTo(e.clientY - 200)
      }
      window.addEventListener('pointermove', move)
    })
    return () => {
      cancelled = true
      if (move) window.removeEventListener('pointermove', move)
      el.style.opacity = ''
    }
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-700"
      style={{ background: 'radial-gradient(circle, rgba(245,167,66,.12), transparent 65%)' }}
    />
  )
}
