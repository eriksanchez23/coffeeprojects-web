import type { TextFieldValidation } from 'payload'
import { text } from 'payload/shared'

const HTTP_URL = /^https?:\/\/[^\s/?#]+[^\s]*$/i
const MAILTO = /^mailto:[^\s@:/]+@[^\s@:/]+$/i

/**
 * True for an absolute http(s) URL (and `mailto:` when allowed). Blocks `javascript:`, `data:`, relative and
 * protocol-relative values, which CMS links would otherwise render straight into `href`.
 */
export function isSafeUrl(value: string, { allowMailto = false }: { allowMailto?: boolean } = {}): boolean {
  const v = value.trim()
  if (allowMailto && MAILTO.test(v)) return true
  if (!HTTP_URL.test(v)) return false
  try {
    const url = new URL(v)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== ''
  } catch {
    return false
  }
}

const MESSAGE = 'Introduce una URL completa http(s):// · Enter a full http(s):// URL'

/** Payload `validate` for text URL fields: the safe-URL check, then Payload's built-in text validation. */
export function safeUrlValidator(
  opts: { allowMailto?: (siblingData: Record<string, unknown> | undefined) => boolean } = {},
): TextFieldValidation {
  return (value, options) => {
    if (typeof value === 'string' && value.trim() !== '') {
      const allowMailto = opts.allowMailto?.(options.siblingData as Record<string, unknown> | undefined) ?? false
      if (!isSafeUrl(value, { allowMailto })) return MESSAGE
    }
    return text(value, options)
  }
}
