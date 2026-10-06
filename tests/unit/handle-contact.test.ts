import { describe, expect, it, vi } from 'vitest'
import { handleContact } from '@/features/contact/handle-contact'

const base = {
  name: 'Ana',
  email: 'ana@example.com',
  projectType: 'ecommerce',
  message: 'Quiero una tienda online para vender café de especialidad.',
  privacy: 'on',
  locale: 'es',
  sourcePath: '/contacto',
  turnstileToken: 'tok',
  website: '',
}

function deps(over: Partial<Parameters<typeof handleContact>[1]> = {}) {
  return {
    verifyCaptcha: vi.fn().mockResolvedValue(true),
    isRateLimited: vi.fn().mockResolvedValue(false),
    createContact: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn().mockResolvedValue(undefined),
    afterSave: vi.fn().mockResolvedValue(undefined),
    newEventId: () => 'evt-1',
    ipHash: 'hash',
    log: vi.fn(),
    ...over,
  }
}

describe('handleContact', () => {
  it('silently accepts but does not save when the honeypot is filled', async () => {
    const d = deps()
    const r = await handleContact({ ...base, website: 'http://spam' }, d)
    expect(r).toEqual({ status: 'ok', saved: false, eventId: 'evt-1' })
    expect(d.createContact).not.toHaveBeenCalled()
  })

  it('returns field errors for invalid input', async () => {
    const r = await handleContact({ ...base, email: 'bad' }, deps())
    expect(r).toMatchObject({ status: 'error', fieldErrors: { email: 'invalidEmail' } })
  })

  it('rejects a failed captcha', async () => {
    const r = await handleContact(base, deps({ verifyCaptcha: vi.fn().mockResolvedValue(false) }))
    expect(r).toEqual({ status: 'error', formError: 'captcha' })
  })

  it('blocks the 6th request in an hour from the same IP', async () => {
    const d = deps({ isRateLimited: vi.fn().mockResolvedValue(true) })
    const r = await handleContact(base, d)
    expect(r).toEqual({ status: 'error', formError: 'rateLimited' })
    expect(d.createContact).not.toHaveBeenCalled()
  })

  it('saves, notifies and runs afterSave on success', async () => {
    const d = deps()
    const r = await handleContact(base, d)
    expect(r).toEqual({ status: 'ok', saved: true, eventId: 'evt-1' })
    expect(d.createContact).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com', projectType: 'ecommerce', privacy: true, ipHash: 'hash' }))
    expect(d.notify).toHaveBeenCalledOnce()
    expect(d.afterSave).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com' }), 'evt-1')
  })

  it('still succeeds when notification email fails', async () => {
    const d = deps({ notify: vi.fn().mockRejectedValue(new Error('resend down')) })
    const r = await handleContact(base, d)
    expect(r).toMatchObject({ status: 'ok', saved: true })
    expect(d.log).toHaveBeenCalled()
  })

  it('returns a generic error when saving fails', async () => {
    const r = await handleContact(base, deps({ createContact: vi.fn().mockRejectedValue(new Error('db')) }))
    expect(r).toEqual({ status: 'error', formError: 'generic' })
  })
})
