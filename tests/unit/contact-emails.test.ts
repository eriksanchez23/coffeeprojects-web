import { describe, expect, it } from 'vitest'
import { clientEmail, teamEmail } from '@/features/contact/emails'

const input = {
  name: '<script>alert(1)</script>',
  email: 'ana@example.com',
  projectType: 'web' as const,
  message: 'Hola & <b>adiós</b>',
  privacy: true,
  marketingConsent: false,
  nda: true,
  locale: 'fr' as const,
  sourcePath: '/fr/contact',
}

describe('emails', () => {
  it('escapes user content in the team email', () => {
    const { html, subject } = teamEmail(input)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp; &lt;b&gt;')
    expect(subject).toContain('web')
    expect(html).toContain('NDA')
  })
  it('writes the client auto-reply in the client locale', () => {
    expect(clientEmail(input).subject).toMatch(/demande/i)
    expect(clientEmail({ ...input, locale: 'en' }).subject).toMatch(/request/i)
    expect(clientEmail({ ...input, locale: 'es' }).subject).toMatch(/solicitud/i)
  })
})
