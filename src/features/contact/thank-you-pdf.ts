import { LineCapStyle, PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from 'pdf-lib'

/**
 * S22: the branded "thank you" PDF a team user sends to a client from the contact request panel, in the
 * client's language (es/en/fr). One A4 page: dark header band with the cup logo and the wordmark, the thanks,
 * a summary of the request (project type, plan, the stored price/time summary, the message excerpt), next
 * steps and our contact details.
 *
 * Pure: everything it prints comes from `data`, so the endpoint decides what is shared with the client.
 * Uses the PDF standard fonts (WinAnsi: every character of the es/en/fr copy, accents and the euro sign
 * included). Client-typed text with characters outside that set is folded to its base letter or `?`, so the
 * document always renders instead of throwing.
 */

export type ThankYouLocale = 'es' | 'en' | 'fr'

export type ThankYouData = {
  /** Client name as stored on the request. */
  name: string
  /** Client-facing label of the project type (as shown on the contact form). */
  projectType: string
  /** Pricing plan name, when the request came from a plan. */
  plan?: string | null
  /** The stored `quotedSummary`: final price with VAT and estimated time, in the client's language. */
  quotedSummary?: string | null
  /** The client's message; only an excerpt is printed. */
  message?: string | null
  /** Request number shown next to the date. */
  reference?: string | number | null
  /** Document date (defaults to now), printed in Europe/Madrid time. */
  date?: Date
}

export const CONTACT_EMAIL = 'contact@coffeeprojects.es'
export const SITE_URL = 'https://coffeeprojects.es'

type Copy = {
  docTitle: string
  tagline: string
  title: string
  greeting: (name: string) => string
  intro: string
  date: string
  /** Label separator (French typography puts a space before the colon). */
  colon: string
  reference: string
  summaryTitle: string
  projectType: string
  plan: string
  quote: string
  message: string
  stepsTitle: string
  steps: readonly string[]
  contactTitle: string
  contactLead: string
  signature: string
  footer: string
  dateLocale: string
  fileName: string
}

export const thankYouCopy: Record<ThankYouLocale, Copy> = {
  es: {
    docTitle: 'Gracias por confiar en CoffeeProjects',
    tagline: 'Webs, tiendas online y desarrollo a medida',
    title: 'Gracias por confiar en CoffeeProjects',
    greeting: (name) => `Hola, ${name}:`,
    intro:
      'Hemos recibido tu solicitud y queremos darte las gracias por pensar en nosotros para tu proyecto. En este documento tienes un resumen de lo que nos has contado y los próximos pasos.',
    date: 'Fecha',
    colon: ':',
    reference: 'Solicitud',
    summaryTitle: 'Resumen de tu solicitud',
    projectType: 'Tipo de proyecto',
    plan: 'Plan',
    quote: 'Precio y plazo',
    message: 'Tu mensaje',
    stepsTitle: 'Próximos pasos',
    steps: [
      'Revisamos tu solicitud con detalle y elegimos al especialista más adecuado.',
      'En menos de 24 horas te escribimos con una propuesta.',
      'Si hace falta, agendamos una reunión para concretar los detalles.',
      'Con tu visto bueno, empezamos a trabajar en tu proyecto.',
    ],
    contactTitle: 'Contacto',
    contactLead: '¿Tienes alguna duda? Escríbenos cuando quieras:',
    signature: 'El equipo de CoffeeProjects',
    footer: 'Documento informativo: el importe definitivo se confirmará en nuestra propuesta.',
    dateLocale: 'es-ES',
    fileName: 'CoffeeProjects-agradecimiento.pdf',
  },
  en: {
    docTitle: 'Thank you for trusting CoffeeProjects',
    tagline: 'Websites, online stores and custom development',
    title: 'Thank you for trusting CoffeeProjects',
    greeting: (name) => `Hi ${name},`,
    intro:
      'We have received your request and want to thank you for thinking of us for your project. This document sums up what you told us and the next steps.',
    date: 'Date',
    colon: ':',
    reference: 'Request',
    summaryTitle: 'Your request at a glance',
    projectType: 'Project type',
    plan: 'Plan',
    quote: 'Price and time',
    message: 'Your message',
    stepsTitle: 'Next steps',
    steps: [
      'We review your request in detail and pick the best specialist for it.',
      'Within 24 hours we write back to you with a proposal.',
      'If needed, we schedule a meeting to settle the details.',
      'Once you give us the go-ahead, we start working on your project.',
    ],
    contactTitle: 'Contact',
    contactLead: 'Any questions? Write to us anytime:',
    signature: 'The CoffeeProjects team',
    footer: 'For information only: the final amount will be confirmed in our proposal.',
    dateLocale: 'en-GB',
    fileName: 'CoffeeProjects-thank-you.pdf',
  },
  fr: {
    docTitle: 'Merci de faire confiance à CoffeeProjects',
    tagline: 'Sites web, boutiques en ligne et développement sur mesure',
    title: 'Merci de faire confiance à CoffeeProjects',
    greeting: (name) => `Bonjour ${name},`,
    intro:
      "Nous avons bien reçu votre demande et nous vous remercions d'avoir pensé à nous pour votre projet. Ce document résume ce que vous nous avez confié et les prochaines étapes.",
    date: 'Date',
    colon: ' :',
    reference: 'Demande',
    summaryTitle: 'Résumé de votre demande',
    projectType: 'Type de projet',
    plan: 'Formule',
    quote: 'Prix et délai',
    message: 'Votre message',
    stepsTitle: 'Prochaines étapes',
    steps: [
      'Nous étudions votre demande en détail et choisissons le spécialiste le plus adapté.',
      'En moins de 24 heures, nous vous écrivons avec une proposition.',
      'Si besoin, nous planifions une réunion pour préciser les détails.',
      'Avec votre accord, nous commençons à travailler sur votre projet.',
    ],
    contactTitle: 'Contact',
    contactLead: 'Une question ? Écrivez-nous quand vous voulez :',
    signature: "L'équipe CoffeeProjects",
    footer: 'Document informatif : le montant définitif sera confirmé dans notre proposition.',
    dateLocale: 'fr-FR',
    fileName: 'CoffeeProjects-remerciements.pdf',
  },
}

export const thankYouLocale = (l: string | null | undefined): ThankYouLocale => (l === 'en' || l === 'fr' ? l : 'es')

/** Date as the client reads it, in Spanish time. */
export function thankYouDate(date: Date, locale: ThankYouLocale): string {
  return new Intl.DateTimeFormat(thankYouCopy[locale].dateLocale, { dateStyle: 'long', timeZone: 'Europe/Madrid' }).format(date)
}

// Limits keep the page to one sheet whatever the client typed.
const MAX_NAME = 80
const MAX_MESSAGE_CHARS = 700
const MAX_MESSAGE_LINES = 7
const MIN_MESSAGE_LINES = 2
const MAX_SUMMARY_LINES = 5
const ELLIPSIS = '…'

const SPACES = /[  -​  　\t]/g
// Control and format characters, except the line feeds that separate paragraphs.
const INVISIBLE = /(?!\n)[\p{Cc}\p{Cf}]/gu

// Latin letters with a stroke have no decomposition: fold them by hand.
const FOLD: Record<string, string> = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ħ: 'H', ħ: 'h', Ŧ: 'T', ŧ: 't', ı: 'i' }

/** Text the font can encode (line feeds kept): odd spaces become spaces, other unsupported characters their base letter or `?`. */
export function pdfSafe(text: string, font: PDFFont): string {
  const supported = new Set(font.getCharacterSet())
  let out = ''
  for (const ch of text.normalize('NFC').replace(SPACES, ' ').replace(INVISIBLE, '')) {
    const cp = ch.codePointAt(0)!
    if (ch === '\n' || supported.has(cp)) {
      out += ch
      continue
    }
    const base = FOLD[ch] ?? ch.normalize('NFD').replace(/\p{M}/gu, '')
    out += base && [...base].every((b) => supported.has(b.codePointAt(0)!)) ? base : '?'
  }
  return out
}

/** Greedy word wrap; words wider than the line are broken. Never returns an empty array. */
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const width = (s: string) => font.widthOfTextAtSize(s, size)
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(' ').filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (width(candidate) <= maxWidth) {
        line = candidate
        continue
      }
      if (line) lines.push(line)
      line = ''
      let rest = word
      while (width(rest) > maxWidth) {
        let cut = rest.length - 1
        while (cut > 1 && width(rest.slice(0, cut)) > maxWidth) cut--
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    lines.push(line)
  }
  return lines.length ? lines : ['']
}

/** At most `max` lines; a cut text ends with an ellipsis that still fits the width. */
function clampLines(lines: string[], max: number, font: PDFFont, size: number, maxWidth: number): string[] {
  if (lines.length <= max) return lines
  const kept = lines.slice(0, max)
  let last = kept[max - 1]!.trimEnd()
  while (last && font.widthOfTextAtSize(`${last}${ELLIPSIS}`, size) > maxWidth) last = last.slice(0, -1).trimEnd()
  kept[max - 1] = `${last}${ELLIPSIS}`
  return kept
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}${ELLIPSIS}` : s)
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

const DARK = rgb(0x12 / 255, 0x0c / 255, 0x09 / 255)
const AMBER = rgb(0xf5 / 255, 0xa7 / 255, 0x42 / 255)
const CREAM = rgb(0xff / 255, 0xf7 / 255, 0xe8 / 255)
const INK = rgb(0x2a / 255, 0x1f / 255, 0x17 / 255)
const MUTED = rgb(0x6b / 255, 0x5d / 255, 0x4f / 255)
const PANEL = rgb(0xfd / 255, 0xf4 / 255, 0xe4 / 255)
const RULE = rgb(0xec / 255, 0xd9 / 255, 0xbb / 255)

// The cup drawn in src/components/admin/cup-mark.tsx (viewBox 0 0 24 24).
const CUP_PATHS = {
  body: 'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z',
  handle: 'M16 10h1.5a2.5 2.5 0 0 1 0 5H16',
  steam: 'M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3',
}

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 56
const HEADER_H = 118
const FOOTER_H = 46

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont }

function drawCup(page: PDFPage, x: number, top: number, size: number) {
  const scale = size / 24
  page.drawSvgPath(CUP_PATHS.body, { x, y: top, scale, borderColor: AMBER, borderWidth: 2 })
  page.drawSvgPath(CUP_PATHS.handle, { x, y: top, scale, borderColor: AMBER, borderWidth: 2 })
  page.drawSvgPath(CUP_PATHS.steam, { x, y: top, scale, borderColor: AMBER, borderWidth: 1.5, borderOpacity: 0.7, borderLineCap: LineCapStyle.Round })
}

export async function buildThankYouPdf(data: ThankYouData, locale: ThankYouLocale): Promise<Uint8Array> {
  const copy = thankYouCopy[locale]
  const date = data.date ?? new Date()
  const doc = await PDFDocument.create()
  doc.setTitle(copy.docTitle)
  doc.setAuthor('CoffeeProjects')
  doc.setCreator('CoffeeProjects')
  doc.setSubject(copy.summaryTitle)
  doc.setLanguage(locale)
  doc.setCreationDate(date)
  doc.setModificationDate(date)

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  }
  const safe = (s: string) => pdfSafe(s, fonts.regular)

  const page = doc.addPage(A4)
  const [W, H] = A4
  const contentW = W - MARGIN * 2

  // Header band: logo + wordmark + tagline.
  page.drawRectangle({ x: 0, y: H - HEADER_H, width: W, height: HEADER_H, color: DARK })
  page.drawRectangle({ x: 0, y: H - HEADER_H - 4, width: W, height: 4, color: AMBER })
  drawCup(page, MARGIN, H - 34, 40)
  page.drawText('Coffee', { x: MARGIN + 52, y: H - 66, size: 26, font: fonts.bold, color: CREAM })
  page.drawText('Projects', {
    x: MARGIN + 52 + fonts.bold.widthOfTextAtSize('Coffee', 26),
    y: H - 66,
    size: 26,
    font: fonts.bold,
    color: AMBER,
  })
  page.drawText(safe(copy.tagline), { x: MARGIN + 52, y: H - 86, size: 10, font: fonts.regular, color: CREAM, opacity: 0.75 })

  let y = H - HEADER_H - 58

  // Date + request number, right-aligned under the band.
  const meta = [`${copy.date}${copy.colon} ${thankYouDate(date, locale)}`, data.reference != null && data.reference !== '' ? `${copy.reference} #${data.reference}` : null]
    .filter(Boolean)
    .join('   ·   ')
  const metaText = safe(meta)
  page.drawText(metaText, { x: W - MARGIN - fonts.regular.widthOfTextAtSize(metaText, 9), y: H - HEADER_H - 22, size: 9, font: fonts.regular, color: MUTED })

  const text = (s: string, opts: { font: PDFFont; size: number; color?: ReturnType<typeof rgb>; x?: number; gap?: number }) => {
    page.drawText(s, { x: opts.x ?? MARGIN, y, size: opts.size, font: opts.font, color: opts.color ?? INK })
    y -= opts.gap ?? opts.size * 1.4
  }
  const paragraph = (s: string, font: PDFFont, size: number, opts: { x?: number; width?: number; maxLines?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const width = opts.width ?? contentW
    let lines = wrapText(safe(s), font, size, width)
    if (opts.maxLines) lines = clampLines(lines, opts.maxLines, font, size, width)
    for (const line of lines) text(line, { font, size, x: opts.x, color: opts.color })
  }

  // Title + greeting + intro.
  for (const line of wrapText(safe(copy.title), fonts.bold, 24, contentW)) text(line, { font: fonts.bold, size: 24, gap: 30 })
  page.drawRectangle({ x: MARGIN, y: y + 14, width: 48, height: 3, color: AMBER })
  y -= 14
  const name = oneLine(data.name) || '—'
  paragraph(copy.greeting(truncate(name, MAX_NAME)), fonts.bold, 12, { maxLines: 2 })
  y -= 2
  paragraph(copy.intro, fonts.regular, 11, { color: INK })
  y -= 14

  // Summary block: cream panel with an amber rule on the left, sized to its content.
  const labelW = 118
  const valueX = MARGIN + 18 + labelW
  const valueW = contentW - 18 - labelW - 14
  const rows: { label: string; lines: string[]; font: PDFFont }[] = []
  const row = (label: string, value: string, font: PDFFont, maxLines: number) =>
    rows.push({ label: safe(label), lines: clampLines(wrapText(safe(value), font, 10.5, valueW), maxLines, font, 10.5, valueW), font })
  row(copy.projectType, oneLine(data.projectType) || '—', fonts.regular, 2)
  if (data.plan?.trim()) row(copy.plan, oneLine(data.plan), fonts.regular, 2)
  if (data.quotedSummary?.trim()) {
    // Stored as "Label: value · Label: value (VAT)": one line per part reads better on paper.
    row(copy.quote, data.quotedSummary.split(' · ').map(oneLine).filter(Boolean).join('\n'), fonts.regular, MAX_SUMMARY_LINES)
  }
  const lineH = 14.5
  const rowGap = 8
  // Title baseline 24 below the top, rows 22 below it, 16.5 of padding under the last line.
  const panelChrome = 40
  const rowsH = () => rows.reduce((h, r) => h + r.lines.length * lineH + rowGap, 0)
  // Steps and contact are fixed copy: measure them first so the message excerpt gets whatever room is left.
  const stepLines = copy.steps.map((step) => wrapText(safe(step), fonts.regular, 11, contentW - 30))
  const stepsH = 22 + stepLines.reduce((h, l) => h + l.length * 15 + 7, 0) + 12
  const contactH = 8 + 20 + 18 + 30 + 14
  if (data.message?.trim()) {
    const room = y - panelChrome - rowsH() - rowGap - 30 - stepsH - contactH - (FOOTER_H + 10)
    const maxLines = Math.max(MIN_MESSAGE_LINES, Math.min(MAX_MESSAGE_LINES, Math.floor(room / lineH)))
    const excerpt = truncate(data.message.replace(/\r\n?/g, '\n').replace(/\n{2,}/g, '\n').trim(), MAX_MESSAGE_CHARS)
    row(copy.message, excerpt, fonts.italic, maxLines)
  }
  const summaryH = panelChrome + rowsH()
  const panelTop = y
  page.drawRectangle({ x: MARGIN, y: panelTop - summaryH, width: contentW, height: summaryH, color: PANEL, borderColor: RULE, borderWidth: 0.75 })
  page.drawRectangle({ x: MARGIN, y: panelTop - summaryH, width: 4, height: summaryH, color: AMBER })
  y = panelTop - 24
  text(safe(copy.summaryTitle).toUpperCase(), { font: fonts.bold, size: 10, x: MARGIN + 18, color: MUTED, gap: 22 })
  for (const r of rows) {
    page.drawText(r.label, { x: MARGIN + 18, y, size: 9.5, font: fonts.bold, color: MUTED })
    for (const line of r.lines) {
      page.drawText(line, { x: valueX, y, size: 10.5, font: r.font, color: INK })
      y -= lineH
    }
    y -= rowGap
  }
  y = panelTop - summaryH - 30

  // Next steps: numbered amber discs.
  text(safe(copy.stepsTitle), { font: fonts.bold, size: 14, gap: 22 })
  stepLines.forEach((lines, i) => {
    page.drawCircle({ x: MARGIN + 9, y: y + 3.5, size: 9, color: AMBER })
    const n = String(i + 1)
    page.drawText(n, { x: MARGIN + 9 - fonts.bold.widthOfTextAtSize(n, 10) / 2, y, size: 10, font: fonts.bold, color: DARK })
    for (const line of lines) {
      page.drawText(line, { x: MARGIN + 28, y, size: 11, font: fonts.regular, color: INK })
      y -= 15
    }
    y -= 7
  })
  y -= 12

  // Contact details + signature.
  page.drawLine({ start: { x: MARGIN, y: y + 12 }, end: { x: W - MARGIN, y: y + 12 }, thickness: 0.75, color: RULE })
  y -= 8
  text(safe(copy.contactTitle), { font: fonts.bold, size: 14, gap: 20 })
  text(safe(copy.contactLead), { font: fonts.regular, size: 11, gap: 18 })
  page.drawText(CONTACT_EMAIL, { x: MARGIN, y, size: 11, font: fonts.bold, color: INK })
  const urlX = MARGIN + fonts.bold.widthOfTextAtSize(CONTACT_EMAIL, 11) + 24
  page.drawText(SITE_URL, { x: urlX, y, size: 11, font: fonts.bold, color: INK })
  page.drawRectangle({ x: urlX, y: y - 3, width: fonts.bold.widthOfTextAtSize(SITE_URL, 11), height: 1.2, color: AMBER })
  y -= 30
  text(safe(copy.signature), { font: fonts.italic, size: 11 })

  // Footer band.
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: DARK })
  const footer = safe(copy.footer)
  const footerW = contentW - 110
  const footerLines = clampLines(wrapText(footer, fonts.regular, 8.5, footerW), 2, fonts.regular, 8.5, footerW)
  footerLines.forEach((line, i) => {
    page.drawText(line, { x: MARGIN, y: FOOTER_H - 20 - i * 11, size: 8.5, font: fonts.regular, color: CREAM, opacity: 0.8 })
  })
  const brand = 'coffeeprojects.es'
  page.drawText(brand, { x: W - MARGIN - fonts.bold.widthOfTextAtSize(brand, 8.5), y: FOOTER_H - 20, size: 8.5, font: fonts.bold, color: AMBER })

  return doc.save()
}
