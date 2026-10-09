import type { Endpoint, PayloadRequest } from 'payload'
import { replyEmail, replySubject } from '@/features/contact/emails'
import {
  findTeamSender,
  htmlToText,
  type InboundAuthentication,
  inboundConfig,
  parseRelayAddress,
  senderAuthenticated,
  stripQuotedReply,
  verifySvixSignature,
} from '@/features/contact/inbound'
import { appendReply, type ContactWithReplies, hasInboundReply } from '@/features/contact/replies'
import { emailFrom } from '@/lib/email'

/**
 * S21: POST /api/inbound/resend — Resend's `email.received` webhook. A team user who answers the team
 * notification by email writes to its signed relay Reply-To (r+<id>.<mac>@RESEND_INBOUND_DOMAIN); this
 * forwards the new text to the client (from our address, replyTo the team user) and stores it in the
 * request's replies (channel `email`), setting the status to `answered`.
 *
 * Anything that is not such a reply is acknowledged with 200 and ignored. Temporary failures (fetching the
 * email, forwarding it, saving) answer 500 so Resend retries; the forward uses the Svix message id as its
 * idempotency key, so a retry never emails the client twice. Logs carry reason codes only, never PII.
 */

const RESEND_API = 'https://api.resend.com'
const TIMEOUT_MS = 10_000

type Ignored = 'eventType' | 'token' | 'sender' | 'contact' | 'duplicate' | 'unauthenticated' | 'empty'
type InboundError = 'notConfigured' | 'invalidSignature' | 'invalid' | 'fetchFailed' | 'sendFailed' | 'saveFailed'

type ReceivedEvent = {
  type?: unknown
  data?: { email_id?: unknown; from?: unknown; to?: unknown; cc?: unknown; received_for?: unknown; subject?: unknown }
}
type ReceivedEmail = { subject?: string | null; text?: string | null; html?: string | null; authentication?: InboundAuthentication | null }

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status })
const fail = (status: number, error: InboundError) => json(status, { error })

function ignore(req: PayloadRequest, reason: Ignored): Response {
  req.payload.logger.info({ reason }, 'inbound reply: ignored')
  return json(200, { ok: true, ignored: reason })
}

function logFailure(req: PayloadRequest, step: string, e: unknown) {
  const err = e as { name?: unknown; status?: unknown; statusCode?: unknown; code?: unknown } | null
  const pick = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? v : undefined)
  req.payload.logger.error({ err: { name: pick(err?.name), status: pick(err?.status ?? err?.statusCode), code: pick(err?.code) } }, `inbound reply: ${step} failed`)
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : typeof v === 'string' ? [v] : [])
// Single line, bounded like the panel reply subject: control characters never reach the email headers.
const cleanSubject = (s: unknown) => (typeof s === 'string' ? s.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) : '')

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
  }
}

async function resend(apiKey: string, path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers)
  headers.set('authorization', `Bearer ${apiKey}`)
  const res = await fetch(`${RESEND_API}${path}`, { ...init, headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  // The response body can echo addresses or content: never surface it.
  if (!res.ok) throw new HttpError(res.status)
  return res.json()
}

export async function inboundResendHandler(req: PayloadRequest): Promise<Response> {
  const config = inboundConfig(process.env)
  if (!config) {
    req.payload.logger.error('Inbound reply webhook called but RESEND_INBOUND_DOMAIN / RESEND_WEBHOOK_SECRET / RESEND_API_KEY are not all set')
    return fail(503, 'notConfigured')
  }

  // The signature covers the exact raw body: read it as text before parsing.
  const body = (await req.text?.()) ?? ''
  const svixId = req.headers.get('svix-id') ?? ''
  const valid = verifySvixSignature({
    secret: config.webhookSecret,
    id: svixId,
    timestamp: req.headers.get('svix-timestamp') ?? '',
    signature: req.headers.get('svix-signature') ?? '',
    body,
    nowSeconds: Math.floor(Date.now() / 1000),
  })
  if (!valid) return fail(401, 'invalidSignature')

  let event: ReceivedEvent
  try {
    event = JSON.parse(body) as ReceivedEvent
  } catch {
    return fail(400, 'invalid')
  }
  if (event?.type !== 'email.received' || !event.data) return ignore(req, 'eventType')
  const data = event.data

  const addresses = [...strings(data.to), ...strings(data.cc), ...strings(data.received_for)]
  const contactId = addresses.map((a) => parseRelayAddress(a, config.domain, config.key)).find((id) => id !== null)
  if (!contactId) return ignore(req, 'token')

  const users = await req.payload.find({ collection: 'users', depth: 0, limit: 100, pagination: false, overrideAccess: true, select: { email: true } })
  const sender = findTeamSender(typeof data.from === 'string' ? data.from : null, users.docs as { id: number | string; email?: string | null }[])
  if (!sender?.email) return ignore(req, 'sender')

  let contact: ContactWithReplies & { email: string; locale?: string | null }
  try {
    contact = (await req.payload.findByID({ collection: 'contacts', id: contactId, depth: 0, overrideAccess: true })) as typeof contact
  } catch {
    return ignore(req, 'contact')
  }
  if (!contact?.email) return ignore(req, 'contact')
  if (hasInboundReply(contact, svixId)) return ignore(req, 'duplicate')

  // The webhook carries metadata only: the body comes from the Received emails API.
  let email: ReceivedEmail
  try {
    email = (await resend(config.apiKey, `/emails/receiving/${encodeURIComponent(String(data.email_id ?? ''))}`)) as ReceivedEmail
  } catch (e) {
    logFailure(req, 'fetch', e)
    return fail(500, 'fetchFailed')
  }
  if (!senderAuthenticated(email.authentication)) return ignore(req, 'unauthenticated')

  const text = stripQuotedReply(email.text?.trim() ? email.text : htmlToText(email.html ?? ''))
  if (!text) return ignore(req, 'empty')
  const subject = cleanSubject(data.subject) || cleanSubject(email.subject) || replySubject(contact.locale)

  const from = emailFrom()
  try {
    await resend(config.apiKey, '/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': `inbound-reply/${svixId}` },
      body: JSON.stringify({ from: `${from.name} <${from.address}>`, to: [contact.email], reply_to: sender.email, subject, ...replyEmail(text) }),
    })
  } catch (e) {
    logFailure(req, 'send', e)
    return fail(500, 'sendFailed')
  }

  try {
    await appendReply(req.payload, contact, { author: sender.id, subject, body: text, channel: 'email', inboundId: svixId })
  } catch (e) {
    logFailure(req, 'save', e)
    return fail(500, 'saveFailed')
  }
  req.payload.logger.info('inbound reply: forwarded and stored')
  return json(200, { ok: true, status: 'answered' })
}

export const inboundResendEndpoint: Endpoint = { path: '/inbound/resend', method: 'post', handler: inboundResendHandler }
