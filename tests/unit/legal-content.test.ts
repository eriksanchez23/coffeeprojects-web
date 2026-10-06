import { describe, expect, it } from 'vitest'
import { legal } from '@/seed/data/legal'
import { locales } from '@/i18n/locales'

// Plain text of a seeded Lexical document (headings + paragraphs).
const text = (doc: unknown) =>
  ((doc as { root: { children: { children: { text: string }[] }[] } }).root.children)
    .flatMap((n) => n.children.map((c) => c.text))
    .join('\n')

const reviewMarker = { es: '[PENDIENTE: revisión]', en: '[PENDING: review]', fr: '[EN ATTENTE : relecture]' } as const
const deletionMarker = { es: '[PENDIENTE: procedimiento de borrado]', en: '[PENDING: deletion procedure]', fr: '[EN ATTENTE : procédure de suppression]' } as const

describe.each(locales)('seeded legal texts (%s)', (locale) => {
  const { legalNotice, privacyPolicy, cookiePolicy } = legal[locale]

  it('open every document with the "review before production" note', () => {
    for (const doc of [legalNotice, privacyPolicy, cookiePolicy]) expect(text(doc).startsWith(reviewMarker[locale])).toBe(true)
  })

  it('privacy policy names every processor and what Meta receives', () => {
    const t = text(privacyPolicy)
    for (const name of ['Vercel', 'Neon', 'Resend', 'Cloudflare', 'Turnstile', 'Meta']) expect(t).toContain(name)
    for (const fact of ['SHA-256', '_fbp/_fbc', 'UTM', 'fbclid', '12']) expect(t).toContain(fact)
    expect(t).toContain(deletionMarker[locale])
  })

  it('cookie policy lists every cookie the site sets, with its duration', () => {
    const t = text(cookiePolicy)
    for (const cookie of ['cp_consent', 'cp_attr', 'cp_lead', '_fbp', '_fbc', 'Turnstile']) expect(t).toContain(cookie)
    expect(t).toMatch(/cp_lead \(10 /)
    expect(t).toMatch(/cp_attr \(30 /)
  })

  it('keeps the company-data markers', () => {
    expect(text(legalNotice)).toMatch(/\[(PENDIENTE|PENDING|EN ATTENTE)/)
  })
})
