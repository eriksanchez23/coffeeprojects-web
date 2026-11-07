'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/features/tracking/use-consent'
import { Link } from '@/i18n/navigation'

export function ConsentBanner() {
  const { isOpen, reopened } = useConsent()
  // The dialog is mounted only while open, so its draft state (configuring, marketing) resets on every close.
  return isOpen ? <ConsentDialog focusOnOpen={reopened} /> : null
}

// Focus is taken only when the user reopened the dialog; the first-visit auto-open must not steal it from the skip link.
function ConsentDialog({ focusOnOpen }: { focusOnOpen: boolean }) {
  const t = useTranslations('consent')
  const { consent, setMarketing, dismiss } = useConsent()
  const [configuring, setConfiguring] = useState(false)
  const [marketing, setMarketingDraft] = useState(consent?.marketing ?? false)
  const titleId = useId()
  const bodyId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [shouldFocus] = useState(focusOnOpen)

  useEffect(() => {
    if (!shouldFocus) return
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => previous?.focus?.()
  }, [shouldFocus])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      tabIndex={-1}
      // Lenis must leave the dialog's own scrolling alone (small phones with the settings open).
      data-lenis-prevent
      data-testid="consent-dialog"
      onKeyDown={(e) => {
        if (e.key === 'Escape') dismiss()
      }}
      // Opaque on purpose: a backdrop blur over the hero's moving lights made phones re-blur the page every frame
      // (stutters and, on some iPhones, a crashed tab). It never grows past the screen: it scrolls inside instead,
      // and it stays clear of the iPhone home indicator.
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] max-w-xl overflow-y-auto overscroll-contain rounded-[var(--radius-lg)] border border-line-hi bg-bg-1 p-4 shadow-[var(--shadow-soft)] outline-none sm:bottom-6 sm:p-5"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p id={bodyId} className="mt-2 text-sm text-ink-2">
        {t('body')}{' '}
        <Link href="/cookies" className="text-amber underline">
          {t('policy')}
        </Link>
      </p>

      {configuring && (
        <fieldset className="mt-4 space-y-3 text-sm">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled className="mt-1 accent-amber" />
            <span>
              <strong className="text-ink-0">{t('necessary')}</strong> — {t('necessaryDesc')}
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketingDraft(e.target.checked)}
              className="mt-1 accent-amber"
            />
            <span>
              <strong className="text-ink-0">{t('marketing')}</strong> — {t('marketingDesc')}
            </span>
          </label>
        </fieldset>
      )}

      {/* Reject and Accept have equal visual weight (AEPD guidance). Phones: both side by side, full width,
          and the settings button on its own row below them. */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
        <Button variant="outline" onClick={() => setMarketing(false)}>
          {t('reject')}
        </Button>
        {configuring ? (
          <Button variant="outline" className="order-last col-span-2 sm:order-none" onClick={() => setMarketing(marketing)}>
            {t('save')}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="order-last col-span-2 sm:order-none"
            onClick={() => {
              setMarketingDraft(consent?.marketing ?? false)
              setConfiguring(true)
            }}
          >
            {t('configure')}
          </Button>
        )}
        <Button variant="outline" onClick={() => setMarketing(true)}>
          {t('accept')}
        </Button>
      </div>
    </div>
  )
}
