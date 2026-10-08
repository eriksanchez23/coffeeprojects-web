import type { ContactInput } from './schema'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export function teamEmail(i: ContactInput) {
  const rows: [string, string | undefined][] = [
    ['Nombre', i.name],
    ['Email', i.email],
    ['Teléfono', i.phone],
    ['Tipo', i.projectType],
    ['Plan', i.plan],
    ['Presupuesto', i.budget],
    ['Plazo', i.timeline],
    ['Cómo nos conoció', i.howFound],
    ['NDA', i.nda ? 'Sí, quiere firmar NDA' : 'No'],
    ['Idioma', i.locale],
    ['Página', i.sourcePath],
  ]
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b5d4f">${k}</td><td>${esc(String(v))}</td></tr>`)
    .join('')
  return {
    subject: `Nueva solicitud (${i.projectType}) — ${i.name}`.slice(0, 140),
    html: `<h2>Nueva solicitud desde coffeeprojects.es</h2><table>${table}</table><h3>Mensaje</h3><p style="white-space:pre-wrap">${esc(i.message)}</p><p>Gestiónala en el panel: /admin/collections/contacts</p>`,
  }
}

const copy = {
  es: { subject: 'Hemos recibido tu solicitud — coffeeProjects', hi: 'Hola', body: 'Gracias por contarnos tu proyecto. En menos de 24 horas te escribiremos con una primera propuesta.', sign: 'El equipo de coffeeProjects' },
  en: { subject: "We've received your request — coffeeProjects", hi: 'Hi', body: "Thanks for telling us about your project. We'll get back to you within 24 hours with a first proposal.", sign: 'The coffeeProjects team' },
  fr: { subject: 'Nous avons bien reçu votre demande — coffeeProjects', hi: 'Bonjour', body: 'Merci de nous avoir présenté votre projet. Nous vous répondrons en moins de 24 heures avec une première proposition.', sign: "L'équipe coffeeProjects" },
} as const

export function clientEmail(i: ContactInput) {
  const c = copy[i.locale]
  return {
    subject: c.subject,
    html: `<p>${c.hi},</p><p>${c.body}</p><p>— ${c.sign}<br/><a href="https://coffeeprojects.es">coffeeprojects.es</a></p>`,
  }
}
