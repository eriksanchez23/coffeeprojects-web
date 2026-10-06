'use client'
import { openConsentSettings } from '@/features/tracking/use-consent'

/** Reopens the consent dialog. The only interactive bit of the (server-rendered) footer. */
export function ManageCookiesButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className="text-left hover:text-ink-0 md:text-right">
      {label}
    </button>
  )
}
