import { describe, expect, it, vi } from 'vitest'
import { handleContact } from '@/features/contact/handle-contact'
import { clientIp, hashIp } from '@/features/contact/ip'

const base = {
  name: 'Ana',
  email: 'ana@example.com',
  projectType: 'ecommerce',
  message: 'Quiero una tienda online para vender café de especialidad.',
  privacy: 'on',
  locale: 'es',
  sourcePath: '/contacto',
  turnstileToken: 'tok',
  cp_hp: '',
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
    const r = await handleContact({ ...base, cp_hp: 'http://spam' }, d)
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
  it('shows a form-level error when only non-rendered fields fail validation', async () => {
    const r = await handleContact({ ...base, budget: 'bogus' }, deps())
    expect(r).toEqual({ status: 'error', formError: 'generic' })
  })

  it('adds the form-level error next to field errors when a hidden field also fails', async () => {
    const r = await handleContact({ ...base, email: 'bad', timeline: 'bogus' }, deps())
    expect(r).toEqual({ status: 'error', fieldErrors: { email: 'invalidEmail' }, formError: 'generic' })
  })

  it('strips unknown raw fields before saving (no mass assignment)', async () => {
    const d = deps()
    await handleContact({ ...base, status: 'archived', ipHash: 'evil', internalNotes: 'x', assignedTo: 1, turnstileToken: 'tok' }, d)
    const saved = (d.createContact as ReturnType<typeof vi.fn>).mock.calls[0]![0] as Record<string, unknown>
    expect(saved).not.toHaveProperty('status')
    expect(saved).not.toHaveProperty('internalNotes')
    expect(saved).not.toHaveProperty('assignedTo')
    expect(saved).not.toHaveProperty('turnstileToken')
    expect(saved.ipHash).toBe('hash')
  })
})

describe('hashIp', () => {
  it('is a deterministic 64-hex HMAC that depends on both salt and ip', () => {
    const h = hashIp('1.2.3.4', 'salt')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(hashIp('1.2.3.4', 'salt')).toBe(h)
    expect(hashIp('1.2.3.5', 'salt')).not.toBe(h)
    expect(hashIp('1.2.3.4', 'other')).not.toBe(h)
    expect(h).not.toContain('1.2.3.4')
  })
})

describe('clientIp', () => {
  const headers = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null })
  it('prefers x-real-ip, then the first x-forwarded-for hop', () => {
    expect(clientIp(headers({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('9.9.9.9')
    expect(clientIp(headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1')
  })
  it('returns null when no header is present', () => {
    expect(clientIp(headers({}))).toBeNull()
  })
})
