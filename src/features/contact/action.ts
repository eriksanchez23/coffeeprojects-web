'use server'
import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildPath } from '@/i18n/build-path'
import { type Locale, locales } from '@/i18n/locales'
import { payloadClient } from '@/lib/cms/client'
import { clientEmail, teamEmail } from './emails'
import { type ContactResult, handleContact } from './handle-contact'
import { hashIp, isRateLimited } from './rate-limit'
import { formDataToObject } from './schema'
import { verifyTurnstile } from './turnstile'

export async function submitContact(_prev: ContactResult | null, fd: FormData): Promise<ContactResult> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '0.0.0.0'
  const payload = await payloadClient()
  // Falls back to the Payload secret so the hash is never unsalted when IP_HASH_SALT is unset.
  const ipHash = hashIp(ip, process.env.IP_HASH_SALT || process.env.PAYLOAD_SECRET || '')
  const raw = formDataToObject(fd)
  const log = (e: unknown) => payload.logger.error({ err: e }, 'contact submission side effect failed')

  // Without a Resend adapter Payload has no real transport: skip sending and log instead.
  const send = async (message: Parameters<typeof payload.sendEmail>[0]) => {
    if (!process.env.RESEND_API_KEY) {
      payload.logger.info(`Email not sent (RESEND_API_KEY not set): "${String(message.subject)}"`)
      return
    }
    await payload.sendEmail(message)
  }

  const result = await handleContact(raw, {
    ipHash,
    newEventId: randomUUID,
    log,
    verifyCaptcha: (token) => verifyTurnstile(token, ip),
    isRateLimited: () => isRateLimited(payload, ipHash),
    createContact: async (data) => {
      const { privacy, nda, ...rest } = data
      await payload.create({
        collection: 'contacts',
        overrideAccess: true,
        data: { ...rest, privacyAccepted: privacy, ndaRequested: nda, status: 'new' },
      })
    },
    notify: async (input) => {
      const team = teamEmail(input)
      const client = clientEmail(input)
      await Promise.all([
        send({ to: process.env.CONTACT_NOTIFY_EMAIL ?? 'contact@coffeeprojects.es', replyTo: input.email, ...team }),
        send({ to: input.email, ...client }),
      ])
    },
  })

  if (result.status === 'ok') {
    const requested = String(raw.locale)
    const locale: Locale = (locales as readonly string[]).includes(requested) ? (requested as Locale) : 'es'
    redirect(`${buildPath('/contact/thanks', locale)}?e=${encodeURIComponent(result.eventId)}`)
  }
  return result
}
