import { clientCopy, clientLocale } from './email-templates/copy'
import { type ClientEmailInput, renderClientEmail } from './email-templates/client'
import { renderReplyEmail } from './email-templates/reply'
import { renderTeamEmail, type TeamEmailContact } from './email-templates/team'

export type { TeamEmailContact }

/** Used when no team user has an email and CONTACT_NOTIFY_EMAIL is unset: a lead must always reach someone. */
export const FALLBACK_NOTIFY_EMAIL = 'contact@coffeeprojects.es'

/**
 * S18: every team user (their own panel email) plus CONTACT_NOTIFY_EMAIL when set, deduplicated
 * case-insensitively, in that order.
 */
export function teamRecipients(users: readonly { email?: string | null }[], notifyEmail: string | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of [...users.map((u) => u.email), notifyEmail]) {
    const email = raw?.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out.length > 0 ? out : [FALLBACK_NOTIFY_EMAIL]
}

/** S18/S14: the team notification (branded, Spanish): all the request data and a link to it in the admin. */
export function teamEmail(c: TeamEmailContact, opts: { adminUrl: string }) {
  return renderTeamEmail(c, opts)
}

/** S14: the visitor's confirmation, in their locale. `quotedSummary` is the price/time text the form showed. */
export function clientEmail(i: ClientEmailInput) {
  return renderClientEmail(i)
}

/** S19: default subject of a reply from the panel, on the thread of the auto-reply the client received. */
export function replySubject(locale: string | null | undefined): string {
  return `Re: ${clientCopy[clientLocale(locale)].subject}`
}

/** S19: the team's reply as typed (plain text) plus an escaped, branded HTML version that keeps its line breaks. */
export function replyEmail(message: string, locale?: string | null) {
  return renderReplyEmail(message, locale)
}
