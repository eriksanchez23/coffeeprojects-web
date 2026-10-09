import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { sendClientConfirmation } from '@/features/contact/thank-you-send'

const saved = {
  id: 12,
  name: 'Anna Smith',
  email: 'client@example.com',
  locale: 'en',
  projectType: 'web',
  plan: null,
  quotedSummary: 'Project type: from 422.29 € · Estimated time: 1-2 weeks (VAT (21%) included)',
  message: 'Hi, we need a landing page.',
  thankYouSent: [],
}

function fakePayload() {
  return {
    findGlobal: vi.fn().mockResolvedValue({ packages: [] }),
    update: vi.fn().mockResolvedValue({}),
  }
}

describe('automatic confirmation with the thank-you PDF (S22)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('emails the confirmation in the client language from contact@ with the PDF attached and records an automatic send', async () => {
    vi.stubEnv('THANK_YOU_FROM_ADDRESS', '')
    const fetch = vi.fn(async (_url: string, _init: RequestInit) => new Response('{"id":"em_1"}', { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const payload = fakePayload()

    await sendClientConfirmation(payload as unknown as Payload, saved as never, 're_test')

    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe('https://api.resend.com/emails')
    expect(new Headers(init.headers).get('idempotency-key')).toBe('thank-you/12/auto')
    const body = JSON.parse(String(init.body))
    expect(body.from).toBe('CoffeeProjects <contact@coffeeprojects.es>')
    expect(body.to).toEqual(['client@example.com'])
    expect(body.reply_to).toBe('contact@coffeeprojects.es')
    expect(body.subject).toMatch(/request/i) // English confirmation copy, not Spanish
    expect(body.attachments).toHaveLength(1)
    expect(body.attachments[0].filename).toMatch(/\.pdf$/)
    expect(Buffer.from(body.attachments[0].content, 'base64').subarray(0, 4).toString()).toBe('%PDF')
    const data = payload.update.mock.calls[0]![0].data as { thankYouSent: { author: unknown }[] }
    expect(data.thankYouSent).toHaveLength(1)
    expect(data.thankYouSent[0]!.author).toBeNull()
  })
})
