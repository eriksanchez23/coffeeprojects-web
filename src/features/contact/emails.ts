import { budgetLabels, localeLabels, projectTypeLabels, timelineLabels } from '@/fields/labels'
import type { Contact } from '@/payload-types'
import type { ContactInput } from './schema'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Used when no team user has an email and CONTACT_NOTIFY_EMAIL is unset: a lead must always reach someone. */
export const FALLBACK_NOTIFY_EMAIL = 'contact@coffeeprojects.es'

/**
 * S18: every team user (their own panel email) plus CONTACT_NOTIFY_EMAIL when set, deduplicated
 * case-insensitively, in that order.
 */
export function teamRecipients(users: readonly { email?: string | null }[], notifyEmail: string | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of [...users.map((u) => u.email), notifyEmail]) {
    const email = raw?.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out.length > 0 ? out : [FALLBACK_NOTIFY_EMAIL]
}

/** The stored request (every column the team can see in the panel), as `payload.create` returns it. */
export type TeamEmailContact = Omit<Contact, 'status' | 'assignedTo' | 'internalNotes' | 'ipHash' | 'replies' | 'updatedAt'> &
  Partial<Pick<Contact, 'updatedAt'>>

const yesNo = (v: boolean | null | undefined) => (v ? 'Sí' : 'No')
const madridDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(iso))

/** S18: the team notification, with all the request data and a link to it in the admin. Team copy is Spanish. */
export function teamEmail(c: TeamEmailContact, { adminUrl }: { adminUrl: string }) {
  const type = projectTypeLabels[c.projectType]?.es ?? c.projectType
  const rows: [string, string | null | undefined][] = [
    ['Solicitud', `#${c.id}`],
    ['Fecha', madridDate(c.createdAt)],
    ['Nombre', c.name],
    ['Email', c.email],
    ['Teléfono', c.phone],
    ['Tipo de proyecto', type],
    ['Plan', c.plan],
    ['Precio y plazo mostrados', c.quotedSummary],
    // Retired fields (S17): only requests sent before carry them.
    ...(c.budget ? [['Presupuesto', budgetLabels[c.budget]?.es ?? c.budget] as [string, string]] : []),
    ...(c.timeline ? [['Plazo', timelineLabels[c.timeline]?.es ?? c.timeline] as [string, string]] : []),
    ['Cómo nos conoció', c.howFound],
    ['NDA', c.ndaRequested ? 'Sí, quiere firmar NDA' : 'No'],
    ['Política de privacidad aceptada', yesNo(c.privacyAccepted)],
    ['Consentimiento de marketing', yesNo(c.marketingConsent)],
    ['Idioma', c.locale ? (localeLabels[c.locale]?.es ?? c.locale) : null],
    ['Página de origen', c.sourcePath],
    ['Origen UTM', c.utmSource],
    ['Medio UTM', c.utmMedium],
    ['Campaña UTM', c.utmCampaign],
    ['Contenido UTM', c.utmContent],
    ['Término UTM', c.utmTerm],
    ['fbclid', c.fbclid],
  ]
  const value = (v: string | null | undefined) => (v && v.trim() ? v : '—')
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b5d4f;vertical-align:top">${k}</td><td>${esc(value(v))}</td></tr>`)
    .join('')
  const link = esc(adminUrl)
  return {
    subject: `Nueva solicitud (${type}) — ${c.name}`.slice(0, 140),
    html:
      `<h2>Nueva solicitud desde coffeeprojects.es</h2><table>${table}</table>` +
      `<h3>Mensaje</h3><p style="white-space:pre-wrap">${esc(c.message)}</p>` +
      `<p><a href="${link}">Abrir la solicitud en el panel</a><br/>${link}</p>`,
    text: [
      'Nueva solicitud desde coffeeprojects.es',
      '',
      ...rows.map(([k, v]) => `${k}: ${value(v)}`),
      '',
      'Mensaje:',
      c.message,
      '',
      `Abrir en el panel: ${adminUrl}`,
    ].join('\n'),
  }
}

const copy = {
  es: { subject: 'Hemos recibido tu solicitud — CoffeeProjects', hi: 'Hola', body: 'Gracias por contarnos tu proyecto. En menos de 24 horas te escribiremos con una primera propuesta.', sign: 'El equipo de CoffeeProjects' },
  en: { subject: "We've received your request — CoffeeProjects", hi: 'Hi', body: "Thanks for telling us about your project. We'll get back to you within 24 hours with a first proposal.", sign: 'The CoffeeProjects team' },
  fr: { subject: 'Nous avons bien reçu votre demande — CoffeeProjects', hi: 'Bonjour', body: 'Merci de nous avoir présenté votre projet. Nous vous répondrons en moins de 24 heures avec une première proposition.', sign: "L'équipe CoffeeProjects" },
} as const

type ClientLocale = keyof typeof copy
const clientLocale = (l: string | null | undefined): ClientLocale => (l === 'en' || l === 'fr' ? l : 'es')

export function clientEmail(i: ContactInput) {
  const c = copy[i.locale]
  return {
    subject: c.subject,
    html: `<p>${c.hi},</p><p>${c.body}</p><p>— ${c.sign}<br/><a href="https://coffeeprojects.es">coffeeprojects.es</a></p>`,
  }
}

/** S19: default subject of a reply from the panel, on the thread of the auto-reply the client received. */
export function replySubject(locale: string | null | undefined): string {
  return `Re: ${copy[clientLocale(locale)].subject}`
}

/** S19: the team's reply as typed (plain text), plus an escaped HTML version that keeps its line breaks. */
export function replyEmail(message: string) {
  return { text: message, html: `<div style="white-space:pre-wrap">${esc(message)}</div>` }
}
