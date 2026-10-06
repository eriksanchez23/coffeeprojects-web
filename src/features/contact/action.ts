'use server'
import { randomUUID } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { LEAD_COOKIE, LEAD_COOKIE_MAX_AGE_S } from '@/components/tracking/lead-proof'
import { buildPath } from '@/i18n/build-path'
import { type Locale, locales } from '@/i18n/locales'
import { payloadClient } from '@/lib/cms/client'
import { env } from '@/lib/env'
import { ATTR_COOKIE, parseAttributionCookie } from '@/features/tracking/attribution'
import { capiConfigFromEnv, sendCapiEvent } from '@/features/tracking/capi'
import { CONSENT_COOKIE, parseConsent } from '@/features/tracking/consent'
import { afterSaveLead } from '@/features/tracking/lead'
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
  // Consent is read from the cookie, not the form field, so a forged field cannot trigger server-side tracking.
  const jar = await cookies()
  const marketing = parseConsent(jar.get(CONSENT_COOKIE)?.value)?.marketing === true
  const attribution = marketing ? parseAttributionCookie(jar.get(ATTR_COOKIE)?.value) : null
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
        data: {
          ...rest,
          privacyAccepted: privacy,
          ndaRequested: nda,
          status: 'new',
          ...(attribution && {
            utmSource: attribution.utmSource,
            utmMedium: attribution.utmMedium,
            utmCampaign: attribution.utmCampaign,
            utmContent: attribution.utmContent,
            utmTerm: attribution.utmTerm,
            fbclid: attribution.fbclid,
          }),
        },
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
    afterSave: async (input, eventId) => {
      await afterSaveLead(
        { ...input, marketingConsent: marketing },
        eventId,
        {
          ip: ip ?? undefined,
          userAgent: h.get('user-agent') ?? '',
          fbp: jar.get('_fbp')?.value,
          fbcCookie: jar.get('_fbc')?.value,
          attribution,
          sourceUrl: `${env.SITE_URL}${input.sourcePath.startsWith('/') ? input.sourcePath : '/'}`,
          nowSeconds: Math.floor(Date.now() / 1000),
        },
        (event) =>
          sendCapiEvent(event, capiConfigFromEnv(process.env, { isProduction: env.isProduction }), {
            log: (message) => (env.isProduction ? payload.logger.error(message) : payload.logger.info(message)),
          }),
      )
    },
  })

  if (result.status === 'ok') {
    // Proof of a real submission for the thank-you page; only set when a Lead can be tracked (saved + consent).
    if (result.saved && marketing) {
      jar.set(LEAD_COOKIE, result.eventId, { maxAge: LEAD_COOKIE_MAX_AGE_S, path: '/', sameSite: 'lax', httpOnly: false, secure: env.SITE_URL.startsWith('https:') })
    }
    const requested = String(raw.locale)
    const locale: Locale = (locales as readonly string[]).includes(requested) ? (requested as Locale) : 'es'
    redirect(`${buildPath('/contact/thanks', locale)}?e=${encodeURIComponent(result.eventId)}`)
  }
  return result
}
