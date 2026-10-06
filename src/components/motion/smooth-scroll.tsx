'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/** Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger stays in sync. Renders nothing. */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      anchors: true,
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

    return () => {
      observer.disconnect()
      gsap.ticker.remove(update)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])

  return null
}
