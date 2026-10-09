import type { Endpoint, PayloadRequest } from 'payload'
import { isTeam } from '@/access'
import { thankYouEmail } from '@/features/contact/emails'
import { buildThankYouPdf, CONTACT_EMAIL, type ThankYouLocale, thankYouCopy, thankYouLocale } from '@/features/contact/thank-you-pdf'
import { projectTypeLabels } from '@/fields/labels'
import { errorFields, resendRequest } from '@/lib/resend'
import type { Contact } from '@/payload-types'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import fr from '../../messages/fr.json'

/**
 * S22: the thank-you PDF of a contact request, for team users only.
 * - GET  /api/contacts/:id/thank-you.pdf — download it to review it (nothing is sent or stored).
 * - POST /api/contacts/:id/thank-you     — email it to the client from THANK_YOU_FROM_ADDRESS (default
 *   contact@coffeeprojects.es, replies to contact@) and append the send to the request's `thankYouSent`.
 *   Without RESEND_API_KEY, or when Resend fails, nothing is stored. The request status never changes.
 * The request is read with the user's own access; logs carry error kinds only, never personal data.
 */

export type ThankYouError = 'unauthorized' | 'notFound' | 'emailNotConfigured' | 'sendFailed' | 'saveFailed'

type AuthorRef = number | string | { id: number | string } | null | undefined
type ThankYouContact = Pick<Contact, 'id' | 'name' | 'email' | 'locale' | 'projectType' | 'plan' | 'quotedSummary' | 'message'> & {
  thankYouSent?: { id?: string | null; sentAt: string; author?: AuthorRef }[] | null
}

const SEND_TIMEOUT_MS = 15_000
const messages = { es, en, fr } as const

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status })
const fail = (status: number, error: ThankYouError) => json(status, { error })
const authorId = (a: AuthorRef) => (a && typeof a === 'object' ? a.id : a)

function logFailure(req: PayloadRequest, step: string, e: unknown) {
  req.payload.logger.error({ err: errorFields(e) }, `thank-you PDF: ${step} failed`)
}

/** Sender of the thank-you email (S22): contact@ unless THANK_YOU_FROM_ADDRESS says otherwise. */
export function thankYouFrom(source: Record<string, string | undefined> = process.env): string {
  return `CoffeeProjects <${source.THANK_YOU_FROM_ADDRESS?.trim() || CONTACT_EMAIL}>`
}

const fileName = (locale: ThankYouLocale, id: number | string) => thankYouCopy[locale].fileName.replace(/\.pdf$/, `-${id}.pdf`)

async function loadContact(req: PayloadRequest): Promise<ThankYouContact | null> {
  try {
    const id = String(req.routeParams?.id ?? '')
    return (await req.payload.findByID({ collection: 'contacts', id, depth: 0, overrideAccess: false, user: req.user })) as ThankYouContact
  } catch {
    return null
  }
}

/** The plan's name in the client's language; the slug when the pricing global cannot be read. */
async function planName(req: PayloadRequest, slug: string | null | undefined, locale: ThankYouLocale): Promise<string | null> {
  if (!slug) return null
  try {
    const pricing = (await req.payload.findGlobal({ slug: 'pricing', locale, depth: 0 })) as { packages?: { slug?: string; name?: string }[] | null }
    return pricing.packages?.find((p) => p.slug === slug)?.name?.trim() || slug
  } catch {
    return slug
  }
}

async function renderPdf(req: PayloadRequest, contact: ThankYouContact) {
  const locale = thankYouLocale(contact.locale)
  const types = messages[locale].contact.projectTypes as Record<string, string>
  const bytes = await buildThankYouPdf(
    {
      name: contact.name,
      projectType: types[contact.projectType] ?? projectTypeLabels[contact.projectType]?.es ?? contact.projectType,
      plan: await planName(req, contact.plan, locale),
      quotedSummary: contact.quotedSummary,
      message: contact.message,
      reference: contact.id,
    },
    locale,
  )
  return { bytes, locale, fileName: fileName(locale, contact.id) }
}

const allowed = async (req: PayloadRequest) => Boolean(req.user) && Boolean(await isTeam({ req }))

export async function thankYouPdfHandler(req: PayloadRequest): Promise<Response> {
  if (!(await allowed(req))) return fail(401, 'unauthorized')
  const contact = await loadContact(req)
  if (!contact) return fail(404, 'notFound')
  const pdf = await renderPdf(req, contact)
  return new Response(Buffer.from(pdf.bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${pdf.fileName}"`,
      'cache-control': 'private, no-store',
    },
  })
}

export async function thankYouSendHandler(req: PayloadRequest): Promise<Response> {
  if (!(await allowed(req))) return fail(401, 'unauthorized')
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return fail(503, 'emailNotConfigured')
  const contact = await loadContact(req)
  if (!contact) return fail(404, 'notFound')

  const pdf = await renderPdf(req, contact)
  const sent = contact.thankYouSent ?? []
  const email = thankYouEmail(contact.name, pdf.locale, thankYouCopy[pdf.locale].title)
  try {
    await resendRequest(
      apiKey,
      '/emails',
      {
        method: 'POST',
        // Same key for a retry of the same send (double click, flaky network); a recorded send moves it on.
        headers: { 'content-type': 'application/json', 'idempotency-key': `thank-you/${contact.id}/${sent.length}` },
        body: JSON.stringify({
          from: thankYouFrom(),
          to: [contact.email],
          reply_to: CONTACT_EMAIL,
          ...email,
          attachments: [{ filename: pdf.fileName, content: Buffer.from(pdf.bytes).toString('base64') }],
        }),
      },
      SEND_TIMEOUT_MS,
    )
  } catch (e) {
    logFailure(req, 'send', e)
    return fail(502, 'sendFailed')
  }

  const sentAt = new Date().toISOString()
  try {
    // `thankYouSent` is read-only for everyone (field access): only this endpoint writes it, and nothing else.
    await req.payload.update({
      collection: 'contacts',
      id: contact.id,
      overrideAccess: true,
      user: req.user,
      data: { thankYouSent: [...sent.map((s) => ({ ...s, author: authorId(s.author) })), { sentAt, author: req.user!.id }] } as never,
    })
  } catch (e) {
    logFailure(req, 'save', e)
    return fail(500, 'saveFailed')
  }
  req.payload.logger.info('thank-you PDF: sent')
  return json(200, { ok: true, sentAt })
}

export const contactThankYouPdfEndpoint: Endpoint = { path: '/:id/thank-you.pdf', method: 'get', handler: thankYouPdfHandler }
export const contactThankYouSendEndpoint: Endpoint = { path: '/:id/thank-you', method: 'post', handler: thankYouSendHandler }
