'use client'
import { openConsentSettings } from '@/features/tracking/use-consent'

/** Reopens the consent dialog. The only interactive bit of the (server-rendered) footer. */
export function ManageCookiesButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className="py-1 text-left text-ink-2 transition-colors hover:text-ink-0">
      {label}
    </button>
  )
}
