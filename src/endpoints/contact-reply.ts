import type { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'
import { isTeam } from '@/access'
import { replyEmail } from '@/features/contact/emails'

/**
 * S19: POST /api/contacts/:id/reply — a team user answers a contact request from the panel.
 * Sends the email to the client (from EMAIL_FROM_ADDRESS via the Resend adapter, replyTo = the user), then
 * appends it to the request's `replies` and sets the status to `answered`. If email is not configured or the
 * send fails, nothing is stored and the status does not change.
 */

export type ReplyError = 'unauthorized' | 'invalid' | 'notFound' | 'emailNotConfigured' | 'sendFailed' | 'saveFailed'

const noControl = (v: unknown) => (typeof v === 'string' ? v.replace(/\p{Cc}/gu, '') : v)
const replySchema = z.object({
  // Single line: control characters (CR/LF) never reach the email headers.
  subject: z.preprocess(noControl, z.string().trim().min(1).max(200)),
  message: z.string().trim().min(1).max(10_000),
})

type StoredReply = { id?: string | null; sentAt: string; author: number | string | { id: number | string } | null; subject: string; body: string }

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status })
const fail = (status: number, error: ReplyError) => json(status, { error })

// Provider errors can echo recipients or the message: log only the error kind/status/code (as the contact form does).
function logFailure(req: PayloadRequest, step: string, e: unknown) {
  const err = e as { name?: unknown; status?: unknown; statusCode?: unknown; code?: unknown } | null
  const pick = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? v : undefined)
  req.payload.logger.error(
    { err: { name: pick(err?.name), status: pick(err?.status ?? err?.statusCode), code: pick(err?.code) } },
    `contact reply: ${step} failed`,
  )
}

async function readBody(req: PayloadRequest): Promise<unknown> {
  try {
    return await req.json?.()
  } catch {
    return undefined
  }
}

const authorId = (a: StoredReply['author']) => (a && typeof a === 'object' ? a.id : a)

export async function replyHandler(req: PayloadRequest): Promise<Response> {
  if (!req.user || !(await isTeam({ req }))) return fail(401, 'unauthorized')

  const parsed = replySchema.safeParse(await readBody(req))
  if (!parsed.success) return fail(400, 'invalid')
  if (!process.env.RESEND_API_KEY) return fail(503, 'emailNotConfigured')

  const id = String(req.routeParams?.id ?? '')
  let contact: { id: number | string; email: string; replies?: StoredReply[] | null }
  try {
    // The user's own access decides whether the request exists for them.
    contact = (await req.payload.findByID({ collection: 'contacts', id, depth: 0, overrideAccess: false, user: req.user })) as typeof contact
  } catch {
    return fail(404, 'notFound')
  }

  const { subject, message } = parsed.data
  try {
    await req.payload.sendEmail({ to: contact.email, replyTo: req.user.email, subject, ...replyEmail(message) })
  } catch (e) {
    logFailure(req, 'send', e)
    return fail(502, 'sendFailed')
  }

  try {
    // `replies` is read-only for everyone (field access), so the history is written here only.
    await req.payload.update({
      collection: 'contacts',
      id: contact.id,
      overrideAccess: true,
      user: req.user,
      data: {
        status: 'answered',
        replies: [
          ...(contact.replies ?? []).map((r) => ({ ...r, author: authorId(r.author) })),
          { sentAt: new Date().toISOString(), author: req.user.id, subject, body: message },
        ],
      } as never,
    })
  } catch (e) {
    logFailure(req, 'save', e)
    return fail(500, 'saveFailed')
  }
  return json(200, { ok: true, status: 'answered' })
}

export const contactReplyEndpoint: Endpoint = { path: '/:id/reply', method: 'post', handler: replyHandler }
