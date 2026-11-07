import { clean, esc } from './escape'

/** Palette and fonts of the approved designs (docs/design/emails). Constants only: never user input. */
export const colors = {
  page: '#f3ede4',
  panel: '#ffffff',
  card: '#fbf8f3',
  border: '#e7ded2',
  line: '#eae1d5',
  amber: '#c2410c',
  amberSoft: '#9a3412',
  title: '#1a1411',
  body: '#3d332c',
  muted: '#5f5248',
  faint: '#6b5d52',
  ok: '#2f7a55',
}
const C = colors
export const SANS = 'Segoe UI,Helvetica,Arial,sans-serif'
export const MONO = 'Consolas,Menlo,monospace'

export const SITE_URL = 'https://coffeeprojects.es'
export const CONTACT_EMAIL = 'contact@coffeeprojects.es'

export type Row = { label: string; value: string | null | undefined; accent?: boolean }

export const sectionLabel = (extra = '') => `font-family:${MONO};font-size:12px;letter-spacing:1px;color:${C.faint};text-transform:uppercase;${extra}`

/** `<tr>`s for the given rows; rows without a value are dropped. Labels and values are escaped here. */
function rowsHtml(rows: Row[], bottomPad: number): string {
  const shown = rows.filter((r) => clean(r.value))
  return shown
    .map((r, i) => {
      const top = i === 0 ? '' : `border-top:1px solid ${C.line};`
      const bottom = i === shown.length - 1 ? bottomPad : 8
      const pad = `padding:8px 20px ${bottom}px;`
      return (
        `<tr><td style="${pad}font-size:14px;color:${C.muted};${top}">${esc(r.label)}</td>` +
        `<td align="right" style="${pad}font-size:14px;color:${r.accent ? C.amber : C.title};${r.accent ? 'font-weight:700;' : ''}${top}">${esc(clean(r.value))}</td></tr>`
      )
    })
    .join('')
}

/** Card with a mono title and label/value rows; `''` when no row has a value. `note` is a small line under the rows. */
export function card(title: string, rows: Row[], { note = '', top = 24 }: { note?: string; top?: number } = {}): string {
  if (!rows.some((r) => clean(r.value))) return ''
  return (
    `<tr><td style="padding:${top}px 32px 0;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.card};border:1px solid ${C.border};border-radius:12px;">` +
    `<tr><td colspan="2" style="padding:16px 20px 4px;${sectionLabel()}">${esc(title)}</td></tr>` +
    rowsHtml(rows, note ? 8 : 16) +
    (note ? `<tr><td colspan="2" style="padding:0 20px 14px;font-size:12px;color:${C.faint};">${esc(note)}</td></tr>` : '') +
    `</table></td></tr>`
  )
}

export const logo = (size: number) =>
  `<span style="font-size:${size}px;font-weight:700;color:${C.title};">&#9749; Coffee<span style="color:${C.amber};">Projects</span></span>`

/** The terminal line: `prompt` and `command` are copy constants (escaped anyway), `ok` the green check text. */
export const terminal = (prompt: string, command: string, ok = '') =>
  `<tr><td style="padding:28px 32px 0;"><div style="font-family:${MONO};font-size:13px;color:${C.muted};background:${C.page};border:1px solid ${C.line};border-radius:8px;padding:10px 14px;">` +
  `<span style="color:${C.amber};">${esc(prompt)}</span> ${esc(command)}${ok ? ` <span style="color:${C.ok};">&#10003; ${esc(ok)}</span>` : ''}</div></td></tr>`

/** CTA button; `href` must already be a safe, escaped URL. */
export const button = (href: string, text: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.amber};color:${C.page};text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">${esc(text)} &rarr;</a>`

/** Pill link (mailto/tel); `href` already safe and escaped, `html` already escaped; no link when `href` is null. */
export function chip(href: string | null, html: string): string {
  const style = `display:inline-block;margin:0 6px 6px 0;background:${C.line};color:${C.amberSoft};text-decoration:none;font-size:14px;padding:8px 12px;border-radius:8px;`
  return href ? `<a href="${href}" style="${style}">${html}</a>` : `<span style="${style}">${html}</span>`
}

/** Complete document: page background, 600px panel, then `inner` (a list of `<tr>`s). */
export function shell({ lang, title, inner }: { lang: string; title: string; inner: string }): string {
  return (
    `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.page};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.page}" style="background:${C.page};padding:32px 12px;"><tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.panel};border:1px solid ${C.border};border-radius:16px;overflow:hidden;font-family:${SANS};">` +
    inner +
    `</table></td></tr></table></body></html>`
  )
}

export const clientHeader = `<tr><td style="padding:24px 32px;border-bottom:1px solid ${C.border};">${logo(20)}</td></tr>`

/**
 * Client-facing footer (confirmation and replies), in the client's language: `home` and `privacy` are that locale's
 * pages (built from constants and the routing config) and `tagline` comes from `clientCopy`.
 */
export function clientFooter({
  signature,
  home,
  privacy,
  privacyLabel,
  tagline,
}: {
  signature: string
  home: string
  privacy: string
  privacyLabel: string
  tagline: string
}): string {
  return (
    `<tr><td style="padding:20px 32px;border-top:1px solid ${C.border};background:${C.page};">` +
    (signature ? `<div style="font-size:13px;color:${C.muted};"><strong style="color:${C.title};">${esc(signature)}</strong></div>` : '') +
    `<div style="font-family:${MONO};font-size:12px;color:${C.faint};padding-top:6px;">${esc(tagline)}</div>` +
    `<div style="font-size:12px;color:${C.faint};padding-top:12px;">` +
    `<a href="${esc(home)}" style="color:${C.amber};text-decoration:none;">coffeeprojects.es</a> &nbsp;&middot;&nbsp; ` +
    `<a href="mailto:${CONTACT_EMAIL}" style="color:${C.muted};text-decoration:none;">${CONTACT_EMAIL}</a> &nbsp;&middot;&nbsp; ` +
    `<a href="${esc(privacy)}" style="color:${C.muted};text-decoration:none;">${esc(privacyLabel)}</a></div></td></tr>`
  )
}
