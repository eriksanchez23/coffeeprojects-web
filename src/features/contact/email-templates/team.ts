import { budgetLabels, localeLabels, projectTypeLabels, timelineLabels, websiteIssueLabels } from '@/fields/labels'
import type { Contact } from '@/payload-types'
import { clean, esc, escMultiline, safeHttpUrl, safeMailto, safeTel } from './escape'
import { parseQuote } from './quote'
import { button, card, chip, colors, logo, MONO, sectionLabel, shell, type Row } from './shell'

/** The stored request (every column the team can see in the panel), as `payload.create` returns it. */
export type TeamEmailContact = Omit<Contact, 'status' | 'assignedTo' | 'internalNotes' | 'ipHash' | 'replies' | 'updatedAt'> &
  Partial<Pick<Contact, 'updatedAt'>>

const yesNo = (v: boolean | null | undefined) => (v ? 'Sí' : 'No')
const madrid = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', { ...opts, timeZone: 'Europe/Madrid' }).format(new Date(iso))
const madridDate = (iso: string) => `${madrid(iso, { dateStyle: 'full' })} · ${madrid(iso, { hour: '2-digit', minute: '2-digit', hour12: false })}`

const headline = (type: string, kind: string) => {
  if (kind === 'maintenance') return { before: 'quiere ', accent: 'Mantenimiento', after: '' }
  if (kind === 'custom') return { before: 'quiere un ', accent: 'proyecto a medida', after: '' }
  if (kind === 'redesign') return { before: 'quiere ', accent: 'mejorar su web', after: '' }
  if (kind === 'audit') return { before: 'pide una ', accent: 'revisión gratuita (48 h)', after: '' }
  return { before: kind === 'web' || kind === 'ecommerce' ? 'quiere una ' : 'quiere un ', accent: type, after: '' }
}

/** S18/S14: the team notification, with all the request data and a link to it in the admin. Team copy is Spanish. */
export function renderTeamEmail(c: TeamEmailContact, { adminUrl }: { adminUrl: string }) {
  const type = projectTypeLabels[c.projectType]?.es ?? c.projectType
  const when = madridDate(c.createdAt)
  const source = clean(c.sourcePath)
  const quote = parseQuote(c.quotedSummary, 'Precio y plazo mostrados')
  const admin = safeHttpUrl(adminUrl)
  const mailto = safeMailto(c.email)
  const tel = safeTel(c.phone)
  const h = headline(type, c.projectType)

  const projectRows: Row[] = [
    { label: 'Tipo', value: type },
    { label: 'Web actual', value: c.currentUrl },
    {
      label: 'Qué le falla',
      value:
        (c.websiteIssues ?? [])
          .map((i) => (i === 'other' && clean(c.websiteIssuesOther) ? `Otro: ${clean(c.websiteIssuesOther)}` : (websiteIssueLabels[i]?.es ?? i)))
          .join(', ') || null,
    },
    { label: 'Plan', value: c.plan },
    ...quote.rows.map((r) => ({ label: r.label, value: r.value, accent: r.value.includes('€') })),
    // Retired fields (S17): only requests sent before carry them.
    { label: 'Presupuesto', value: c.budget ? (budgetLabels[c.budget]?.es ?? c.budget) : null },
    { label: 'Plazo', value: c.timeline ? (timelineLabels[c.timeline]?.es ?? c.timeline) : null },
    { label: 'Cómo nos conoció', value: c.howFound },
  ]
  const campaign: Row[] = [
    { label: 'Origen UTM', value: c.utmSource },
    { label: 'Medio UTM', value: c.utmMedium },
    { label: 'Campaña UTM', value: c.utmCampaign },
    { label: 'Contenido UTM', value: c.utmContent },
    { label: 'Término UTM', value: c.utmTerm },
    { label: 'fbclid', value: c.fbclid },
  ].filter((r) => clean(r.value))
  const detailRows: Row[] = [
    { label: 'Idioma', value: c.locale ? (localeLabels[c.locale]?.es ?? c.locale) : null },
    { label: 'NDA', value: c.ndaRequested ? 'Sí, quiere firmar NDA' : 'No' },
    { label: 'Privacidad / Marketing', value: `${c.privacyAccepted ? 'Aceptada' : 'No aceptada'} / ${yesNo(c.marketingConsent)}` },
    ...(campaign.length ? campaign : [{ label: 'Campaña', value: 'Sin datos de campaña' }]),
  ]

  const details =
    `<tr><td style="padding:24px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${colors.border};">` +
    `<tr><td colspan="2" style="padding:12px 0 4px;${sectionLabel('font-size:11px;')}">Detalles</td></tr>` +
    detailRows
      .filter((r) => clean(r.value))
      .map(
        (r) =>
          `<tr><td style="padding:3px 0;font-size:12px;color:${colors.faint};">${esc(r.label)}</td><td align="right" style="padding:3px 0;font-size:12px;color:${colors.muted};">${esc(clean(r.value))}</td></tr>`,
      )
      .join('') +
    `</table></td></tr>`

  const chips = [chip(mailto, `&#9993; ${esc(clean(c.email))}`), clean(c.phone) ? chip(tel, `&#9742; ${esc(clean(c.phone))}`) : ''].join('')
  const clientCard =
    `<tr><td style="padding:22px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.card};border:1px solid ${colors.border};border-radius:12px;">` +
    `<tr><td style="padding:16px 20px 6px;${sectionLabel()}">Cliente</td></tr>` +
    `<tr><td style="padding:2px 20px;font-size:18px;font-weight:700;color:${colors.title};">${esc(clean(c.name))}</td></tr>` +
    `<tr><td style="padding:10px 20px 16px;">${chips}</td></tr></table></td></tr>`

  const inner =
    `<tr><td style="padding:20px 32px;border-bottom:1px solid ${colors.border};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td>${logo(18)}</td><td align="right"><span style="font-family:${MONO};font-size:12px;color:${colors.page};background:${colors.amber};border-radius:999px;padding:4px 10px;font-weight:700;">NUEVA &middot; #${esc(String(c.id))}</span></td></tr></table></td></tr>` +
    `<tr><td style="padding:26px 32px 4px;"><div style="font-family:${MONO};font-size:13px;color:${colors.muted};"><span style="color:${colors.amber};">~ panel $</span> nueva-solicitud --${esc(clean(c.projectType))}</div>` +
    `<h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;color:${colors.title};">${esc(clean(c.name))} ${esc(h.before)}<span style="color:${colors.amber};">${esc(h.accent)}</span></h1>` +
    `<div style="font-size:14px;color:${colors.faint};padding-top:6px;">${esc(when)}${source ? ` · desde ${esc(source)}` : ''}</div></td></tr>` +
    clientCard +
    card('Proyecto', projectRows, { note: quote.note, top: 14 }) +
    `<tr><td style="padding:14px 32px 0;"><div style="${sectionLabel('padding:6px 0 10px;')}">Mensaje</div>` +
    `<div style="border-left:3px solid ${colors.amber};background:${colors.card};border-radius:0 10px 10px 0;padding:14px 18px;font-size:15px;line-height:1.6;color:${colors.body};">${escMultiline(c.message)}</div></td></tr>` +
    (admin ? `<tr><td align="center" style="padding:28px 32px 6px;">${button(admin, 'Abrir en el panel')}</td></tr>` : '') +
    `<tr><td align="center" style="padding:6px 32px 24px;font-size:13px;color:${colors.faint};">&#8617; <strong style="color:${colors.muted};">Responde a este correo</strong> y le llegará al cliente desde nuestra dirección; la respuesta queda guardada en el panel.</td></tr>` +
    details +
    `<tr><td style="padding:16px 32px;border-top:1px solid ${colors.border};background:${colors.page};font-family:${MONO};font-size:11px;color:${colors.faint};">Notificación interna de coffeeprojects.es · solo para el equipo</td></tr>`

  const textRows = (rows: Row[]) => rows.filter((r) => clean(r.value)).map((r) => `${r.label}: ${clean(r.value)}`)
  const text = [
    `NUEVA · #${c.id}`,
    `${clean(c.name)} ${h.before}${h.accent}`,
    `${when}${source ? ` · desde ${source}` : ''}`,
    '',
    'CLIENTE',
    ...textRows([
      { label: 'Nombre', value: c.name },
      { label: 'Email', value: c.email },
      { label: 'Teléfono', value: c.phone },
    ]),
    '',
    'PROYECTO',
    ...textRows(projectRows),
    ...(quote.note ? [`(${quote.note})`] : []),
    '',
    'MENSAJE',
    c.message,
    '',
    ...(admin ? [`Abrir en el panel: ${clean(adminUrl)}`] : []),
    'Responde a este correo y le llegará al cliente desde nuestra dirección; la respuesta queda guardada en el panel.',
    '',
    'DETALLES',
    ...textRows(detailRows),
  ].join('\n')

  const subject = `Nueva solicitud (${type}) — ${c.name}`.slice(0, 140)
  return { subject, html: shell({ lang: 'es', title: subject, inner }), text }
}
