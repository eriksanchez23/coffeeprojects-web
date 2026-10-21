import type { Endpoint, PayloadRequest } from 'payload'
import { isTeam } from '@/access'
import { thankYouEmail } from '@/features/contact/emails'
import { thankYouCopy, thankYouLocale } from '@/features/contact/thank-you-pdf'
import { renderThankYouPdf, sendThankYouPdf, type ThankYouContact, ThankYouStepError } from '@/features/contact/thank-you-send'
import { errorFields } from '@/lib/resend'

export { thankYouFrom } from '@/features/contact/thank-you-send'

/**
 * S22: the thank-you PDF of a contact request, for team users only.
 * - GET  /api/contacts/:id/thank-you.pdf — download it to review it (nothing is sent or stored).
 * - POST /api/contacts/:id/thank-you     — email it to the client from THANK_YOU_FROM_ADDRESS (default
 *   contact@coffeeprojects.es, replies to contact@) and append the send to the request's `thankYouSent`.
 *   Without RESEND_API_KEY, or when Resend fails, nothing is stored. The request status never changes.
 * The request is read with the user's own access; logs carry error kinds only, never personal data.
 */

export type ThankYouError = 'unauthorized' | 'notFound' | 'emailNotConfigured' | 'sendFailed' | 'saveFailed'

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status })
const fail = (status: number, error: ThankYouError) => json(status, { error })

async function loadContact(req: PayloadRequest): Promise<ThankYouContact | null> {
  try {
    const id = String(req.routeParams?.id ?? '')
    return (await req.payload.findByID({ collection: 'contacts', id, depth: 0, overrideAccess: false, user: req.user })) as ThankYouContact
  } catch {
    return null
  }
}

const allowed = async (req: PayloadRequest) => Boolean(req.user) && Boolean(await isTeam({ req }))

export async function thankYouPdfHandler(req: PayloadRequest): Promise<Response> {
  if (!(await allowed(req))) return fail(401, 'unauthorized')
  const contact = await loadContact(req)
  if (!contact) return fail(404, 'notFound')
  const pdf = await renderThankYouPdf(req.payload, contact)
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

  const locale = thankYouLocale(contact.locale)
  try {
    const { sentAt } = await sendThankYouPdf(req.payload, contact, {
      apiKey,
      author: req.user!.id,
      email: thankYouEmail(contact.name, locale, thankYouCopy[locale].title),
      // Same key for a retry of the same send (double click, flaky network); a recorded send moves it on.
      idempotencyKey: `thank-you/${contact.id}/${(contact.thankYouSent ?? []).length}`,
    })
    req.payload.logger.info('thank-you PDF: sent')
    return json(200, { ok: true, sentAt })
  } catch (e) {
    const step = e instanceof ThankYouStepError ? e.step : 'send'
    req.payload.logger.error({ err: errorFields(e instanceof ThankYouStepError ? e.cause : e) }, `thank-you PDF: ${step} failed`)
    return step === 'save' ? fail(500, 'saveFailed') : fail(502, 'sendFailed')
  }
}

export const contactThankYouPdfEndpoint: Endpoint = { path: '/:id/thank-you.pdf', method: 'get', handler: thankYouPdfHandler }
export const contactThankYouSendEndpoint: Endpoint = { path: '/:id/thank-you', method: 'post', handler: thankYouSendHandler }
