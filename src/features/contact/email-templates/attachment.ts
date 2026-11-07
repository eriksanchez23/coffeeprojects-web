import { buildPath } from '@/i18n/build-path'
import { clientCopy, clientLocale } from './copy'
import { clean, esc } from './escape'
import { button, clientFooter, clientHeader, colors, shell, SITE_URL } from './shell'

type Paragraphs = { greeting: string; lines: string[] }

/** Branded shell for the short client emails that carry the thank-you PDF (S22). All text is escaped here. */
function render(locale: string | null | undefined, subject: string, { greeting, lines }: Paragraphs, cta: { label: string; path: '/projects' }) {
  const l = clientLocale(locale)
  const c = clientCopy[l]
  const privacy = `${SITE_URL}${buildPath('/privacy', l)}`
  const home = `${SITE_URL}${buildPath('/', l)}`
  const projects = `${SITE_URL}${buildPath(cta.path, l)}`
  const inner =
    clientHeader +
    `<tr><td style="padding:28px 32px 8px;"><h1 style="margin:0;font-size:26px;line-height:1.25;color:${colors.title};">${esc(greeting)}</h1></td></tr>` +
    lines
      .map((p) => `<tr><td style="padding:8px 32px 0;font-size:16px;line-height:1.6;color:${colors.body};">${esc(p)}</td></tr>`)
      .join('') +
    `<tr><td align="center" style="padding:28px 32px 28px;">${button(esc(projects), cta.label)}</td></tr>` +
    clientFooter({ signature: c.sign, home, privacy, privacyLabel: c.privacyLabel, tagline: c.tagline })
  const text = [greeting, '', ...lines.flatMap((p) => [p, '']), `— ${c.sign}`, home].join('\n')
  return { subject, html: shell({ lang: l, title: subject, inner }), text }
}

const attachedNote = {
  es: 'Te adjuntamos un resumen de tu solicitud en PDF.',
  en: "We've attached a summary of your request as a PDF.",
  fr: 'Vous trouverez en pièce jointe un résumé de votre demande au format PDF.',
} as const

const ctaCopy = { es: 'Mira nuestros proyectos', en: 'See our projects', fr: 'Découvrez nos projets' } as const

/** S22: the automatic confirmation, in the client's language, sent with the thank-you PDF attached. */
export function renderConfirmationEmail(locale: string | null | undefined) {
  const l = clientLocale(locale)
  const c = clientCopy[l]
  const [before, strong, after] = c.intro
  return render(locale, c.subject, { greeting: `${c.hi}.`, lines: [before + strong + after, attachedNote[l]] }, { label: ctaCopy[l], path: '/projects' })
}

const thankYouBody = {
  es: {
    body: 'Gracias por confiar en CoffeeProjects. Te adjuntamos un documento con el resumen de tu solicitud y los próximos pasos.',
    questions: 'Si tienes cualquier duda, responde a este correo y te contestaremos encantados.',
  },
  en: {
    body: 'Thank you for trusting CoffeeProjects. Attached you will find a summary of your request and the next steps.',
    questions: 'If you have any questions, just reply to this email and we will be glad to help.',
  },
  fr: {
    body: 'Merci de faire confiance à CoffeeProjects. Vous trouverez en pièce jointe un résumé de votre demande et les prochaines étapes.',
    questions: 'Pour toute question, répondez simplement à cet e-mail : nous vous répondrons avec plaisir.',
  },
} as const

/** S22: the short email that carries the thank-you PDF sent from the panel, in the client's language. */
export function renderThankYouEmail(name: string, locale: string | null | undefined, subject: string) {
  const l = clientLocale(locale)
  const hi = clientCopy[l].hi
  const who = clean(name).replace(/\s+/g, ' ').slice(0, 80)
  const greeting = l === 'es' ? `${hi}, ${who}:` : l === 'fr' ? `${hi} ${who},` : `${hi} ${who},`
  const b = thankYouBody[l]
  return render(locale, subject, { greeting, lines: [b.body, b.questions] }, { label: ctaCopy[l], path: '/projects' })
}
