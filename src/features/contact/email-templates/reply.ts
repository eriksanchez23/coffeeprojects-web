import { buildPath } from '@/i18n/build-path'
import { clientCopy, clientLocale } from './copy'
import { escMultiline } from './escape'
import { clientFooter, clientHeader, colors, shell, SITE_URL } from './shell'

/** The team's reply as typed (plain text, exact) plus the same text, escaped, in the branded shell. */
export function renderReplyEmail(message: string, locale?: string | null) {
  const l = clientLocale(locale)
  const c = clientCopy[l]
  const privacy = `${SITE_URL}${buildPath('/privacy', l)}`
  const inner =
    clientHeader +
    `<tr><td style="padding:28px 32px 8px;font-size:16px;line-height:1.6;color:${colors.body};">${escMultiline(message)}</td></tr>` +
    `<tr><td style="padding:12px 32px 28px;font-size:14px;color:${colors.muted};">&mdash; <strong style="color:${colors.title};">${escMultiline(c.sign)}</strong></td></tr>` +
    clientFooter({ signature: '', home: SITE_URL, privacy, privacyLabel: c.privacyLabel })
  return { text: message, html: shell({ lang: l, title: c.sign, inner }) }
}
