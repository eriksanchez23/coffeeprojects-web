import { PDFDocument } from 'pdf-lib'
import type { PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contactThankYouPdfEndpoint, contactThankYouSendEndpoint } from '@/endpoints/contact-thank-you'
import { pdfText } from '../helpers/pdf-text'

const previous = { id: 't1', sentAt: '2026-10-01T10:00:00.000Z', author: { id: 9, email: 'ana@coffeeprojects.es' } }
const contact = {
  id: 7,
  name: 'Jean Dupont',
  email: 'client@example.com',
  locale: 'fr',
  status: 'new',
  projectType: 'ecommerce',
  plan: 'tienda-online',
  quotedSummary: 'Formule choisie : Tienda Online · Délai estimé : 4–6 semaines (TVA (21 %) incluse)',
  message: 'Bonjour, je veux une boutique.',
  replies: [],
  thankYouSent: [previous],
}

function fakeReq(over: { user?: unknown; payload?: Record<string, unknown> } = {}) {
  const payload = {
    findByID: vi.fn().mockResolvedValue(contact),
    findGlobal: vi.fn().mockResolvedValue({ packages: [{ slug: 'tienda-online', name: 'Boutique en ligne' }] }),
    update: vi.fn().mockResolvedValue({}),
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    ...over.payload,
  }
  const req = {
    user: 'user' in over ? over.user : { id: 3, email: 'erik@coffeeprojects.es', collection: 'users', role: 'editor' },
    routeParams: { id: '7' },
    payload,
  }
  return { req: req as unknown as PayloadRequest, payload }
}

const mockFetch = (res: { ok: boolean; status?: number; body?: unknown } = { ok: true, body: { id: 'em_1' } }) => {
  const fn = vi.fn(
    async (_url: string, _init: RequestInit) => new Response(JSON.stringify(res.body ?? {}), { status: res.status ?? (res.ok ? 200 : 500) }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

async function send(r: PayloadRequest) {
  const res = await contactThankYouSendEndpoint.handler(r)
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

describe('thank-you PDF endpoints (S22)', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('THANK_YOU_FROM_ADDRESS', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is mounted on the contacts collection', () => {
    expect(contactThankYouPdfEndpoint).toMatchObject({ path: '/:id/thank-you.pdf', method: 'get' })
    expect(contactThankYouSendEndpoint).toMatchObject({ path: '/:id/thank-you', method: 'post' })
  })

  describe('GET /api/contacts/:id/thank-you.pdf', () => {
    it('denies anonymous requests', async () => {
      const { req, payload } = fakeReq({ user: null })
      const res = await contactThankYouPdfEndpoint.handler(req)
      expect(res.status).toBe(401)
      expect(payload.findByID).not.toHaveBeenCalled()
    })

    it('returns the PDF in the client language as an attachment, read with the user own access', async () => {
      const { req, payload } = fakeReq()
      const res = await contactThankYouPdfEndpoint.handler(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('application/pdf')
      expect(res.headers.get('content-disposition')).toBe('attachment; filename="CoffeeProjects-remerciements-7.pdf"')
      expect(res.headers.get('cache-control')).toContain('no-store')
      expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'contacts', id: '7', overrideAccess: false, user: req.user }))
      const bytes = new Uint8Array(await res.arrayBuffer())
      await expect(PDFDocument.load(bytes)).resolves.toBeTruthy()
      const text = await pdfText(bytes)
      for (const s of ['Merci de faire confiance à CoffeeProjects', 'Bonjour Jean Dupont,', 'Boutique en ligne', 'Délai estimé : 4–6 semaines']) {
        expect(text).toContain(s)
      }
      expect(payload.update).not.toHaveBeenCalled()
    })

    it('falls back to the plan slug when the pricing global cannot be read', async () => {
      const { req } = fakeReq({ payload: { findGlobal: vi.fn().mockRejectedValue(new Error('db')) } })
      const res = await contactThankYouPdfEndpoint.handler(req)
      expect(res.status).toBe(200)
      expect(await pdfText(new Uint8Array(await res.arrayBuffer()))).toContain('tienda-online')
    })

    it('answers 404 when the request is not readable', async () => {
      const { req } = fakeReq({ payload: { findByID: vi.fn().mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 })) } })
      expect((await contactThankYouPdfEndpoint.handler(req)).status).toBe(404)
    })
  })

  describe('POST /api/contacts/:id/thank-you', () => {
    it('denies anonymous requests without reading or sending anything', async () => {
      const fetch = mockFetch()
      const { req, payload } = fakeReq({ user: null })
      expect(await send(req)).toEqual({ status: 401, body: { error: 'unauthorized' } })
      expect(payload.findByID).not.toHaveBeenCalled()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('answers 503 and records nothing when RESEND_API_KEY is missing', async () => {
      vi.stubEnv('RESEND_API_KEY', '')
      const fetch = mockFetch()
      const { req, payload } = fakeReq()
      expect(await send(req)).toEqual({ status: 503, body: { error: 'emailNotConfigured' } })
      expect(fetch).not.toHaveBeenCalled()
      expect(payload.update).not.toHaveBeenCalled()
    })

    it('emails the PDF to the client from contact@ and appends the send to thankYouSent only', async () => {
      const fetch = mockFetch()
      const { req, payload } = fakeReq()
      const res = await send(req)
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ ok: true })

      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, init] = fetch.mock.calls[0]!
      expect(url).toBe('https://api.resend.com/emails')
      expect(init.method).toBe('POST')
      const headers = new Headers(init.headers)
      expect(headers.get('authorization')).toBe('Bearer re_test')
      expect(headers.get('idempotency-key')).toBe('thank-you/7/1')
      const body = JSON.parse(String(init.body))
      expect(body).toMatchObject({
        from: 'CoffeeProjects <contact@coffeeprojects.es>',
        to: ['client@example.com'],
        reply_to: 'contact@coffeeprojects.es',
        subject: 'Merci de faire confiance à CoffeeProjects',
      })
      expect(body.text).toContain('Bonjour Jean Dupont,')
      expect(body.attachments).toHaveLength(1)
      expect(body.attachments[0].filename).toBe('CoffeeProjects-remerciements-7.pdf')
      const pdf = Buffer.from(body.attachments[0].content, 'base64')
      expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-')

      expect(payload.update).toHaveBeenCalledTimes(1)
      const update = payload.update.mock.calls[0]![0]
      expect(update).toMatchObject({ collection: 'contacts', id: 7 })
      expect(Object.keys(update.data)).toEqual(['thankYouSent'])
      expect(update.data.thankYouSent).toHaveLength(2)
      expect(update.data.thankYouSent[0]).toEqual({ id: 't1', sentAt: previous.sentAt, author: 9 })
      expect(update.data.thankYouSent[1]).toMatchObject({ author: 3 })
      expect(new Date(update.data.thankYouSent[1].sentAt).getTime()).not.toBeNaN()
    })

    it('uses THANK_YOU_FROM_ADDRESS as the sender when set', async () => {
      vi.stubEnv('THANK_YOU_FROM_ADDRESS', 'hola@coffeeprojects.es')
      const fetch = mockFetch()
      const { req } = fakeReq()
      await send(req)
      expect(JSON.parse(String(fetch.mock.calls[0]![1].body)).from).toBe('CoffeeProjects <hola@coffeeprojects.es>')
    })

    it('answers 502 and leaves the request unchanged when Resend fails, logging no personal data', async () => {
      mockFetch({ ok: false, status: 422, body: { message: 'Invalid `to` field: client@example.com' } })
      const { req, payload } = fakeReq()
      expect(await send(req)).toEqual({ status: 502, body: { error: 'sendFailed' } })
      expect(payload.update).not.toHaveBeenCalled()
      const logged = JSON.stringify(payload.logger.error.mock.calls)
      expect(logged).not.toContain('client@example.com')
      expect(logged).toContain('422')
    })

    it('answers 502 when Resend cannot be reached', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
      const { req, payload } = fakeReq()
      expect(await send(req)).toEqual({ status: 502, body: { error: 'sendFailed' } })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it('reports a save failure after the email went out', async () => {
      mockFetch()
      const { req } = fakeReq({ payload: { update: vi.fn().mockRejectedValue(new Error('db')) } })
      expect(await send(req)).toEqual({ status: 500, body: { error: 'saveFailed' } })
    })
  })
})
