'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect } from 'react'
import { SMOOTH_INPUT } from './use-smooth-input'

gsap.registerPlugin(ScrollTrigger)

/** Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger stays in sync. Renders nothing. */
export default function SmoothScroll() {
  useEffect(() => {
    // On phones and tablets Lenis would not smooth anything (touch scrolling stays native) but would still run
    // every frame on the main thread, which made the reading progress bar trail behind the finger.
    if (!window.matchMedia(SMOOTH_INPUT).matches) return
    const lenis = new Lenis({
      autoRaf: false,
      // Snappier than Lenis' default (0.1): the page (and the progress bar) stops right after the wheel does.
      lerp: 0.2,
      // In-page anchors are handled below: Lenis' own handler smooth-scrolls on top of the native jump.
      anchors: false,
      stopInertiaOnNavigate: true,
      // The mobile menu panel keeps native scrolling even while the page is locked.
      prevent: (node) => node.id === 'mobile-menu',
    })
    const update = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    // Scroll locks (the mobile menu sets body overflow:hidden) must also stop the smooth scroller.
    const syncLock = () => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start())
    const observer = new MutationObserver(syncLock)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    syncLock()

    // Same-page hash links: one smooth scroll, the URL hash kept, and focus moved like a native jump
    // (the skip link must land keyboard focus on <main>).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== '_self')) return
      const url = new URL(link.href)
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!target) return
      e.preventDefault()
      if (url.hash !== location.hash) history.pushState(history.state, '', url.hash)
      lenis.scrollTo(target)
      if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      observer.disconnect()
      gsap.ticker.remove(update)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])

  return null
}
