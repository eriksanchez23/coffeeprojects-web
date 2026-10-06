'use server'
import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildPath } from '@/i18n/build-path'
import { type Locale, locales } from '@/i18n/locales'
import { payloadClient } from '@/lib/cms/client'
import { env } from '@/lib/env'
import { clientEmail, teamEmail } from './emails'
import { type ContactResult, handleContact } from './handle-contact'
import { clientIp, hashIp } from './ip'
import { isRateLimited } from './rate-limit'
import { formDataToObject } from './schema'
import { verifyTurnstile } from './turnstile'

export async function submitContact(_prev: ContactResult | null, fd: FormData): Promise<ContactResult> {
  const h = await headers()
  // No IP (unusual platform): use a per-request key rather than one shared bucket, which would let a few
  // unknown-IP visitors rate-limit everyone else. Trade-off: such requests are not rate limited at all.
  const ip = clientIp(h)
  const payload = await payloadClient()
  // Falls back to the Payload secret so the hash is never unsalted when IP_HASH_SALT is unset.
  const ipHash = hashIp(ip ?? `unknown:${randomUUID()}`, process.env.IP_HASH_SALT || process.env.PAYLOAD_SECRET || '')
  const raw = formDataToObject(fd)
  // Provider errors can echo recipients or submitted values: log only the error kind/status/code.
  const log = (e: unknown) => {
    const err = e as { name?: unknown; status?: unknown; statusCode?: unknown; code?: unknown } | null
    const pick = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? v : undefined)
    payload.logger.error(
      { err: { name: pick(err?.name), status: pick(err?.status ?? err?.statusCode), code: pick(err?.code) } },
      'contact submission step failed',
    )
  }

  // Without a Resend adapter Payload has no real transport: skip sending and log instead.
  const send = async (message: Parameters<typeof payload.sendEmail>[0]) => {
    if (!process.env.RESEND_API_KEY) {
      if (env.isProduction) payload.logger.error('Contact email not sent: RESEND_API_KEY is not set in production')
      else payload.logger.info('Contact email not sent: RESEND_API_KEY is not set')
      return
    }
    await payload.sendEmail(message)
  }

  const result = await handleContact(raw, {
    ipHash,
    newEventId: randomUUID,
    log,
    verifyCaptcha: async (token) => {
      if (!process.env.TURNSTILE_SECRET_KEY) {
        payload.logger.error('Turnstile secret key is not configured: contact form submissions are being rejected')
        return false
      }
      return verifyTurnstile(token, ip ?? undefined)
    },
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
