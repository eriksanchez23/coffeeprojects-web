'use client'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { CONSENT_COOKIE, type Consent, consentCookieString, parseConsent } from './consent'

export const CONSENT_CHANGED = 'cp:consent-changed'
export const CONSENT_OPEN = 'cp:consent-open'

export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN))
}

// The cookie is the single source of truth; the raw string is a stable snapshot for useSyncExternalStore.
function readRawCookie(): string {
  const match = document.cookie.split('; ').find((p) => p.startsWith(`${CONSENT_COOKIE}=`))
  return match?.slice(CONSENT_COOKIE.length + 1) ?? ''
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGED, onChange)
  return () => window.removeEventListener(CONSENT_CHANGED, onChange)
}

export function useConsent() {
  // null on the server and during hydration: nothing is rendered until the cookie has been read.
  const raw = useSyncExternalStore(subscribe, readRawCookie, () => null)
  const [reopened, setReopened] = useState(false)

  useEffect(() => {
    const onOpen = () => setReopened(true)
    window.addEventListener(CONSENT_OPEN, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN, onOpen)
  }, [])

  const consent = raw === null ? null : parseConsent(raw)
  const isOpen = raw !== null && (consent === null || reopened)

  const setMarketing = useCallback((granted: boolean) => {
    const next: Consent = { v: 1, marketing: granted, ts: Date.now() }
    document.cookie = consentCookieString(next)
    setReopened(false)
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED, { detail: next }))
  }, [])

  return { consent, setMarketing, reopen: openConsentSettings, isOpen }
}
