import type { PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contactReplyEndpoint } from '@/endpoints/contact-reply'

const previous = { id: 'r1', sentAt: '2026-10-01T10:00:00.000Z', author: 9, subject: 'Re: antes', body: 'Primera respuesta' }

function fakeReq(over: { user?: unknown; body?: unknown; payload?: Record<string, unknown> } = {}) {
  const payload = {
    findByID: vi.fn().mockResolvedValue({ id: 7, email: 'client@example.com', locale: 'es', status: 'new', replies: [previous] }),
    update: vi.fn().mockResolvedValue({}),
    sendEmail: vi.fn().mockResolvedValue(undefined),
    logger: { error: vi.fn(), info: vi.fn() },
    ...over.payload,
  }
  const req = {
    user: 'user' in over ? over.user : { id: 3, email: 'erik@coffeeprojects.es', collection: 'users', role: 'editor' },
    routeParams: { id: '7' },
    json: async () => ('body' in over ? over.body : { subject: 'Re: tu solicitud', message: 'Hola, gracias por escribirnos.' }),
    payload,
  }
  return { req: req as unknown as PayloadRequest, payload }
}

async function call(r: PayloadRequest) {
  const res = await contactReplyEndpoint.handler(r)
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

describe('POST /api/contacts/:id/reply (S19)', () => {
  beforeEach(() => vi.stubEnv('RESEND_API_KEY', 're_test'))
  afterEach(() => vi.unstubAllEnvs())

  it('is mounted on the contacts collection as POST /:id/reply', () => {
    expect(contactReplyEndpoint).toMatchObject({ path: '/:id/reply', method: 'post' })
  })

  it('denies anonymous requests without reading or sending anything', async () => {
    const { req, payload } = fakeReq({ user: null })
    expect(await call(req)).toEqual({ status: 401, body: { error: 'unauthorized' } })
    expect(payload.findByID).not.toHaveBeenCalled()
    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('rejects an empty message or subject', async () => {
    for (const body of [{ subject: 'Re: x', message: '   ' }, { subject: '', message: 'Hola' }, null, { subject: 'x'.repeat(201), message: 'Hola' }]) {
      const { req, payload } = fakeReq({ body })
      expect(await call(req), JSON.stringify(body)).toEqual({ status: 400, body: { error: 'invalid' } })
      expect(payload.sendEmail).not.toHaveBeenCalled()
    }
  })

  it('returns an error and changes nothing when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 503, body: { error: 'emailNotConfigured' } })
    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the request does not exist (or is not readable)', async () => {
    const { req, payload } = fakeReq({ payload: { findByID: vi.fn().mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 })) } })
    expect(await call(req)).toEqual({ status: 404, body: { error: 'notFound' } })
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('keeps the status and stores nothing when sending fails, logging no personal data', async () => {
    const failure = Object.assign(new Error('Resend rejected client@example.com'), { name: 'ResendError', statusCode: 422 })
    const { req, payload } = fakeReq({ payload: { sendEmail: vi.fn().mockRejectedValue(failure) } })
    expect(await call(req)).toEqual({ status: 502, body: { error: 'sendFailed' } })
    expect(payload.update).not.toHaveBeenCalled()
    expect(JSON.stringify(payload.logger.error.mock.calls)).not.toContain('client@example.com')
    expect(JSON.stringify(payload.logger.error.mock.calls)).toContain('422')
  })

  it('emails the client from the team, appends the reply and marks the request answered', async () => {
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, status: 'answered' } })

    // Read with the user's own access (team only), never with overrideAccess.
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'contacts', id: '7', overrideAccess: false, user: req.user }))
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'client@example.com', replyTo: 'erik@coffeeprojects.es', subject: 'Re: tu solicitud', text: 'Hola, gracias por escribirnos.' }),
    )
    const update = payload.update.mock.calls[0]![0]
    expect(update).toMatchObject({ collection: 'contacts', id: 7, data: { status: 'answered' } })
    expect(update.data.replies).toHaveLength(2)
    expect(update.data.replies[0]).toEqual(previous)
    expect(update.data.replies[1]).toMatchObject({ author: 3, subject: 'Re: tu solicitud', body: 'Hola, gracias por escribirnos.', channel: 'panel' })
    expect(new Date(update.data.replies[1].sentAt).getTime()).not.toBeNaN()
  })

  it('reports a save failure after the email went out (the client did get it)', async () => {
    const { req } = fakeReq({ payload: { update: vi.fn().mockRejectedValue(new Error('db')) } })
    expect(await call(req)).toEqual({ status: 500, body: { error: 'saveFailed' } })
  })
  it('lets an API-key integration user reply (S11), and refuses users without a contact-managing role', async () => {
    const bot = { id: 30, email: 'bot@coffeeprojects.es', collection: 'users', role: 'integration' }
    const ok = fakeReq({ user: bot })
    expect(await call(ok.req)).toEqual({ status: 200, body: { ok: true, status: 'answered' } })
    expect(ok.payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ overrideAccess: false, user: bot }))

    const nobody = fakeReq({ user: { id: 31, email: 'x@coffeeprojects.es', collection: 'users' } })
    expect(await call(nobody.req)).toEqual({ status: 401, body: { error: 'unauthorized' } })
    expect(nobody.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('logs an audit line (ids and email of the integration user, contact id; no content) when an integration key replies', async () => {
    const { req, payload } = fakeReq({ user: { id: 21, email: 'bot@coffeeprojects.es', collection: 'users', role: 'integration' } })
    expect((await call(req)).status).toBe(200)
    const logged = payload.logger.info.mock.calls.map((call) => call[0] as Record<string, unknown>)
    expect(logged).toEqual([
      { event: 'integration_contact_reply_sent', userId: 21, userEmail: 'bot@coffeeprojects.es', operation: 'reply', contactId: 7, fields: ['replies', 'status'] },
    ])
    expect(JSON.stringify(logged)).not.toContain('gracias por escribirnos')
  })

  it('does not audit-log team replies', async () => {
    const { req, payload } = fakeReq()
    expect((await call(req)).status).toBe(200)
    expect(payload.logger.info).not.toHaveBeenCalled()
  })
})
