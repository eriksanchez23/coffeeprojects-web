import type { SeedDoc } from '../types'

type Item = { title: string; text: string }
type HomeLocalized = {
  hero: { eyebrow: string; headline: string; subheadline: string; trustLine: string }
  whyUs: Item[]
  process: Item[]
  sections: {
    servicesTitle: string
    servicesLead: string
    whyTitle: string
    processTitle: string
    teamTitle: string
    teamLead: string
    projectsTitle: string
    projectsLead: string
    stackTitle: string
  }
  statLabels: string[]
}
type HomeShared = { stats: { value: number; prefix?: string; suffix?: string }[]; stack: string[] }

export const home: SeedDoc<HomeShared, HomeLocalized> = {
  shared: {
    stats: [{ value: 3 }, { value: 50, suffix: '+' }, { value: 24, prefix: '<', suffix: 'h' }, { value: 100, suffix: '%' }],
    stack: ['Next.js', 'React', 'Astro', 'TypeScript', 'Node.js', 'Payload CMS', 'Tailwind CSS', 'GSAP', 'Three.js', 'Python', 'Lua', 'FiveM', 'PostgreSQL', 'Stripe', 'Shopify', 'Vercel', 'C#', 'Java', 'Kotlin', 'Vue'],
  },
  localized: {
    es: {
      hero: {
        eyebrow: 'Estudio de desarrollo · España',
        headline: 'Sin café no hay código. Sin compromiso no hay proyecto.',
        subheadline:
          'Diseñamos y desarrollamos webs, tiendas online, bots y sistemas a medida para empresas y comunidades que quieren crecer. Un equipo, un único punto de contacto y una propuesta personalizada en menos de 24 horas.',
        trustLine: 'Respuesta en < 24h · Precio cerrado antes de empezar · Firmamos NDA',
      },
      statLabels: ['desarrolladores, un equipo', 'scripts FiveM publicados', 'tiempo de respuesta', 'proyectos con precio cerrado antes de empezar'],
      whyUs: [
        { title: 'Un único punto de contacto', text: 'Hablas siempre con la misma persona, desde la primera llamada hasta la entrega.' },
        { title: 'Precio cerrado', text: 'Recibes una propuesta con entregables, plazos y coste total antes de empezar. Sin sorpresas.' },
        { title: 'Avances cada semana', text: 'Revisiones semanales para que veas tu proyecto crecer y puedas opinar a tiempo.' },
        { title: 'El código es tuyo', text: 'Al completar el pago, todos los derechos del código a medida pasan a ti.' },
        { title: 'Confidencialidad', text: 'Firmamos NDA antes de recibir cualquier dato sensible.' },
        { title: 'No desaparecemos', text: 'Planes de mantenimiento mensual para que tu web siga rápida, segura y actualizada.' },
      ],
      process: [
        { title: 'Descubrimiento', text: 'Llamada de 30-45 minutos para entender tu negocio, objetivos y alcance.' },
        { title: 'Propuesta', text: 'Te enviamos entregables, plazo y precio cerrado. Tú decides.' },
        { title: 'Desarrollo', text: 'Con un adelanto del 30-50% arrancamos, con revisiones semanales.' },
        { title: 'QA y ajustes', text: 'Probamos en todos los dispositivos y pulimos cada detalle contigo.' },
        { title: 'Entrega', text: 'Publicamos, te formamos y, si quieres, seguimos cuidando tu proyecto.' },
      ],
      sections: {
        servicesTitle: 'Servicios de desarrollo a medida',
        servicesLead: 'Webs, tiendas online, bots, servidores FiveM y mantenimiento. Si tu necesidad no aparece, consúltanos sin compromiso.',
        whyTitle: 'Por qué trabajar con nosotros',
        processTitle: 'Así trabajamos',
        teamTitle: 'Tres desarrolladores, un equipo',
        teamLead: 'Trabajamos en remoto desde España, coordinados en tiempo real, con revisiones cruzadas de código y un único punto de contacto para ti.',
        projectsTitle: 'Trabajo real, resultados concretos',
        projectsLead: 'Una selección de proyectos entregados y en curso. Algunos están bajo NDA, así que no mostramos enlaces ni detalles comerciales.',
        stackTitle: 'Stack amplio, profundidad donde importa',
      },
    },
    en: {
      hero: {
        eyebrow: 'Development studio · Spain',
        headline: 'No coffee, no code. No commitment, no project.',
        subheadline:
          'We design and build websites, online stores, bots and custom systems for businesses and communities that want to grow. One team, a single point of contact and a tailored proposal in under 24 hours.',
        trustLine: 'Reply in < 24h · Fixed price before we start · NDA on request',
      },
      statLabels: ['developers, one team', 'published FiveM scripts', 'response time', 'projects with a fixed price before starting'],
      whyUs: [
        { title: 'A single point of contact', text: 'You always talk to the same person, from the first call to delivery.' },
        { title: 'Fixed price', text: 'You get a proposal with deliverables, timeline and total cost before we start. No surprises.' },
        { title: 'Progress every week', text: 'Weekly reviews so you see your project grow and can give feedback in time.' },
        { title: 'The code is yours', text: 'Once paid in full, all rights to the custom code are transferred to you.' },
        { title: 'Confidentiality', text: 'We sign an NDA before receiving any sensitive information.' },
        { title: "We don't disappear", text: 'Monthly maintenance plans keep your website fast, secure and up to date.' },
      ],
      process: [
        { title: 'Discovery', text: 'A 30-45 minute call to understand your business, goals and scope.' },
        { title: 'Proposal', text: 'We send you deliverables, timeline and a fixed price. You decide.' },
        { title: 'Development', text: 'With a 30-50% deposit we get started, with weekly reviews.' },
        { title: 'QA & polish', text: 'We test on every device and refine every detail with you.' },
        { title: 'Delivery', text: 'We launch, train you and, if you want, keep looking after your project.' },
      ],
      sections: {
        servicesTitle: 'Custom development services',
        servicesLead: "Websites, online stores, bots, FiveM servers and maintenance. If what you need isn't listed, just ask.",
        whyTitle: 'Why work with us',
        processTitle: 'How we work',
        teamTitle: 'Three developers, one team',
        teamLead: 'We work remotely from Spain, coordinated in real time, with cross code reviews and a single point of contact for you.',
        projectsTitle: 'Real work, concrete results',
        projectsLead: "A selection of delivered and ongoing projects. Some are under NDA, so we don't show links or commercial details.",
        stackTitle: 'Broad stack, depth where it matters',
      },
    },
    fr: {
      hero: {
        eyebrow: 'Studio de développement · Espagne',
        headline: "Pas de café, pas de code. Pas d'engagement, pas de projet.",
        subheadline:
          'Nous concevons et développons des sites web, des boutiques en ligne, des bots et des systèmes sur mesure pour les entreprises et les communautés qui veulent grandir. Une équipe, un interlocuteur unique et une proposition personnalisée en moins de 24 heures.',
        trustLine: 'Réponse en < 24 h · Prix fixe avant de commencer · NDA sur demande',
      },
      statLabels: ['développeurs, une équipe', 'scripts FiveM publiés', 'délai de réponse', 'projets à prix fixe avant de commencer'],
      whyUs: [
        { title: 'Un interlocuteur unique', text: "Vous parlez toujours à la même personne, du premier appel jusqu'à la livraison." },
        { title: 'Prix fixe', text: 'Vous recevez une proposition avec livrables, délais et coût total avant de commencer. Sans surprise.' },
        { title: 'Des avancées chaque semaine', text: 'Des revues hebdomadaires pour voir votre projet avancer et donner votre avis à temps.' },
        { title: 'Le code vous appartient', text: 'Une fois le paiement effectué, tous les droits sur le code sur mesure vous sont cédés.' },
        { title: 'Confidentialité', text: 'Nous signons un NDA avant de recevoir la moindre information sensible.' },
        { title: 'Nous restons là', text: 'Des formules de maintenance mensuelle pour garder votre site rapide, sûr et à jour.' },
      ],
      process: [
        { title: 'Découverte', text: 'Un appel de 30 à 45 minutes pour comprendre votre activité, vos objectifs et le périmètre.' },
        { title: 'Proposition', text: 'Nous vous envoyons livrables, délai et prix fixe. Vous décidez.' },
        { title: 'Développement', text: 'Avec un acompte de 30 à 50 %, nous démarrons, avec des revues chaque semaine.' },
        { title: 'Tests et finitions', text: 'Nous testons sur tous les appareils et peaufinons chaque détail avec vous.' },
        { title: 'Livraison', text: 'Nous mettons en ligne, vous formons et, si vous le souhaitez, continuons à prendre soin de votre projet.' },
      ],
      sections: {
        servicesTitle: 'Services de développement sur mesure',
        servicesLead: "Sites web, boutiques en ligne, bots, serveurs FiveM et maintenance. Si votre besoin n'apparaît pas, contactez-nous sans engagement.",
        whyTitle: 'Pourquoi travailler avec nous',
        processTitle: 'Notre façon de travailler',
        teamTitle: 'Trois développeurs, une équipe',
        teamLead: 'Nous travaillons à distance depuis l’Espagne, coordonnés en temps réel, avec des revues de code croisées et un interlocuteur unique pour vous.',
        projectsTitle: 'Du travail réel, des résultats concrets',
        projectsLead: 'Une sélection de projets livrés et en cours. Certains sont sous NDA : nous ne montrons donc ni liens ni détails commerciaux.',
        stackTitle: 'Une stack large, de la profondeur là où ça compte',
      },
    },
  },
}

/** Shapes the seed record into the `home` global data for one locale. */
export function homeData(locale: keyof typeof home.localized) {
  const l = home.localized[locale]
  return {
    hero: l.hero,
    whyUs: l.whyUs,
    process: l.process,
    sections: l.sections,
  }
}
