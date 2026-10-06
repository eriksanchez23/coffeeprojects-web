'use client'
import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render(el: HTMLElement, options: Record<string, unknown>): string
  remove(id: string): void
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript(): Promise<TurnstileApi> {
  const w = window as unknown as { turnstile?: TurnstileApi }
  if (w.turnstile) return Promise.resolve(w.turnstile)
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => (w.turnstile ? resolve(w.turnstile) : reject(new Error('turnstile missing'))), { once: true })
    script.addEventListener('error', () => reject(new Error('turnstile failed to load')), { once: true })
  })
}

/**
 * Explicit rendering: Turnstile tokens are single-use, so the parent remounts this widget
 * (via `key`) after every submission to get a fresh challenge. The widget adds a hidden
 * `cf-turnstile-response` input to the surrounding form.
 */
export function TurnstileWidget({ siteKey, locale }: { siteKey: string; locale: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !siteKey) return
    let widgetId: string | undefined
    let cancelled = false
    loadScript()
      .then((api) => {
        if (cancelled) return
        widgetId = api.render(el, { sitekey: siteKey, theme: 'dark', language: locale, size: 'flexible' })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (widgetId) (window as unknown as { turnstile?: TurnstileApi }).turnstile?.remove(widgetId)
    }
  }, [siteKey, locale])

  return <div ref={ref} />
}
