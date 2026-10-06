'use client'
import { useEffect } from 'react'
import { useConsent } from '@/features/tracking/use-consent'
import { expireLeadCookieString, readLeadCookie, shouldFireLead } from './lead-proof'
import { trackPixel } from './meta-pixel'

// Fires `Lead` only with proof of a real submission (cp_lead cookie === ?e=) and marketing consent,
// then clears the cookie so reloads never double count.
export function TrackLead({ eventId }: { eventId?: string }) {
  const marketing = useConsent().consent?.marketing === true
  useEffect(() => {
    if (!shouldFireLead({ eventId, cookieValue: readLeadCookie(), marketing })) return
    let tries = 0
    const id = setInterval(() => {
      if (window.fbq) {
        clearInterval(id)
        if (!shouldFireLead({ eventId, cookieValue: readLeadCookie(), marketing })) return
        trackPixel('Lead', {}, eventId)
        document.cookie = expireLeadCookieString()
      } else if (++tries > 20) clearInterval(id)
    }, 300)
    return () => clearInterval(id)
  }, [eventId, marketing])
  return null
}
