import { PDFDocument, StandardFonts } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import {
  buildThankYouPdf,
  pdfSafe,
  type ThankYouData,
  thankYouCopy,
  thankYouDate,
  thankYouLocale,
  wrapText,
} from '@/features/contact/thank-you-pdf'
import { pdfText, pdfTextRuns } from '../helpers/pdf-text'

const date = new Date('2026-10-09T22:30:00Z') // already 10 October in Madrid
const base: ThankYouData = {
  name: 'María José Núñez',
  projectType: 'Tienda online',
  plan: 'Tienda Online',
  quotedSummary: 'Plan elegido: Tienda Online · Con mantenimiento: 2.650,90 € · Plazo estimado: 4–6 semanas (IVA (21 %) incluido)',
  message: 'Queremos vender café en grano.\n\nY cápsulas compostables.',
  reference: 42,
  date,
}

const FOOTER_H = 46

describe('buildThankYouPdf (S22)', () => {
  it('produces a valid one-page A4 PDF that pdf-lib can parse', async () => {
    const bytes = await buildThankYouPdf(base, 'es')
    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-')
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(1)
    const { width, height } = doc.getPage(0).getSize()
    expect([Math.round(width), Math.round(height)]).toEqual([595, 842])
    expect(doc.getTitle()).toBe('Gracias por confiar en CoffeeProjects')
    expect(doc.getAuthor()).toBe('CoffeeProjects')
  })

  it.each([
    ['es', 'Gracias por confiar en CoffeeProjects', 'Hola, María José Núñez:', 'Próximos pasos', 'Fecha: 10 de octubre de 2026'],
    ['en', 'Thank you for trusting CoffeeProjects', 'Hi María José Núñez,', 'Next steps', 'Date: 10 October 2026'],
    ['fr', 'Merci de faire confiance à CoffeeProjects', 'Bonjour María José Núñez,', 'Prochaines étapes', 'Date : 10 octobre 2026'],
  ] as const)('prints the %s copy, the client data and our contact details', async (locale, title, greeting, steps, dateLine) => {
    const text = await pdfText(await buildThankYouPdf(base, locale))
    for (const expected of [title, greeting, steps, dateLine, 'Tienda online', 'Tienda Online', 'Con mantenimiento: 2.650,90 €', 'contact@coffeeprojects.es', 'https://coffeeprojects.es']) {
      expect(text, expected).toContain(expected)
    }
    for (const step of thankYouCopy[locale].steps) expect(text).toContain(step.split(' ').slice(0, 4).join(' '))
    // The stored summary is split on its separators, one part per line; message paragraphs are kept.
    expect(text).toContain('Plazo estimado: 4–6 semanas (IVA (21 %) incluido)')
    expect(text).toContain('Queremos vender café en grano.\nY cápsulas compostables.')
    expect(text).toContain('#42')
  })

  it('omits the plan, price and message rows when the request has none', async () => {
    const text = await pdfText(await buildThankYouPdf({ name: 'Ana', projectType: 'Web', date }, 'es'))
    expect(text).toContain('Tipo de proyecto')
    expect(text).not.toContain('Plan')
    expect(text).not.toContain('Precio y plazo')
    expect(text).not.toContain('Tu mensaje')
  })

  it('keeps long or exotic input inside one page without throwing', async () => {
    const bytes = await buildThankYouPdf(
      {
        name: `Łukasz 名前 😀​ ${'Bartholomew'.repeat(30)}`,
        projectType: 'A medida',
        plan: 'Web Profesional '.repeat(20),
        quotedSummary: Array.from({ length: 12 }, (_, i) => `Parte ${i}: ${'x'.repeat(90)}`).join(' · '),
        message: `${'palabra '.repeat(60)}\n`.repeat(50) + 'Supercalifragilístico'.repeat(40),
        reference: 123456,
        date,
      },
      'fr',
    )
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(1)
    const runs = await pdfTextRuns(bytes)
    const footer = new Set([thankYouCopy.fr.footer, 'coffeeprojects.es'])
    for (const run of runs) {
      expect(run.x, run.text).toBeGreaterThanOrEqual(0)
      if (!footer.has(run.text)) expect(run.y, run.text).toBeGreaterThan(FOOTER_H)
    }
    const text = runs.map((r) => r.text).join('\n')
    expect(text).toContain('Lukasz ?? ?') // folded to the font's character set
    expect(text).toContain('…') // excerpt cut
  })
})

describe('thank-you PDF text helpers', () => {
  it('maps any locale to es/en/fr', () => {
    expect([thankYouLocale('en'), thankYouLocale('fr'), thankYouLocale('de'), thankYouLocale(null)]).toEqual(['en', 'fr', 'es', 'es'])
  })

  it('formats the date in Madrid time', () => {
    expect(thankYouDate(date, 'es')).toBe('10 de octubre de 2026')
  })

  it('folds characters the standard font cannot encode and keeps every es/en/fr copy character', async () => {
    const font = await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica)
    expect(pdfSafe('Łukasz Ż 名 😀\tx\u0007', font)).toBe('Lukasz Z ? ? x')
    for (const copy of Object.values(thankYouCopy)) {
      const all = Object.values(copy).flat().filter((v): v is string => typeof v === 'string').join(' ')
      expect(pdfSafe(all, font)).toBe(all)
    }
    expect(() => font.encodeText(pdfSafe('€ ñ ç œ … — « » ¿ ¡', font))).not.toThrow()
  })

  it('wraps to the width and breaks words longer than a line', async () => {
    const font = await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica)
    const lines = wrapText(`uno dos tres ${'x'.repeat(200)}`, font, 10, 100)
    expect(lines.length).toBeGreaterThan(3)
    for (const line of lines) expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(100)
    expect(lines.join(' ').replace(/ /g, '')).toBe(`unodostres${'x'.repeat(200)}`)
  })
})
