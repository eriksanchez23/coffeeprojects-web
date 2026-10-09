import type { Payload, PayloadRequest } from 'payload'

/**
 * S19/S21: the reply history of a contact request. Both the panel ("Responder", channel `panel`) and the
 * email reply sync (channel `email`) append here after the email reached the client, and set the request
 * status to `answered`.
 */

export type ReplyChannel = 'panel' | 'email'

type AuthorRef = number | string | { id: number | string } | null | undefined

export type StoredReply = {
  id?: string | null
  sentAt: string
  author?: AuthorRef
  subject: string
  body: string
  channel?: ReplyChannel | null
  inboundId?: string | null
}

export type NewReply = { author: number | string; subject: string; body: string; channel: ReplyChannel; inboundId?: string }

export type ContactWithReplies = { id: number | string; replies?: StoredReply[] | null }

const authorId = (a: AuthorRef) => (a && typeof a === 'object' ? a.id : a)

/** True when a reply received by email with this delivery id is already stored (webhook retries). */
export function hasInboundReply(contact: ContactWithReplies, inboundId: string): boolean {
  return (contact.replies ?? []).some((r) => r.inboundId === inboundId)
}

/** Appends the reply to the history and marks the request answered (`replies` is read-only: overrideAccess). */
export async function appendReply(
  payload: Payload,
  contact: ContactWithReplies,
  reply: NewReply,
  user?: PayloadRequest['user'],
): Promise<void> {
  await payload.update({
    collection: 'contacts',
    id: contact.id,
    overrideAccess: true,
    ...(user ? { user } : {}),
    data: {
      status: 'answered',
      replies: [
        ...(contact.replies ?? []).map((r) => ({ ...r, author: authorId(r.author) })),
        { sentAt: new Date().toISOString(), ...reply },
      ],
    } as never,
  })
}
