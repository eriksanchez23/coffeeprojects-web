'use client'
import { useEffect } from 'react'
import { useConsent } from '@/features/tracking/use-consent'
import { trackPixel } from './meta-pixel'

// Waits for the consent-gated Pixel to exist; without consent (or a Pixel id) nothing ever fires.
export function TrackViewContent({ name, category }: { name: string; category: string }) {
  const granted = useConsent().consent?.marketing === true
  useEffect(() => {
    if (!granted) return
    let tries = 0
    const id = setInterval(() => {
      if (window.fbq) {
        trackPixel('ViewContent', { content_name: name, content_category: category })
        clearInterval(id)
      } else if (++tries > 20) clearInterval(id)
    }, 300)
    return () => clearInterval(id)
  }, [granted, name, category])
  return null
}
