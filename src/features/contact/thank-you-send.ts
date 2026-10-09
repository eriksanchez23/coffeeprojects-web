import type { Payload } from 'payload'
import { confirmationEmail } from '@/features/contact/emails'
import { buildThankYouPdf, CONTACT_EMAIL, type ThankYouLocale, thankYouCopy, thankYouLocale } from '@/features/contact/thank-you-pdf'
import { projectTypeLabels } from '@/fields/labels'
import { resendRequest } from '@/lib/resend'
import type { Contact } from '@/payload-types'
import en from '../../../messages/en.json'
import es from '../../../messages/es.json'
import fr from '../../../messages/fr.json'

/**
 * S22: render the thank-you PDF of a contact request and email it to the client. Shared by the panel button
 * (POST /api/contacts/:id/thank-you) and the automatic send right after the request is submitted.
 */

type AuthorRef = number | string | { id: number | string } | null | undefined
export type ThankYouContact = Pick<Contact, 'id' | 'name' | 'email' | 'locale' | 'projectType' | 'plan' | 'quotedSummary' | 'message'> & {
  thankYouSent?: { id?: string | null; sentAt: string; author?: AuthorRef }[] | null
}

/** Which step failed, so callers can answer 502 (send) or 500 (save) without inspecting messages. */
export class ThankYouStepError extends Error {
  constructor(
    readonly step: 'send' | 'save',
    readonly cause: unknown,
  ) {
    super(`thank-you PDF: ${step} failed`)
    this.name = 'ThankYouStepError'
  }
}

const SEND_TIMEOUT_MS = 15_000
const messages = { es, en, fr } as const
const authorId = (a: AuthorRef) => (a && typeof a === 'object' ? a.id : a)

/** Sender of the thank-you email (S22): contact@ unless THANK_YOU_FROM_ADDRESS says otherwise. */
export function thankYouFrom(source: Record<string, string | undefined> = process.env): string {
  return `CoffeeProjects <${source.THANK_YOU_FROM_ADDRESS?.trim() || CONTACT_EMAIL}>`
}

const fileName = (locale: ThankYouLocale, id: number | string) => thankYouCopy[locale].fileName.replace(/\.pdf$/, `-${id}.pdf`)

/** The plan's name in the client's language; the slug when the pricing global cannot be read. */
async function planName(payload: Payload, slug: string | null | undefined, locale: ThankYouLocale): Promise<string | null> {
  if (!slug) return null
  try {
    const pricing = (await payload.findGlobal({ slug: 'pricing', locale, depth: 0 })) as { packages?: { slug?: string; name?: string }[] | null }
    return pricing.packages?.find((p) => p.slug === slug)?.name?.trim() || slug
  } catch {
    return slug
  }
}

/** The PDF in the language the client used on the site when sending the request. */
export async function renderThankYouPdf(payload: Payload, contact: ThankYouContact) {
  const locale = thankYouLocale(contact.locale)
  const types = messages[locale].contact.projectTypes as Record<string, string>
  const bytes = await buildThankYouPdf(
    {
      name: contact.name,
      projectType: types[contact.projectType] ?? projectTypeLabels[contact.projectType]?.es ?? contact.projectType,
      plan: await planName(payload, contact.plan, locale),
      quotedSummary: contact.quotedSummary,
      message: contact.message,
      reference: contact.id,
    },
    locale,
  )
  return { bytes, locale, fileName: fileName(locale, contact.id) }
}

/**
 * Email the PDF to the client and append the send to `thankYouSent` (author = the team user, or null for the
 * automatic send). Throws ThankYouStepError('send') when Resend fails (nothing stored) and
 * ThankYouStepError('save') when the email went out but the record could not be updated.
 */
export async function sendThankYouPdf(
  payload: Payload,
  contact: ThankYouContact,
  opts: {
    apiKey: string
    author: number | string | null
    email: { subject: string; html: string; text?: string }
    idempotencyKey: string
  },
): Promise<{ sentAt: string }> {
  const pdf = await renderThankYouPdf(payload, contact)
  try {
    await resendRequest(
      opts.apiKey,
      '/emails',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': opts.idempotencyKey },
        body: JSON.stringify({
          from: thankYouFrom(),
          to: [contact.email],
          reply_to: CONTACT_EMAIL,
          ...opts.email,
          attachments: [{ filename: pdf.fileName, content: Buffer.from(pdf.bytes).toString('base64') }],
        }),
      },
      SEND_TIMEOUT_MS,
    )
  } catch (e) {
    throw new ThankYouStepError('send', e)
  }

  const sentAt = new Date().toISOString()
  const sent = contact.thankYouSent ?? []
  try {
    // `thankYouSent` is read-only for everyone (field access): only this function writes it.
    await payload.update({
      collection: 'contacts',
      id: contact.id,
      overrideAccess: true,
      data: { thankYouSent: [...sent.map((s) => ({ ...s, author: authorId(s.author) })), { sentAt, author: opts.author }] } as never,
    })
  } catch (e) {
    throw new ThankYouStepError('save', e)
  }
  return { sentAt }
}

/**
 * S22: right after a request is submitted, the client's confirmation email goes out from contact@ with the
 * thank-you PDF attached, in the language they used on the site. Recorded in `thankYouSent` with no author.
 */
export function sendClientConfirmation(payload: Payload, contact: ThankYouContact, apiKey: string) {
  return sendThankYouPdf(payload, contact, {
    apiKey,
    author: null,
    email: confirmationEmail(contact.locale),
    idempotencyKey: `thank-you/${contact.id}/auto`,
  })
}
