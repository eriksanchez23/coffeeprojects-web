export type SummaryRow = { label: string; value: string }

// The last parenthesised group (one nested level allowed), e.g. "(IVA (21 %) incluido)".
const NOTE = /\s\((?:[^()]*\([^()]*\))?[^()]*\)$/

/**
 * Splits the one-line quote stored on the lead ("Plan: X · Precio: Y · Plazo: Z (IVA incluido)") back into
 * label/value rows. Purely presentational: values stay untrusted text and are escaped by the templates.
 */
export function parseQuote(summary: string | null | undefined, fallbackLabel: string): { rows: SummaryRow[]; note: string } {
  let text = (summary ?? '').trim()
  if (!text) return { rows: [], note: '' }
  let note = ''
  const m = NOTE.exec(text)
  if (m) {
    note = m[0].trim().slice(1, -1)
    text = text.slice(0, m.index).trim()
  }
  const rows = text
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const i = part.indexOf(': ')
      return i > 0 ? { label: part.slice(0, i), value: part.slice(i + 2).trim() } : { label: fallbackLabel, value: part }
    })
    .filter((r) => r.value)
  return { rows, note }
}
