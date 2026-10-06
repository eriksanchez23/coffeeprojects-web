import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { buildLeadEvent, CAPI_NOOP_MESSAGE, fbcFrom, sendCapiEvent, sha256Normalized } from '@/features/tracking/capi'

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

const event = buildLeadEvent({
  eventId: 'evt-1',
  email: 'ana@example.com',
  ip: '1.2.3.4',
  userAgent: 'UA',
  sourceUrl: 'https://coffeeprojects.es/contacto',
  projectType: 'web',
  nowSeconds: 1_700_000_000,
})

describe('capi', () => {
  it('normalizes emails before hashing', () => {
    expect(sha256Normalized('  Ana@Example.COM ', 'email')).toBe(sha('ana@example.com'))
  })
  it('keeps only digits for phones', () => {
    expect(sha256Normalized('+34 600-123-456', 'phone')).toBe(sha('34600123456'))
  })
  it('handles 00 prefixes and defaults bare Spanish mobiles to +34', () => {
    expect(sha256Normalized('0034 600 123 456', 'phone')).toBe(sha('34600123456'))
    expect(sha256Normalized('600 123 456', 'phone')).toBe(sha('34600123456'))
    expect(sha256Normalized('+44 20 7946 0958', 'phone')).toBe(sha('442079460958'))
  })
  it('builds fbc from fbclid when the cookie is missing', () => {
    expect(fbcFrom(undefined, { fbclid: 'ABC', fbclidTs: 1700 })).toBe('fb.1.1700.ABC')
    expect(fbcFrom('fb.1.1.ZZZ', { fbclid: 'ABC', fbclidTs: 1 })).toBe('fb.1.1.ZZZ')
    expect(fbcFrom(undefined, null)).toBeUndefined()
  })
  it('builds a deduplicable Lead event without raw PII', () => {
    const e = buildLeadEvent({
      eventId: 'evt-1',
      email: 'ana@example.com',
      phone: undefined,
      ip: '1.2.3.4',
      userAgent: 'UA',
      fbp: 'fb.1.1.123',
      fbc: undefined,
      sourceUrl: 'https://coffeeprojects.es/contacto',
      projectType: 'web',
      nowSeconds: 1_700_000_000,
    })
    expect(e).toMatchObject({
      event_name: 'Lead',
      event_id: 'evt-1',
      event_time: 1_700_000_000,
      action_source: 'website',
      event_source_url: 'https://coffeeprojects.es/contacto',
      user_data: { em: [sha('ana@example.com')], client_ip_address: '1.2.3.4', client_user_agent: 'UA', fbp: 'fb.1.1.123' },
      custom_data: { content_category: 'web' },
    })
    expect(JSON.stringify(e)).not.toContain('ana@example.com')
    expect(e.user_data).not.toHaveProperty('ph')
  })
})

describe('sendCapiEvent', () => {
  it('is a logged no-op without credentials and never touches the network', async () => {
    const fetch = vi.fn()
    const log = vi.fn()
    await sendCapiEvent(event, {}, { fetch, log })
    expect(fetch).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith(CAPI_NOOP_MESSAGE)
    await sendCapiEvent(event, { pixelId: '123' }, { fetch, log })
    expect(fetch).not.toHaveBeenCalled()
  })
  it('posts the event to the Graph API keeping the token and PII out of the URL', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    await sendCapiEvent(event, { pixelId: '123', token: 'tok', graphVersion: 'v99.0', testEventCode: 'TEST1' }, { fetch, log: vi.fn() })
    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe('https://graph.facebook.com/v99.0/123/events')
    expect(JSON.parse(init.body)).toEqual({ data: [event], access_token: 'tok', test_event_code: 'TEST1' })
  })
  it('throws an error that carries only the status, not the response body', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'secret echo ana@example.com' })
    const err = await sendCapiEvent(event, { pixelId: '1', token: 't' }, { fetch, log: vi.fn() }).catch((e) => e)
    expect(err).toMatchObject({ name: 'CapiError', status: 400 })
    expect(String(err.message)).not.toContain('ana@example.com')
  })
})
