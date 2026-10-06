'use client'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/features/tracking/use-consent'
import { Link } from '@/i18n/navigation'

export function ConsentBanner() {
  const t = useTranslations('consent')
  const { consent, setMarketing, isOpen } = useConsent()
  const [configuring, setConfiguring] = useState(false)
  const [marketing, setMarketingDraft] = useState(consent?.marketing ?? false)
  const titleId = useId()

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-[var(--radius-lg)] border border-line-hi bg-bg-1/95 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:bottom-6"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p className="mt-2 text-sm text-ink-2">
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

      {/* Reject and Accept have equal visual weight (AEPD guidance). */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setMarketing(false)}>
          {t('reject')}
        </Button>
        {configuring ? (
          <Button variant="outline" onClick={() => setMarketing(marketing)}>
            {t('save')}
          </Button>
        ) : (
          <Button
            variant="outline"
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
