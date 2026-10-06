'use client'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { readConsentFromDocument } from '@/features/tracking/consent'
import { useConsent } from '@/features/tracking/use-consent'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; disablePushState?: boolean }
declare global {
  interface Window {
    fbq?: Fbq
  }
}

// Never sends without marketing consent: the consent cookie is re-read on every call, so revoking
// stops tracking immediately even though the already-loaded fbevents.js stays in memory.
export function trackPixel(event: 'PageView' | 'ViewContent' | 'Contact' | 'Lead', params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined' || !window.fbq) return
  if (readConsentFromDocument()?.marketing !== true) return
  window.fbq('track', event, params ?? {}, eventId ? { eventID: eventId } : undefined)
}

function expireMetaCookies() {
  const host = window.location.hostname
  const parent = host.split('.').length > 2 ? host.split('.').slice(-2).join('.') : host
  for (const name of ['_fbp', '_fbc']) {
    document.cookie = `${name}=; Max-Age=0; Path=/`
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${host}`
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${parent}`
  }
}

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const { consent } = useConsent()
  const granted = consent?.marketing === true
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  // Withdrawing consent: tell fbevents.js to stop and drop Meta's own cookies. Re-granting resumes it.
  useEffect(() => {
    if (!window.fbq) return
    if (granted) window.fbq('consent', 'grant')
    else {
      window.fbq('consent', 'revoke')
      expireMetaCookies()
    }
  }, [granted])

  // SPA navigations: the base code sends the first PageView, so only route changes are tracked here.
  useEffect(() => {
    if (lastPath.current !== null && lastPath.current !== pathname) trackPixel('PageView')
    lastPath.current = pathname
  }, [pathname])

  // Outbound contact clicks (mailto/chat) marked with data-track="contact...".
  useEffect(() => {
    if (!granted) return
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-track^="contact"]')
      if (el) trackPixel('Contact')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [granted])

  const id = pixelId?.replace(/\D/g, '')
  // The script is not rendered at all until marketing consent is granted (no load-then-revoke).
  if (!id || !granted) return null
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq.disablePushState=true;fbq('set','autoConfig',false,'${id}');fbq('init','${id}');fbq('track','PageView');`}
    </Script>
  )
}
