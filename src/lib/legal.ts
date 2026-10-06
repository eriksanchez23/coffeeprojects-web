import type { Legal } from '@/payload-types'

/** Placeholders for data the company still has to provide/decide, in each locale's wording. */
const PENDING_MARKER = /\[(PENDIENTE|PENDING|EN ATTENTE)\b/

/** Text content of a Lexical document (every `text` leaf). */
function plainText(doc: unknown): string {
  const out: string[] = []
  const walk = (node: unknown) => {
    if (Array.isArray(node)) node.forEach(walk)
    else if (node && typeof node === 'object') {
      const o = node as Record<string, unknown>
      if (typeof o.text === 'string') out.push(o.text)
      Object.values(o).forEach(walk)
    }
  }
  walk(doc)
  return out.join(' ')
}

/** True while the rendered legal text still carries a [PENDIENTE]/[PENDING]/[EN ATTENTE] placeholder. */
export const hasPendingMarkers = (doc: unknown) => PENDING_MARKER.test(plainText(doc))

type LegalDocs = Record<keyof Pick<Legal, 'legalNotice' | 'privacyPolicy' | 'cookiePolicy'>, unknown>
const LEGAL_PAGES = [
  ['/legal-notice', 'legalNotice'],
  ['/privacy', 'privacyPolicy'],
  ['/cookies', 'cookiePolicy'],
] as const

/** Legal pages ready for search engines: content in every locale and no pending marker in any of them. */
export function legalPagesToIndex(byLocale: Partial<LegalDocs>[]) {
  return LEGAL_PAGES.filter(([, key]) => byLocale.every((docs) => docs[key] && !hasPendingMarkers(docs[key]))).map(([path]) => path)
}
