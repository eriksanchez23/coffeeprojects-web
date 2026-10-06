import { describe, expect, it } from 'vitest'
import { contactSchema } from '@/features/contact/schema'

const valid = {
  name: 'Ana',
  email: 'ana@example.com',
  projectType: 'web',
  message: 'Necesito una web para mi negocio de cafetería.',
  privacy: true,
  marketingConsent: false,
  nda: false,
  locale: 'es',
  sourcePath: '/contacto',
}

describe('contactSchema', () => {
  it('accepts a minimal valid submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })
  it('returns message keys, not text', () => {
    const r = contactSchema.safeParse({ ...valid, email: 'nope', message: 'short' })
    expect(r.success).toBe(false)
    const issues = Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path[0], i.message]))
    expect(issues).toMatchObject({ email: 'invalidEmail', message: 'tooShort' })
  })
  it('requires privacy acceptance', () => {
    const r = contactSchema.safeParse({ ...valid, privacy: false })
    expect(r.error?.issues[0]?.message).toBe('privacy')
  })
  it('rejects unknown project types', () => {
    expect(contactSchema.safeParse({ ...valid, projectType: 'hack' }).success).toBe(false)
  })
  it('trims and caps the message at 2000 chars', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).error?.issues[0]?.message).toBe('tooLong')
  })
})
