import type { Locale } from '@/i18n/locales'

/** Client-facing copy, one entry per site locale. Subjects are part of the contract (replies thread on them). */
export type ClientCopy = {
  subject: string
  hi: string
  accent: string
  terminalCommand: string
  terminalOk: string
  intro: [before: string, strong: string, after: string]
  summaryTitle: string
  projectLabel: string
  planLabel: string
  quoteFallbackLabel: string
  stepsTitle: string
  steps: [strong: string, rest: string][]
  cta: string
  hint: string
  privacyLabel: string
  sign: string
  /** Plain-text only. */
  replyHintText: string
  /** Same as the site footer (`footer.tagline` in messages/*.json). */
  tagline: string
  projectTypes: Record<string, string>
}

export const clientCopy: Record<Locale, ClientCopy> = {
  es: {
    subject: 'Hemos recibido tu solicitud — CoffeeProjects',
    hi: 'Hola',
    accent: 'Ya estamos con tu proyecto.',
    terminalCommand: 'solicitud --estado',
    terminalOk: 'recibida',
    intro: ['Gracias por contarnos tu idea. Hemos recibido tu solicitud y ', 'en menos de 24 horas', ' te escribiremos con una primera propuesta.'],
    summaryTitle: 'Resumen de tu solicitud',
    projectLabel: 'Proyecto',
    planLabel: 'Plan',
    quoteFallbackLabel: 'Precio y plazo',
    stepsTitle: 'Qué pasa ahora',
    steps: [
      ['Revisamos tu idea', ' y vemos cómo encaja.'],
      ['Te enviamos una propuesta', ' clara, con precio y plazos.'],
      ['Empezamos a construir', ' en cuanto nos des luz verde.'],
    ],
    cta: 'Mientras tanto, mira nuestros proyectos',
    hint: '¿Algo más que contarnos? Responde a este correo y le llega directamente al equipo.',
    privacyLabel: 'Privacidad',
    sign: 'El equipo de CoffeeProjects',
    replyHintText: 'Responde a este correo y le llega directamente al equipo.',
    tagline: 'Sin café no hay código. Sin compromiso no hay proyecto.',
    projectTypes: {
      web: 'Web / landing page',
      ecommerce: 'Tienda online',
      'fivem-script': 'Script FiveM',
      'fivem-server': 'Servidor FiveM',
      'discord-bot': 'Bot de Discord',
      maintenance: 'Mantenimiento web',
      custom: 'Desarrollo a medida',
      redesign: 'Mejorar mi web actual',
      audit: 'Revisión gratuita de mi web',
    },
  },
  en: {
    subject: "We've received your request — CoffeeProjects",
    hi: 'Hi',
    accent: "We're on your project.",
    terminalCommand: 'request --status',
    terminalOk: 'received',
    intro: ["Thanks for telling us about your idea. We've received your request and we'll write to you ", 'within 24 hours', ' with a first proposal.'],
    summaryTitle: 'Your request summary',
    projectLabel: 'Project',
    planLabel: 'Plan',
    quoteFallbackLabel: 'Price and timing',
    stepsTitle: 'What happens next',
    steps: [
      ['We review your idea', ' and see how it fits.'],
      ['We send you a proposal', ' that is clear, with price and timing.'],
      ['We start building', ' as soon as you give us the green light.'],
    ],
    cta: 'Meanwhile, take a look at our projects',
    hint: 'Anything else to tell us? Reply to this email and it goes straight to the team.',
    privacyLabel: 'Privacy',
    sign: 'The CoffeeProjects team',
    replyHintText: 'Reply to this email and it goes straight to the team.',
    tagline: 'No coffee, no code. No commitment, no project.',
    projectTypes: {
      web: 'Website / landing page',
      ecommerce: 'Online store',
      'fivem-script': 'FiveM script',
      'fivem-server': 'FiveM server',
      'discord-bot': 'Discord bot',
      maintenance: 'Website maintenance',
      custom: 'Custom development',
      redesign: 'Improve my current website',
      audit: 'Free review of my website',
    },
  },
  fr: {
    subject: 'Nous avons bien reçu votre demande — CoffeeProjects',
    hi: 'Bonjour',
    accent: 'Nous sommes sur votre projet.',
    terminalCommand: 'demande --statut',
    terminalOk: 'reçue',
    intro: ["Merci de nous avoir présenté votre idée. Nous avons bien reçu votre demande et nous vous écrirons ", 'en moins de 24 heures', ' avec une première proposition.'],
    summaryTitle: 'Récapitulatif de votre demande',
    projectLabel: 'Projet',
    planLabel: 'Formule',
    quoteFallbackLabel: 'Prix et délai',
    stepsTitle: 'Et maintenant ?',
    steps: [
      ['Nous étudions votre idée', ' et voyons comment elle s’intègre.'],
      ['Nous vous envoyons une proposition', ' claire, avec prix et délais.'],
      ['Nous commençons à construire', ' dès que vous nous donnez le feu vert.'],
    ],
    cta: 'En attendant, découvrez nos projets',
    hint: 'Autre chose à nous dire ? Répondez à cet email, il arrive directement à l’équipe.',
    privacyLabel: 'Confidentialité',
    sign: 'L’équipe CoffeeProjects',
    replyHintText: 'Répondez à cet email, il arrive directement à l’équipe.',
    tagline: "Pas de café, pas de code. Pas d'engagement, pas de projet.",
    projectTypes: {
      web: 'Site web / landing page',
      ecommerce: 'Boutique en ligne',
      'fivem-script': 'Script FiveM',
      'fivem-server': 'Serveur FiveM',
      'discord-bot': 'Bot Discord',
      maintenance: 'Maintenance de site',
      custom: 'Développement sur mesure',
      redesign: 'Améliorer mon site actuel',
      audit: 'Audit gratuit de mon site',
    },
  },
}

export const clientLocale = (l: string | null | undefined): Locale => (l === 'en' || l === 'fr' ? l : 'es')
