'use client'
import { useEffect } from 'react'
import {
  ATTR_COOKIE,
  attributionCookieString,
  expireAttributionCookieString,
  extractAttribution,
  mergeAttribution,
  parseAttributionCookie,
} from '@/features/tracking/attribution'
import { type Consent, readConsentFromDocument } from '@/features/tracking/consent'
import { CONSENT_CHANGED } from '@/features/tracking/use-consent'

function readCookie() {
  const m = document.cookie.split('; ').find((p) => p.startsWith(`${ATTR_COOKIE}=`))
  return parseAttributionCookie(m?.slice(ATTR_COOKIE.length + 1))
}

// Captured once per page load; persisted only after marketing consent (ePrivacy), cleared on withdrawal.
export function AttributionCapture() {
  useEffect(() => {
    const landing = extractAttribution(new URLSearchParams(window.location.search), Date.now())
    const persist = () => {
      const merged = mergeAttribution(readCookie(), landing)
      if (merged) document.cookie = attributionCookieString(merged)
    }
    if (readConsentFromDocument()?.marketing) persist()
    const onChange = (e: Event) => {
      if ((e as CustomEvent<Consent>).detail.marketing) persist()
      else document.cookie = expireAttributionCookieString()
    }
    window.addEventListener(CONSENT_CHANGED, onChange)
    return () => window.removeEventListener(CONSENT_CHANGED, onChange)
  }, [])
  return null
}
