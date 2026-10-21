import { buildPath } from '@/i18n/build-path'
import type { ContactInput } from '../schema'
import { clientCopy } from './copy'
import { clean, esc } from './escape'
import { parseQuote } from './quote'
import { button, card, clientFooter, clientHeader, colors, shell, SITE_URL, terminal, type Row } from './shell'

export type ClientEmailInput = ContactInput & { quotedSummary?: string }

const firstName = (name: string) => clean(name).split(/\s+/)[0]?.slice(0, 60) ?? ''

/** Confirmation sent to the visitor: approved branded design, fully localized, summary limited to data available at send time. */
export function renderClientEmail(i: ClientEmailInput) {
  const c = clientCopy[i.locale]
  const name = firstName(i.name)
  const type = c.projectTypes[i.projectType] ?? i.projectType
  const quote = parseQuote(i.quotedSummary, c.quoteFallbackLabel)
  const rows: Row[] = [
    { label: c.projectLabel, value: type },
    // The stored quote already names the plan; the raw plan slug is only a fallback.
    ...(quote.rows.length ? quote.rows.map((r) => ({ label: r.label, value: r.value, accent: r.value.includes('€') })) : [{ label: c.planLabel, value: i.plan }]),
  ]
  const home = SITE_URL
  const projects = `${SITE_URL}${buildPath('/projects', i.locale)}`
  const privacy = `${SITE_URL}${buildPath('/privacy', i.locale)}`
  const greeting = name ? `${c.hi}, ${name}.` : `${c.hi}.`
  const [before, strong, after] = c.intro

  const steps = c.steps
    .map(
      ([s, rest], n) =>
        `<tr><td width="36" valign="top" style="padding:6px 0;"><span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;background:${colors.line};color:${colors.amber};font-weight:700;font-size:13px;">${n + 1}</span></td>` +
        `<td style="padding:6px 0;font-size:15px;color:${colors.body};"><strong style="color:${colors.title};">${esc(s)}</strong>${esc(rest)}</td></tr>`,
    )
    .join('')

  const inner =
    clientHeader +
    terminal('~ coffeeprojects $', c.terminalCommand, c.terminalOk) +
    `<tr><td style="padding:24px 32px 8px;"><h1 style="margin:0;font-size:28px;line-height:1.2;color:${colors.title};">${esc(greeting)}<br><span style="color:${colors.amber};">${esc(c.accent)}</span></h1></td></tr>` +
    `<tr><td style="padding:8px 32px 0;font-size:16px;line-height:1.6;color:${colors.body};">${esc(before)}<strong style="color:${colors.title};">${esc(strong)}</strong>${esc(after)}</td></tr>` +
    card(c.summaryTitle, rows, { note: quote.note }) +
    `<tr><td style="padding:28px 32px 0;"><div style="font-family:Consolas,Menlo,monospace;font-size:12px;letter-spacing:1px;color:${colors.faint};text-transform:uppercase;padding-bottom:12px;">${esc(c.stepsTitle)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps}</table></td></tr>` +
    `<tr><td align="center" style="padding:32px 32px 8px;">${button(esc(projects), c.cta)}</td></tr>` +
    `<tr><td align="center" style="padding:8px 32px 28px;font-size:13px;color:${colors.faint};">${esc(c.hint)}</td></tr>` +
    clientFooter({ signature: c.sign, home, privacy, privacyLabel: c.privacyLabel })

  const text = [
    greeting,
    c.accent,
    '',
    before + strong + after,
    '',
    c.summaryTitle.toUpperCase(),
    ...rows.filter((r) => clean(r.value)).map((r) => `- ${r.label}: ${clean(r.value)}`),
    ...(quote.note ? [`(${quote.note})`] : []),
    '',
    c.stepsTitle.toUpperCase(),
    ...c.steps.map(([s, rest], n) => `${n + 1}. ${s}${rest}`),
    '',
    `${c.cta}: ${projects}`,
    c.replyHintText,
    '',
    `— ${c.sign}`,
    `coffeeprojects.es · contact@coffeeprojects.es · ${privacy}`,
  ].join('\n')

  return { subject: c.subject, html: shell({ lang: i.locale, title: c.subject, inner }), text }
}
