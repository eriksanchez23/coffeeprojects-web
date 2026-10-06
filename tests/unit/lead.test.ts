import { describe, expect, it, vi } from 'vitest'
import { shouldFireLead } from '@/components/tracking/lead-proof'
import { afterSaveLead } from '@/features/tracking/lead'

const input = { email: 'a@b.co', phone: undefined, projectType: 'web', marketingConsent: false } as never
const ctx = { ip: '1.1.1.1', userAgent: 'UA', fbp: undefined, fbcCookie: undefined, attribution: null, sourceUrl: 'https://x/contacto', nowSeconds: 1 }

describe('afterSaveLead', () => {
  it('sends nothing to Meta when marketing consent was rejected', async () => {
    const send = vi.fn()
    expect(await afterSaveLead(input, 'evt', ctx, send)).toBe('skipped')
    expect(send).not.toHaveBeenCalled()
  })
  it('sends a Lead when marketing consent was granted', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    expect(await afterSaveLead({ ...(input as object), marketingConsent: true } as never, 'evt', ctx, send)).toBe('sent')
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ event_name: 'Lead', event_id: 'evt' }))
  })
})

describe('shouldFireLead (proof of submission on the thank-you page)', () => {
  const id = '7b1d6f4e-0a52-4a3c-9a54-2f0c6a3f5e11'
  it('fires only when the cookie equals ?e= and marketing consent is granted', () => {
    expect(shouldFireLead({ eventId: id, cookieValue: id, marketing: true })).toBe(true)
  })
  it('does not fire on a direct visit or honeypot landing (no cookie)', () => {
    expect(shouldFireLead({ eventId: id, cookieValue: undefined, marketing: true })).toBe(false)
  })
  it('does not fire when the cookie belongs to another submission', () => {
    expect(shouldFireLead({ eventId: id, cookieValue: 'other-event-id-1234', marketing: true })).toBe(false)
  })
  it('does not fire without marketing consent', () => {
    expect(shouldFireLead({ eventId: id, cookieValue: id, marketing: false })).toBe(false)
  })
  it('does not fire without an event id or with a malformed one', () => {
    expect(shouldFireLead({ eventId: undefined, cookieValue: id, marketing: true })).toBe(false)
    expect(shouldFireLead({ eventId: 'x', cookieValue: 'x', marketing: true })).toBe(false)
    expect(shouldFireLead({ eventId: '<script>alert(1)</script>', cookieValue: '<script>alert(1)</script>', marketing: true })).toBe(false)
  })
})
