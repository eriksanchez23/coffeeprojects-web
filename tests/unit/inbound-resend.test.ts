import { createHmac } from 'node:crypto'
import type { PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inboundResendEndpoint } from '@/endpoints/inbound-resend'
import { relayAddress, relayKey } from '@/features/contact/inbound'

const DOMAIN = 'inbound.coffeeprojects.es'
const SECRET_KEY = Buffer.from('coffeeprojects-svix-test-key-32b')
const WEBHOOK_SECRET = `whsec_${SECRET_KEY.toString('base64')}`
const PAYLOAD_SECRET = 'payload-secret-for-tests'
const relay = (id: number) => relayAddress(id, DOMAIN, relayKey(PAYLOAD_SECRET))

const previous = { id: 'r1', sentAt: '2026-10-01T10:00:00.000Z', author: 9, subject: 'Re: antes', body: 'Primera respuesta', channel: 'panel', inboundId: null }

function event(over: Record<string, unknown> = {}) {
  return {
    type: 'email.received',
    created_at: '2026-10-09T10:00:00.000Z',
    data: {
      email_id: 'em_123',
      from: 'erik@coffeeprojects.es',
      to: [relay(7)],
      cc: [],
      subject: 'Re: Nueva solicitud (Landing) — Juan',
      ...over,
    },
  }
}

function sign(body: string, { id = 'msg_1', timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const sig = createHmac('sha256', SECRET_KEY).update(`${id}.${timestamp}.${body}`).digest('base64')
  return { 'svix-id': id, 'svix-timestamp': String(timestamp), 'svix-signature': `v1,${sig}` }
}

const received = {
  id: 'em_123',
  from: 'erik@coffeeprojects.es',
  subject: 'Re: Nueva solicitud (Landing) — Juan',
  text: 'Hola Juan,\nTe paso la propuesta.\n\nOn Thu, Oct 9, 2026 at 10:00 AM CoffeeProjects <hola@coffeeprojects.es> wrote:\n> Nueva solicitud',
  html: null,
  authentication: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
}

function fakeReq(opts: { body?: string; headers?: Record<string, string>; payload?: Record<string, unknown> } = {}) {
  const body = opts.body ?? JSON.stringify(event())
  const headers = new Headers(opts.headers ?? sign(body))
  const payload = {
    // Like Payload, only the selected fields come back: `role` is present only when the query selects it.
    find: vi.fn(async (args: { select?: Record<string, boolean> }) => {
      const users = [
        { id: 3, email: 'Erik@coffeeprojects.es', role: 'admin' },
        { id: 4, email: 'ana@coffeeprojects.es', role: 'editor' },
        { id: 5, email: 'bot@coffeeprojects.es', role: 'integration' },
      ]
      const keep = Object.keys(args.select ?? { id: true, email: true, role: true })
      return { docs: users.map((u) => Object.fromEntries(Object.entries(u).filter(([k]) => k === 'id' || keep.includes(k)))) }
    }),
    findByID: vi.fn().mockResolvedValue({ id: 7, email: 'client@example.com', status: 'new', replies: [previous] }),
    update: vi.fn().mockResolvedValue({}),
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    ...opts.payload,
  }
  const req = { headers, text: async () => body, payload }
  return { req: req as unknown as PayloadRequest, payload }
}

type FetchCall = [string, RequestInit]
type Reply = { ok: boolean; body: unknown; status?: number }
function mockFetch({ get = { ok: true, body: received as unknown } as Reply, send = { ok: true, body: { id: 'sent_1' } as unknown } as Reply } = {}) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const r = init?.method === 'POST' ? send : get
    return new Response(JSON.stringify(r.body), { status: r.status ?? (r.ok ? 200 : 500) })
  })
  vi.stubGlobal('fetch', fn)
  return fn as unknown as { mock: { calls: FetchCall[] } } & typeof fn
}

async function call(r: PayloadRequest) {
  const res = await inboundResendEndpoint.handler(r)
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

const allLogs = (p: { logger: { error: { mock: { calls: unknown[] } }; info: { mock: { calls: unknown[] } }; warn: { mock: { calls: unknown[] } } } }) =>
  JSON.stringify([p.logger.error.mock.calls, p.logger.info.mock.calls, p.logger.warn.mock.calls])

describe('POST /api/inbound/resend (S21)', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('RESEND_INBOUND_DOMAIN', DOMAIN)
    vi.stubEnv('RESEND_WEBHOOK_SECRET', WEBHOOK_SECRET)
    vi.stubEnv('PAYLOAD_SECRET', PAYLOAD_SECRET)
    vi.stubEnv('EMAIL_FROM_ADDRESS', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is a root POST endpoint at /inbound/resend', () => {
    expect(inboundResendEndpoint).toMatchObject({ path: '/inbound/resend', method: 'post' })
  })

  it('answers 503 and does nothing when inbound is not configured', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '')
    const fetch = mockFetch()
    const { req, payload } = fakeReq()
    expect((await call(req)).status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('rejects a bad signature with 401', async () => {
    const fetch = mockFetch()
    const body = JSON.stringify(event())
    const { req, payload } = fakeReq({ body, headers: { ...sign(body), 'svix-signature': 'v1,AAAA' } })
    expect(await call(req)).toEqual({ status: 401, body: { error: 'invalidSignature' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('rejects a body changed after signing with 401', async () => {
    mockFetch()
    const headers = sign(JSON.stringify(event()))
    const { req } = fakeReq({ body: JSON.stringify(event({ from: 'attacker@example.com' })), headers })
    expect((await call(req)).status).toBe(401)
  })

  it('rejects a stale timestamp with 401', async () => {
    mockFetch()
    const body = JSON.stringify(event())
    const { req, payload } = fakeReq({ body, headers: sign(body, { timestamp: Math.floor(Date.now() / 1000) - 600 }) })
    expect((await call(req)).status).toBe(401)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('ignores other event types', async () => {
    const fetch = mockFetch()
    const body = JSON.stringify({ ...event(), type: 'email.delivered' })
    const { req, payload } = fakeReq({ body })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'eventType' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('ignores a sender who is not a team user, logging no personal data', async () => {
    const fetch = mockFetch()
    const body = JSON.stringify(event({ from: 'client@example.com' }))
    const { req, payload } = fakeReq({ body })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'sender' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(allLogs(payload)).not.toContain('client@example.com')
  })

  it('ignores an email sent from an integration user address', async () => {
    const fetch = mockFetch()
    const body = JSON.stringify(event({ from: 'bot@coffeeprojects.es' }))
    const { req, payload } = fakeReq({ body })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'sender' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it.each([
    ['unknown address', ['hola@inbound.coffeeprojects.es']],
    ['tampered id', [relay(7).replace('r+7.', 'r+8.')]],
    ['other domain', [relay(7).replace(DOMAIN, 'evil.example')]],
  ])('ignores an %s', async (_label, to) => {
    const fetch = mockFetch()
    const { req, payload } = fakeReq({ body: JSON.stringify(event({ to })) })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'token' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('ignores a token whose request no longer exists', async () => {
    const fetch = mockFetch()
    const { req, payload } = fakeReq({ payload: { findByID: vi.fn().mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 })) } })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'contact' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('ignores a duplicate delivery (same svix-id already stored)', async () => {
    const fetch = mockFetch()
    const stored = { ...previous, id: 'r2', channel: 'email', inboundId: 'msg_1' }
    const { req, payload } = fakeReq({ payload: { findByID: vi.fn().mockResolvedValue({ id: 7, email: 'client@example.com', replies: [previous, stored] }) } })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'duplicate' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('ignores mail whose DMARC check failed (spoofed team address)', async () => {
    const fetch = mockFetch({ get: { ok: true, body: { ...received, authentication: { spf: 'fail', dkim: 'fail', dmarc: 'fail' } } } })
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'unauthenticated' } })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('forwards the new text to the client, stores the reply (channel email) and marks the request answered', async () => {
    const fetch = mockFetch()
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, status: 'answered' } })

    const [getUrl, getInit] = fetch.mock.calls[0]!
    expect(getUrl).toBe('https://api.resend.com/emails/receiving/em_123')
    expect(new Headers(getInit?.headers).get('authorization')).toBe('Bearer re_test')

    const [sendUrl, sendInit] = fetch.mock.calls[1]!
    expect(sendUrl).toBe('https://api.resend.com/emails')
    expect(sendInit.method).toBe('POST')
    // Resend retries the webhook on 5xx: the same delivery never emails the client twice.
    expect(new Headers(sendInit.headers).get('idempotency-key')).toBe('inbound-reply/msg_1')
    const sent = JSON.parse(String(sendInit.body))
    expect(sent).toEqual({
      from: 'CoffeeProjects <hola@coffeeprojects.es>',
      to: ['client@example.com'],
      reply_to: 'Erik@coffeeprojects.es',
      subject: 'Re: Nueva solicitud (Landing) — Juan',
      text: 'Hola Juan,\nTe paso la propuesta.',
      html: expect.stringContaining('Hola Juan,<br>Te paso la propuesta.'),
    })
    expect(sent.html).toContain('max-width:600px')

    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'contacts', id: 7, depth: 0, overrideAccess: true }))
    const update = payload.update.mock.calls[0]![0]
    expect(update).toMatchObject({ collection: 'contacts', id: 7, overrideAccess: true, data: { status: 'answered' } })
    expect(update.data.replies).toHaveLength(2)
    expect(update.data.replies[0]).toEqual(previous)
    expect(update.data.replies[1]).toMatchObject({
      author: 3,
      subject: 'Re: Nueva solicitud (Landing) — Juan',
      body: 'Hola Juan,\nTe paso la propuesta.',
      channel: 'email',
      inboundId: 'msg_1',
    })
    expect(allLogs(payload)).not.toMatch(/client@example\.com|erik@coffeeprojects|Hola Juan/i)
  })

  it('uses the HTML body when there is no text part', async () => {
    const fetch = mockFetch({ get: { ok: true, body: { ...received, text: null, html: '<div>Hola &amp; gracias</div><div class="gmail_quote"><blockquote>old</blockquote></div>' } } })
    const { req } = fakeReq()
    expect((await call(req)).status).toBe(200)
    expect(JSON.parse(String(fetch.mock.calls[1]![1].body)).text).toBe('Hola & gracias')
  })

  it('ignores a reply with nothing new after removing the quoted history', async () => {
    const fetch = mockFetch({ get: { ok: true, body: { ...received, text: '> solo citado' } } })
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'empty' } })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('returns 500 (so Resend retries) and changes nothing when the email cannot be fetched', async () => {
    mockFetch({ get: { ok: false, body: { message: 'boom' } } })
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 500, body: { error: 'fetchFailed' } })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('returns 500 (so Resend retries) and leaves the request unchanged when forwarding fails', async () => {
    mockFetch({ send: { ok: false, body: { message: 'rejected client@example.com' } } })
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 500, body: { error: 'sendFailed' } })
    expect(payload.update).not.toHaveBeenCalled()
    expect(allLogs(payload)).not.toContain('client@example.com')
  })

  it('ignores (200, no retry) a permanent Resend 4xx when fetching the email', async () => {
    mockFetch({ get: { ok: false, status: 404, body: { message: 'not found' } } })
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'permanent' } })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('ignores (200, no retry) a permanent Resend 4xx when forwarding', async () => {
    mockFetch({ send: { ok: false, status: 422, body: { message: 'invalid' } } })
    const { req, payload } = fakeReq()
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'permanent' } })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('still asks for a retry (500) when Resend rate-limits (429)', async () => {
    mockFetch({ send: { ok: false, status: 429, body: {} } })
    const { req } = fakeReq()
    expect(await call(req)).toEqual({ status: 500, body: { error: 'sendFailed' } })
  })

  it('ignores an event without an email_id instead of retrying', async () => {
    const fetch = mockFetch()
    const ev = event() as { data: Record<string, unknown> }
    const body = JSON.stringify({ ...ev, data: { ...ev.data, email_id: '' } })
    const { req, payload } = fakeReq({ body })
    expect(await call(req)).toEqual({ status: 200, body: { ok: true, ignored: 'permanent' } })
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('returns 500 when saving fails after forwarding (the retry reuses the idempotency key)', async () => {
    mockFetch()
    const { req } = fakeReq({ payload: { update: vi.fn().mockRejectedValue(new Error('db')) } })
    expect(await call(req)).toEqual({ status: 500, body: { error: 'saveFailed' } })
  })
})
