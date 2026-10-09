import type { Payload, Where } from 'payload'

/**
 * S12: contact requests are anonymized (not deleted) 24 months after their last activity.
 * "Last activity" is the contact's `updatedAt`: it moves on every status/assignment/notes change and every
 * reply (panel or email), so an ongoing conversation keeps the request intact.
 * Kept: id, dates, project type, status, plan/quote/budget/timeline, consents, locale, assignment and the
 * reply rows (date, author, channel). Cleared: everything that identifies or was written by the client,
 * free-text notes, attribution/campaign data, the IP hash and reply subjects/bodies.
 */

export const RETENTION_MONTHS = 24
export const ANONYMIZED = 'anonymized'
const ANONYMIZED_DOMAIN = 'invalid.invalid'
const DEFAULT_BATCH = 100

/** `now` minus `months` calendar months (UTC), clamped to the month's last day (29 Feb → 28 Feb). */
export function retentionCutoff(now: Date, months = RETENTION_MONTHS): Date {
  const total = now.getUTCFullYear() * 12 + now.getUTCMonth() - months
  const year = Math.floor(total / 12)
  const month = total - year * 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cutoff = new Date(now)
  cutoff.setUTCFullYear(year, month, Math.min(now.getUTCDate(), lastDay))
  return cutoff
}

/** Placeholder for the required `email`: unique per contact, valid for Payload's validator, never deliverable. */
export const anonymizedEmail = (id: number | string) => `${ANONYMIZED}+${id}@${ANONYMIZED_DOMAIN}`

const MARKER = /^anonymized\+[^@\s]+@invalid\.invalid$/
/** The placeholder email is the marker: no schema change needed to keep the job idempotent. */
export const isAnonymized = (contact: { email?: string | null }) => MARKER.test(contact.email ?? '')

type Ref = number | string | { id: number | string } | null | undefined
type Reply = {
  id?: string | null
  sentAt: string
  author?: Ref
  subject?: string
  body?: string
  channel?: string | null
  inboundId?: string | null
}
export type RetainedContact = { id: number | string; email?: string | null; replies?: Reply[] | null }

const refId = (r: Ref) => (r && typeof r === 'object' ? r.id : r)

/** The update that anonymizes one contact (required fields get neutral placeholders). */
export function anonymizedContactData(contact: RetainedContact) {
  return {
    name: ANONYMIZED,
    email: anonymizedEmail(contact.id),
    message: ANONYMIZED,
    phone: null,
    howFound: null,
    internalNotes: null,
    sourcePath: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    fbclid: null,
    ipHash: null,
    replies: (contact.replies ?? []).map((r) => ({
      id: r.id,
      sentAt: r.sentAt,
      author: refId(r.author),
      subject: ANONYMIZED,
      body: ANONYMIZED,
      channel: r.channel,
      inboundId: r.inboundId,
    })),
  }
}

/** `payload run` forwards only positional arguments, so the env flag is the reliable switch for npm scripts. */
export const isDryRun = (argv: readonly string[], env: Record<string, string | undefined>) =>
  argv.includes('--dry-run') || env.ANONYMIZE_DRY_RUN === '1'

export type RetentionResult = { cutoff: string; matched: number; anonymized: number; alreadyAnonymized: number; dryRun: boolean }

/**
 * Anonymizes every contact whose `updatedAt` is older than the cutoff, in id-ordered batches (a cursor on
 * `id`, so dry runs and skipped rows never loop). Local API with `overrideAccess` (the fields are locked for
 * users); Contacts has no hooks with side effects (emails and Meta CAPI live in the form's Server Action), and
 * `context.contactRetention` lets any future hook opt out. Returns counts only: nothing personal is logged.
 */
export async function anonymizeContacts(
  payload: Payload,
  { now = new Date(), dryRun = false, batchSize = DEFAULT_BATCH }: { now?: Date; dryRun?: boolean; batchSize?: number } = {},
): Promise<RetentionResult> {
  const cutoff = retentionCutoff(now).toISOString()
  const result: RetentionResult = { cutoff, matched: 0, anonymized: 0, alreadyAnonymized: 0, dryRun }
  let lastId: number | string | undefined

  for (;;) {
    const where: Where = {
      and: [{ updatedAt: { less_than: cutoff } }, ...(lastId === undefined ? [] : [{ id: { greater_than: lastId } }])],
    }
    const { docs } = await payload.find({
      collection: 'contacts',
      where,
      sort: 'id',
      limit: batchSize,
      depth: 0,
      overrideAccess: true,
      select: { email: true, replies: true },
    })
    if (docs.length === 0) break

    for (const doc of docs as unknown as RetainedContact[]) {
      result.matched++
      if (isAnonymized(doc)) {
        result.alreadyAnonymized++
        continue
      }
      if (!dryRun) {
        await payload.update({
          collection: 'contacts',
          id: doc.id,
          data: anonymizedContactData(doc) as never,
          depth: 0,
          overrideAccess: true,
          select: { id: true } as never,
          context: { contactRetention: true },
        })
      }
      result.anonymized++
    }
    lastId = docs[docs.length - 1]!.id
    if (docs.length < batchSize) break
  }
  return result
}
