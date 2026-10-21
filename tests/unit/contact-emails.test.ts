import { describe, expect, it } from 'vitest'
import { clientEmail, replyEmail, replySubject, teamEmail, teamRecipients, thankYouEmail } from '@/features/contact/emails'

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

describe('teamEmail (S18, S14)', () => {
  const adminUrl = 'https://coffeeprojects.es/admin/collections/contacts/42'

  it('escapes user content', () => {
    const { html, subject } = teamEmail(record, { adminUrl })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp; &lt;b&gt;')
    expect(subject).toContain('Tienda online')
  })

  it('keeps the subject, announces the request and links the admin, the client and the phone', () => {
    const { html, subject } = teamEmail(record, { adminUrl })
    expect(subject).toBe('Nueva solicitud (Tienda online) — <script>alert(1)</script>')
    expect(html).toContain('NUEVA &middot; #42')
    expect(html).toContain('quiere una')
    expect(html).toContain('Abrir en el panel')
    expect(html).toContain(`href="${adminUrl}"`)
    expect(html).toContain('href="mailto:ana@example.com"')
    expect(html).toContain('href="tel:+34600000000"')
    expect(html).toContain('max-width:600px')
    expect(html).toContain('role="presentation"')
    expect(html).toContain('<meta charset="utf-8">')
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
      'viernes, 9 de octubre de 2026 · 10:30',
      adminUrl,
    ]) {
      expect(html, value).toContain(value)
      expect(text, value).toContain(value)
    }
    for (const label of ['NDA', 'Privacidad', 'Mensaje', 'Detalles']) expect(html).toContain(label)
  })

  it('hides empty rows instead of rendering dashes, and says when there is no campaign data', () => {
    const bare = {
      ...record,
      phone: null,
      howFound: undefined,
      plan: undefined,
      quotedSummary: undefined,
      sourcePath: '',
      utmSource: undefined,
      utmMedium: null,
      utmCampaign: undefined,
      utmContent: undefined,
      utmTerm: undefined,
      fbclid: undefined,
    }
    const { html, text } = teamEmail(bare, { adminUrl })
    expect(html).not.toContain('tel:')
    expect(html).not.toContain('Teléfono')
    expect(html).not.toContain('Cómo nos conoció')
    expect(html).not.toContain('—</td>')
    expect(text).not.toContain('—')
    expect(html).toContain('Sin datos de campaña')
    expect(html).not.toContain('Origen UTM')
    expect(text).toContain('Sin datos de campaña')
  })

  it('splits the stored quote into rows', () => {
    const { html } = teamEmail({ ...record, quotedSummary: 'Precio final: 422,29 € · Plazo: 1–2 semanas (IVA (21 %) incluido)' }, { adminUrl })
    expect(html).toContain('Precio final')
    expect(html).toContain('422,29 €')
    expect(html).toContain('Plazo')
    expect(html).toContain('IVA (21 %) incluido')
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

describe('client emails (S14)', () => {
  it('writes the client auto-reply in the client locale', () => {
    expect(clientEmail(input).subject).toMatch(/demande/i)
    expect(clientEmail({ ...input, locale: 'en' }).subject).toMatch(/request/i)
    expect(clientEmail({ ...input, locale: 'es' }).subject).toMatch(/solicitud/i)
  })
  it('greets the visitor by first name and localizes copy, projects and privacy links', () => {
    const fr = clientEmail({ ...input, name: 'Ana Gómez' })
    expect(fr.html).toContain('Bonjour, Ana.')
    expect(fr.html).toContain('Récapitulatif de votre demande')
    expect(fr.html).toContain('href="https://coffeeprojects.es/fr/projets"')
    expect(fr.html).toContain('href="https://coffeeprojects.es/fr/confidentialite"')
    const en = clientEmail({ ...input, name: 'Ana Gómez', locale: 'en' })
    expect(en.html).toContain('Hi, Ana.')
    expect(en.html).toContain('Your request summary')
    expect(en.html).toContain('href="https://coffeeprojects.es/en/projects"')
    const es = clientEmail({ ...input, name: 'Ana Gómez', locale: 'es' })
    expect(es.html).toContain('Hola, Ana.')
    expect(es.html).toContain('Resumen de tu solicitud')
    expect(es.html).toContain('Qué pasa ahora')
    expect(es.html).toContain('Mientras tanto, mira nuestros proyectos')
    expect(es.html).toContain('href="https://coffeeprojects.es/proyectos"')
    expect(es.html).toContain('href="https://coffeeprojects.es/privacidad"')
    expect(es.html).toContain('max-width:600px')
  })
  it('shows only the summary rows that have data', () => {
    const none = clientEmail({ ...input, locale: 'es', quotedSummary: undefined })
    expect(none.html).toContain('Web')
    expect(none.html).not.toContain('Plazo')
    expect(none.html).not.toContain('—</td>')
    const full = clientEmail({
      ...input,
      locale: 'es',
      plan: 'web-plus',
      quotedSummary: 'Plan elegido: Web Plus · Con mantenimiento: 1.681,90 € · Plazo: 3–4 semanas (IVA (21 %) incluido)',
    })
    for (const v of ['Plan elegido', 'Web Plus', '1.681,90 €', 'Plazo', '3–4 semanas', 'IVA (21 %) incluido']) expect(full.html, v).toContain(v)
    expect(full.text).toContain('1.681,90 €')
  })
  it('returns a readable text part in every locale', () => {
    for (const locale of ['es', 'en', 'fr'] as const) {
      const { text, html } = clientEmail({ ...input, locale, name: 'Ana' })
      expect(text).toContain('Ana')
      expect(text).toContain('coffeeprojects.es')
      expect(text).not.toMatch(/<[a-z]/i)
      expect(html.length).toBeLessThan(15000)
    }
  })
  it('prefixes the reply subject with "Re:" on the auto-reply thread, in the client locale', () => {
    expect(replySubject('es')).toBe(`Re: ${clientEmail({ ...input, locale: 'es' }).subject}`)
    expect(replySubject(null)).toMatch(/^Re: .*solicitud/)
  })
  it('sends the team reply as escaped text that keeps line breaks, in the branded shell', () => {
    const { html, text } = replyEmail('Hola Ana,\n<b>gracias</b>')
    expect(text).toBe('Hola Ana,\n<b>gracias</b>')
    expect(html).toContain('Hola Ana,<br>&lt;b&gt;gracias&lt;/b&gt;')
    expect(html).toContain('El equipo de CoffeeProjects')
    expect(html).toContain('max-width:600px')
    expect(replyEmail('Hi', 'en').html).toContain('The CoffeeProjects team')
    expect(replyEmail('Salut', 'fr').html).toContain('href="https://coffeeprojects.es/fr/confidentialite"')
  })
})

describe('escaping of untrusted values (S14)', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    "' onmouseover='alert(1)",
    'javascript:alert(1)',
    '<a href="javascript:alert(1)">x</a>',
  ]
  const assertInert = (html: string) => {
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/<img/i)
    expect(html).not.toMatch(/["']\s*on\w+\s*=/i)
    expect(html).not.toMatch(/href="javascript:/i)
    expect(html).not.toMatch(/href='/i)
  }

  it.each(payloads)('team email escapes %s in every user field', (p) => {
    const evil = {
      ...record,
      name: p,
      email: p,
      phone: p,
      plan: p,
      quotedSummary: p,
      howFound: p,
      sourcePath: p,
      utmSource: p,
      utmMedium: p,
      utmCampaign: p,
      utmContent: p,
      utmTerm: p,
      fbclid: p,
      message: p,
    }
    const { html, subject } = teamEmail(evil, { adminUrl: 'https://coffeeprojects.es/admin/collections/contacts/42' })
    assertInert(html)
    expect(html).not.toContain(`mailto:${p}`)
    expect(html).not.toContain(`tel:${p}`)
    expect(subject).toContain('Nueva solicitud')
  })

  it('does not build href attributes from invalid addresses, phones or admin URLs', () => {
    const { html } = teamEmail({ ...record, email: 'a@b.es?bcc=evil@x.es', phone: 'javascript:alert(1)' }, { adminUrl: 'javascript:alert(1)' })
    expect(html).not.toContain('mailto:a@b.es')
    expect(html).not.toContain('tel:')
    expect(html).not.toMatch(/href="javascript:/i)
    expect(html).not.toContain('Abrir en el panel')
  })

  it.each(payloads)('client email escapes %s', (p) => {
    for (const locale of ['es', 'en', 'fr'] as const) {
      const { html } = clientEmail({ ...input, name: p, message: p, locale, quotedSummary: p, plan: p, howFound: p })
      assertInert(html)
    }
  })

  it.each(payloads)('reply email escapes %s', (p) => {
    assertInert(replyEmail(p).html)
    if (p.includes('<')) expect(replyEmail(p).html).toContain('&lt;')
  })
})

describe('thankYouEmail (S22)', () => {
  it('greets the client in their language and escapes the name in the HTML', () => {
    const mail = thankYouEmail('Ana <b>  Ruiz', 'en', 'Thank you for trusting CoffeeProjects')
    expect(mail.subject).toBe('Thank you for trusting CoffeeProjects')
    expect(mail.text.startsWith('Hi Ana <b> Ruiz,')).toBe(true)
    expect(mail.html).toContain('Hi Ana &lt;b&gt; Ruiz,')
    expect(mail.html).not.toContain('<b>')
    expect(thankYouEmail('Ana', 'de', 'x').text.startsWith('Hola, Ana:')).toBe(true)
  })
})
