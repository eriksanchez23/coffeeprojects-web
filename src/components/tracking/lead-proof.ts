// Proof of a real submission: the contact action sets `cp_lead=<eventId>` only after the contact was
// saved. The thank-you page fires a Lead only when this cookie matches `?e=`, so honeypot hits and
// direct visits never count. Client-safe (no Node imports) so both the action and TrackLead use it.
export const LEAD_COOKIE = 'cp_lead'
export const LEAD_COOKIE_MAX_AGE_S = 60 * 10

const EVENT_ID = /^[A-Za-z0-9-]{8,64}$/

export function shouldFireLead(a: { eventId: string | undefined; cookieValue: string | undefined; marketing: boolean }): boolean {
  return a.marketing && !!a.eventId && EVENT_ID.test(a.eventId) && a.cookieValue === a.eventId
}

export function readLeadCookie(): string | undefined {
  const match = document.cookie.split('; ').find((p) => p.startsWith(`${LEAD_COOKIE}=`))
  return match?.slice(LEAD_COOKIE.length + 1)
}

export function expireLeadCookieString(): string {
  return `${LEAD_COOKIE}=; Max-Age=0; Path=/`
}
