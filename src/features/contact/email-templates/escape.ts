/** HTML-escapes a value for text and quoted-attribute contexts. Every user/CMS value goes through it. */
export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;')

/** Trimmed value, or an empty string when there is nothing to show (rows with no value are hidden). */
export const clean = (v: string | null | undefined): string => (typeof v === 'string' ? v.trim() : '')

/** Escaped text with its line breaks kept (`<br>` works in every client, unlike `white-space`). */
export const escMultiline = (s: string) => esc(s.replace(/\r\n?/g, '\n')).replace(/\n/g, '<br>')

const SAFE_EMAIL = /^[A-Za-z0-9._+-]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/

/** `mailto:` href (already escaped) only for a plain, strictly validated address; `null` otherwise (no link is rendered). */
export function safeMailto(email: string | null | undefined): string | null {
  const e = clean(email)
  return e.length <= 254 && SAFE_EMAIL.test(e) ? `mailto:${esc(e)}` : null
}

/** `tel:` href (already escaped) made of digits and an optional leading `+` only; `null` for anything else. */
export function safeTel(phone: string | null | undefined): string | null {
  const p = clean(phone)
  if (!/^[+\d\s().-]+$/.test(p)) return null
  const digits = p.replace(/[^\d+]/g, '')
  return /^\+?\d{5,20}$/.test(digits) ? `tel:${digits}` : null
}

/** http(s) URL (already escaped) or `null`: blocks `javascript:`, `data:` and anything unparseable. */
export function safeHttpUrl(url: string | null | undefined): string | null {
  try {
    const u = new URL(clean(url))
    return u.protocol === 'https:' || u.protocol === 'http:' ? esc(u.href) : null
  } catch {
    return null
  }
}
