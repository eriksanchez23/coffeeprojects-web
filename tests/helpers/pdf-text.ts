import { decodePDFRawStream, PDFArray, PDFDocument, type PDFRawStream } from 'pdf-lib'

// WinAnsi bytes that differ from Latin-1 (the rest of 0x20-0xFF is the same code point).
const WIN_ANSI: Record<number, string> = {
  0x80: '€', 0x85: '…', 0x8c: 'Œ', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x99: '™', 0x9c: 'œ',
}

const decodeHex = (hex: string) =>
  (hex.match(/../g) ?? []).map((h) => parseInt(h, 16)).map((b) => WIN_ANSI[b] ?? String.fromCharCode(b)).join('')

export type PdfTextRun = { x: number; y: number; text: string }

/** Every text run drawn on the first page (pdf-lib standard fonts: `x y Tm <hex> Tj`), top to bottom. */
export async function pdfTextRuns(bytes: Uint8Array): Promise<PdfTextRun[]> {
  const doc = await PDFDocument.load(bytes)
  const contents = doc.getPage(0).node.Contents()
  const streams = contents instanceof PDFArray ? contents.asArray().map((ref) => doc.context.lookup(ref)) : [contents]
  const source = streams.map((s) => Buffer.from(decodePDFRawStream(s as PDFRawStream).decode()).toString('latin1')).join('\n')
  const runs: PdfTextRun[] = []
  for (const m of source.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm\s+<([0-9A-Fa-f]*)> Tj/g)) {
    runs.push({ x: Number(m[1]), y: Number(m[2]), text: decodeHex(m[3]!) })
  }
  return runs
}

export async function pdfText(bytes: Uint8Array): Promise<string> {
  return (await pdfTextRuns(bytes)).map((r) => r.text).join('\n')
}
