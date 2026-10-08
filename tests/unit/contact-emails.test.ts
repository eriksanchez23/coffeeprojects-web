import { describe, expect, it } from 'vitest'
import { clientEmail, replyEmail, replySubject, teamEmail, teamRecipients } from '@/features/contact/emails'

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

const record = {
  id: 42,
  status: 'new' as const,
  name: '<script>alert(1)</script>',
  email: 'ana@example.com',
  phone: '+34 600 000 000',
  projectType: 'ecommerce' as const,
  plan: 'tienda-online',
  quotedSummary: 'Plan elegido: Tienda Online · Con mantenimiento: 1.802,90 € (IVA (21 %) incluido)',
  message: 'Hola & <b>adiós</b>',
  howFound: 'Instagram',
  ndaRequested: true,
  privacyAccepted: true,
  marketingConsent: false,
  locale: 'fr' as const,
  sourcePath: '/fr/contact',
  utmSource: 'meta',
  utmMedium: 'paid',
  utmCampaign: 'otono',
  utmContent: 'video',
  utmTerm: 'tienda',
  fbclid: 'fb.1.abc',
  createdAt: '2026-10-09T08:30:00.000Z',
  updatedAt: '2026-10-09T08:30:00.000Z',
}

describe('teamEmail (S18)', () => {
  const adminUrl = 'https://coffeeprojects.es/admin/collections/contacts/42'

  it('escapes user content', () => {
    const { html, subject } = teamEmail(record, { adminUrl })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp; &lt;b&gt;')
    expect(subject).toContain('Tienda online')
  })

  it('includes every field of the request and a link to it in the admin', () => {
    const { html, text } = teamEmail(record, { adminUrl })
    for (const value of [
      'ana@example.com',
      '+34 600 000 000',
      'Tienda online',
      'tienda-online',
      '1.802,90 €',
      'Instagram',
      'Francés',
      '/fr/contact',
      'meta',
      'paid',
      'otono',
      'video',
      'tienda',
      'fb.1.abc',
      '#42',
      'viernes, 9 de octubre de 2026, 10:30',
      adminUrl,
    ]) {
      expect(html, value).toContain(value)
      expect(text, value).toContain(value)
    }
    for (const label of ['NDA', 'Política de privacidad aceptada', 'Consentimiento de marketing', 'Mensaje']) expect(html).toContain(label)
  })

  it('shows a dash for empty optional fields instead of dropping them', () => {
    const { text } = teamEmail({ ...record, phone: null, utmSource: undefined }, { adminUrl })
    expect(text).toMatch(/Teléfono: —/)
    expect(text).toMatch(/Origen UTM: —/)
  })
})

describe('teamRecipients (S18)', () => {
  it('sends to every team user plus CONTACT_NOTIFY_EMAIL, deduplicated case-insensitively', () => {
    expect(teamRecipients([{ email: 'erik@x.es' }, { email: 'Ana@x.es' }, { email: 'ana@x.es' }], 'contact@x.es')).toEqual([
      'erik@x.es',
      'ana@x.es',
      'contact@x.es',
    ])
    expect(teamRecipients([{ email: 'erik@x.es' }], 'ERIK@x.es')).toEqual(['erik@x.es'])
    expect(teamRecipients([{ email: 'erik@x.es' }, { email: '' }, { email: null }], undefined)).toEqual(['erik@x.es'])
  })

  it('falls back to the public contact address when there is nobody else', () => {
    expect(teamRecipients([], '')).toEqual(['contact@coffeeprojects.es'])
  })
})

describe('client emails', () => {
  it('writes the client auto-reply in the client locale', () => {
    expect(clientEmail(input).subject).toMatch(/demande/i)
    expect(clientEmail({ ...input, locale: 'en' }).subject).toMatch(/request/i)
    expect(clientEmail({ ...input, locale: 'es' }).subject).toMatch(/solicitud/i)
  })
  it('uses a neutral greeting without echoing the visitor name', () => {
    expect(clientEmail(input).html).not.toContain('script')
  })
  it('prefixes the reply subject with "Re:" on the auto-reply thread, in the client locale', () => {
    expect(replySubject('es')).toBe(`Re: ${clientEmail({ ...input, locale: 'es' }).subject}`)
    expect(replySubject(null)).toMatch(/^Re: .*solicitud/)
  })
  it('sends the team reply as escaped text that keeps line breaks', () => {
    const { html, text } = replyEmail('Hola Ana,\n<b>gracias</b>')
    expect(text).toBe('Hola Ana,\n<b>gracias</b>')
    expect(html).toContain('white-space:pre-wrap')
    expect(html).toContain('&lt;b&gt;gracias&lt;/b&gt;')
  })
})
