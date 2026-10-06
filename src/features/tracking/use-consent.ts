'use client'
import { useCallback, useSyncExternalStore } from 'react'
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

// "Reopened" is module-level so every useConsent() instance (banner shell, dialog, footer) agrees on it.
let reopened = false
const reopenListeners = new Set<() => void>()

function setReopened(value: boolean) {
  if (reopened === value) return
  reopened = value
  for (const l of reopenListeners) l()
}

function subscribeReopened(onChange: () => void) {
  reopenListeners.add(onChange)
  const onOpen = () => setReopened(true)
  window.addEventListener(CONSENT_OPEN, onOpen)
  return () => {
    reopenListeners.delete(onChange)
    window.removeEventListener(CONSENT_OPEN, onOpen)
  }
}

export function useConsent() {
  // null on the server and during hydration: nothing is rendered until the cookie has been read.
  const raw = useSyncExternalStore(subscribe, readRawCookie, () => null)
  const isReopened = useSyncExternalStore(subscribeReopened, () => reopened, () => false)

  const consent = raw === null ? null : parseConsent(raw)
  const isOpen = raw !== null && (consent === null || isReopened)

  const setMarketing = useCallback((granted: boolean) => {
    const next: Consent = { v: 1, marketing: granted, ts: Date.now() }
    document.cookie = consentCookieString(next)
    setReopened(false)
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED, { detail: next }))
  }, [])

  // Closing without a choice is only allowed when a valid choice already exists; it never grants anything.
  const dismiss = useCallback(() => {
    if (consent !== null) setReopened(false)
  }, [consent])

  return { consent, setMarketing, dismiss, reopen: openConsentSettings, isOpen, reopened: isReopened }
}
