import type { SeedDoc } from '../types'

type Item = { title: string; text: string }
type Paths = {
  title: string
  newTitle: string
  newText: string
  newPoints: { text: string }[]
  newPrice: string
  redesignTitle: string
  redesignText: string
  redesignPoints: { text: string }[]
  redesignPrice: string
}
type Audit = { eyebrow: string; title: string; lead: string; symptoms: { text: string }[]; offerTitle: string; offerText: string }
type HomeLocalized = {
  hero: { eyebrow: string; headline: string; subheadline: string; trustLine: string }
  paths: Paths
  audit: Audit
  guarantees: Item[]
  sectorsLine: string
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
        eyebrow: 'CoffeeProjects · Estudio de diseño y desarrollo web en España',
        headline: 'Webs profesionales que *consiguen clientes*.',
        subheadline:
          'Diseñamos webs nuevas y renovamos las que se han quedado atrás. Rápidas, cuidadas al detalle y pensadas para que te contacten. Precio cerrado antes de empezar.',
        trustLine: 'Respuesta en menos de 24 h · Precio cerrado · El código es tuyo',
      },
      paths: {
        title: '¿Empezamos de cero o mejoramos lo que tienes?',
        newTitle: 'Quiero una web nueva',
        newText: 'Para negocios que aún no tienen web o necesitan empezar de cero. Te entregamos una web lista para captar clientes, con tu dominio, adaptada al móvil y preparada para Google.',
        newPoints: [
          { text: 'Landing page o web corporativa' },
          { text: 'Diseño a medida, nada de plantillas genéricas' },
          { text: 'SEO básico y velocidad de carga' },
          { text: 'Textos legales incluidos' },
        ],
        newPrice: 'Desde 349 € + IVA · 1-2 semanas',
        redesignTitle: 'Quiero mejorar mi web',
        redesignText: 'Para quien ya tiene web pero no le da resultados. Analizamos qué falla y la renovamos: diseño actual, carga rápida, bien en el móvil y visible en Google.',
        redesignPoints: [
          { text: 'Revisión gratuita de tu web actual' },
          { text: 'Rediseño completo o mejoras por partes' },
          { text: 'Migración sin perder tu posicionamiento' },
          { text: 'Podrás editarla tú mismo' },
        ],
        redesignPrice: 'Presupuesto cerrado tras la revisión gratuita',
      },
      audit: {
        eyebrow: 'Revisión gratuita',
        title: '¿Tu web te está costando clientes?',
        lead: 'Si te reconoces en alguno de estos puntos, tu web está perdiendo visitas que podrían ser clientes.',
        symptoms: [
          { text: 'Tarda más de 3 segundos en cargar.' },
          { text: 'En el móvil se ve mal o hay que hacer zoom.' },
          { text: 'No apareces en Google cuando te buscan.' },
          { text: 'El diseño se ha quedado anticuado.' },
          { text: 'Para cambiar un texto tienes que llamar a alguien.' },
          { text: 'Recibes visitas, pero nadie te contacta.' },
        ],
        offerTitle: 'Te la revisamos gratis',
        offerText: 'Déjanos la dirección de tu web y en un máximo de 48 h te enviamos un informe breve con lo que falla y cómo arreglarlo. Sin compromiso.',
      },
      guarantees: [
        { title: 'Precio cerrado', text: 'Sabes lo que pagas antes de empezar.' },
        { title: 'Un solo interlocutor', text: 'Hablas siempre con la misma persona.' },
        { title: 'Avances cada semana', text: 'Ves tu web crecer y opinas a tiempo.' },
        { title: 'El código es tuyo', text: 'Sin ataduras ni permanencias ocultas.' },
      ],
      sectorsLine: 'Hemos trabajado para el sector público, ocio y hostelería, y restauración.',
      statLabels: ['desarrolladores, un equipo', 'scripts FiveM publicados', 'tiempo de respuesta', 'proyectos con precio cerrado antes de empezar'],
      whyUs: [
        { title: 'Un único punto de contacto', text: 'Hablas siempre con la misma persona, desde la primera llamada hasta la entrega.' },
        { title: 'Precio cerrado', text: 'Recibes una propuesta con entregables, plazos y coste total antes de empezar. Sin sorpresas.' },
        { title: 'Avances cada semana', text: 'Revisiones semanales para que veas tu proyecto crecer y puedas opinar a tiempo.' },
        { title: 'El código es tuyo', text: 'Al completar el pago, todos los derechos de tu web pasan a ti.' },
        { title: 'Confidencialidad', text: 'Firmamos un acuerdo de confidencialidad (NDA) si tu proyecto lo necesita.' },
        { title: 'No desaparecemos', text: 'Planes de mantenimiento mensual para que tu web siga rápida, segura y actualizada.' },
      ],
      process: [
        { title: 'Hablamos', text: 'Una llamada de 30-45 minutos para entender tu negocio, tus clientes y lo que necesitas de tu web.' },
        { title: 'Propuesta cerrada', text: 'Te enviamos qué incluye, el plazo y el precio total. Sin letra pequeña. Tú decides.' },
        { title: 'Diseño y desarrollo', text: 'Con un adelanto del 30-50 % arrancamos. Cada semana ves los avances y nos das tu opinión.' },
        { title: 'Pruebas y ajustes', text: 'Revisamos la web en ordenador, tablet y móvil y pulimos cada detalle contigo.' },
        { title: 'Publicación', text: 'La ponemos en marcha, te enseñamos a gestionarla y, si quieres, seguimos cuidándola.' },
      ],
      sections: {
        servicesTitle: 'Servicios de diseño y desarrollo web',
        servicesLead: 'Todo lo que necesitas para tener una web que funcione: desde crearla de cero hasta renovarla y mantenerla.',
        whyTitle: 'Lo que nos piden nuestros clientes, por escrito',
        processTitle: 'De la primera llamada a tu web publicada',
        teamTitle: 'Un equipo pequeño, un trabajo cuidado',
        teamLead: 'Somos un estudio de desarrollo web de España. Trabajamos en remoto, coordinados cada día, con revisiones cruzadas y un único interlocutor para ti. Preferimos pocos proyectos bien hechos a muchos a medias.',
        projectsTitle: 'Trabajo real, resultados concretos',
        projectsLead: 'Una selección de webs que hemos diseñado, desarrollado o renovado.',
        stackTitle: 'Stack amplio, profundidad donde importa',
      },
    },
    en: {
      hero: {
        eyebrow: 'CoffeeProjects · Web design and development studio in Spain',
        headline: 'Professional websites that *win customers*.',
        subheadline:
          'We design new websites and renew the ones that have fallen behind. Fast, carefully crafted and built so people get in touch. Fixed price before we start.',
        trustLine: 'Reply within 24 h · Fixed price · The code is yours',
      },
      paths: {
        title: 'Start from scratch or improve what you have?',
        newTitle: 'I want a new website',
        newText: "For businesses that don't have a website yet or need to start over. We deliver a website ready to win customers, on your domain, mobile-ready and prepared for Google.",
        newPoints: [
          { text: 'Landing page or business website' },
          { text: 'Custom design, no generic templates' },
          { text: 'Basic SEO and fast loading' },
          { text: 'Legal pages included' },
        ],
        newPrice: 'From €349 + VAT · 1-2 weeks',
        redesignTitle: 'I want to improve my website',
        redesignText: "For those who already have a website that isn't delivering. We find what's wrong and renew it: modern design, fast loading, great on mobile and visible on Google.",
        redesignPoints: [
          { text: 'Free review of your current website' },
          { text: 'Full redesign or step-by-step improvements' },
          { text: 'Migration without losing your ranking' },
          { text: 'You can edit it yourself' },
        ],
        redesignPrice: 'Fixed quote after the free review',
      },
      audit: {
        eyebrow: 'Free review',
        title: 'Is your website costing you customers?',
        lead: 'If any of these sound familiar, your website is losing visitors who could be customers.',
        symptoms: [
          { text: 'It takes more than 3 seconds to load.' },
          { text: 'On mobile it looks wrong or needs zooming.' },
          { text: "You don't show up on Google when people search for you." },
          { text: 'The design looks outdated.' },
          { text: 'You have to call someone to change a line of text.' },
          { text: 'You get visits, but nobody gets in touch.' },
        ],
        offerTitle: "We'll review it for free",
        offerText: "Leave us your website address and within 48 h we'll send you a short report with what's wrong and how to fix it. No commitment.",
      },
      guarantees: [
        { title: 'Fixed price', text: 'You know what you pay before we start.' },
        { title: 'One point of contact', text: 'You always talk to the same person.' },
        { title: 'Progress every week', text: 'See your website grow and give feedback in time.' },
        { title: 'The code is yours', text: 'No lock-in, no hidden commitments.' },
      ],
      sectorsLine: "We've worked for the public sector, leisure and hospitality, and restaurants.",
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
        servicesTitle: 'Web design and development services',
        servicesLead: 'Everything you need for a website that works: from building it from scratch to renewing and maintaining it.',
        whyTitle: 'What our clients ask for, in writing',
        processTitle: 'From the first call to your published website',
        teamTitle: 'A small team, careful work',
        teamLead: 'We are a web development studio in Spain. We work remotely, coordinated every day, with cross reviews and a single point of contact for you. We prefer a few projects done well to many done halfway.',
        projectsTitle: 'Real work, concrete results',
        projectsLead: 'A selection of websites we have designed, built or renewed.',
        stackTitle: 'Broad stack, depth where it matters',
      },
    },
    fr: {
      hero: {
        eyebrow: 'CoffeeProjects · Studio de design et développement web en Espagne',
        headline: 'Des sites professionnels qui *gagnent des clients*.',
        subheadline:
          'Nous créons des sites neufs et rénovons ceux qui ont pris du retard. Rapides, soignés dans le détail et pensés pour qu’on vous contacte. Prix fixe avant de commencer.',
        trustLine: 'Réponse sous 24 h · Prix fixe · Le code vous appartient',
      },
      paths: {
        title: 'Repartir de zéro ou améliorer votre site ?',
        newTitle: 'Je veux un nouveau site',
        newText: "Pour les entreprises qui n'ont pas encore de site ou doivent repartir de zéro. Nous livrons un site prêt à gagner des clients, sur votre domaine, adapté au mobile et prêt pour Google.",
        newPoints: [
          { text: 'Landing page ou site vitrine' },
          { text: 'Design sur mesure, sans modèle générique' },
          { text: 'SEO de base et chargement rapide' },
          { text: 'Mentions légales incluses' },
        ],
        newPrice: 'À partir de 349 € + TVA · 1 à 2 semaines',
        redesignTitle: 'Je veux améliorer mon site',
        redesignText: "Pour ceux qui ont déjà un site qui ne donne pas de résultats. Nous trouvons ce qui ne va pas et le rénovons : design actuel, chargement rapide, parfait sur mobile et visible sur Google.",
        redesignPoints: [
          { text: 'Audit gratuit de votre site actuel' },
          { text: 'Refonte complète ou améliorations par étapes' },
          { text: 'Migration sans perdre votre référencement' },
          { text: 'Vous pourrez le modifier vous-même' },
        ],
        redesignPrice: "Devis fixe après l'audit gratuit",
      },
      audit: {
        eyebrow: 'Audit gratuit',
        title: 'Votre site vous fait-il perdre des clients ?',
        lead: 'Si vous vous reconnaissez dans l’un de ces points, votre site perd des visiteurs qui pourraient devenir clients.',
        symptoms: [
          { text: 'Il met plus de 3 secondes à charger.' },
          { text: 'Sur mobile, il s’affiche mal ou il faut zoomer.' },
          { text: 'Vous n’apparaissez pas sur Google quand on vous cherche.' },
          { text: 'Le design est dépassé.' },
          { text: 'Pour changer un texte, vous devez appeler quelqu’un.' },
          { text: 'Vous avez des visites, mais personne ne vous contacte.' },
        ],
        offerTitle: 'Nous l’auditons gratuitement',
        offerText: 'Laissez-nous l’adresse de votre site et sous 48 h nous vous envoyons un court rapport avec ce qui ne va pas et comment le corriger. Sans engagement.',
      },
      guarantees: [
        { title: 'Prix fixe', text: 'Vous savez ce que vous payez avant de commencer.' },
        { title: 'Un seul interlocuteur', text: 'Vous parlez toujours à la même personne.' },
        { title: 'Des avancées chaque semaine', text: 'Vous voyez votre site avancer et donnez votre avis à temps.' },
        { title: 'Le code vous appartient', text: 'Aucune dépendance, aucun engagement caché.' },
      ],
      sectorsLine: 'Nous avons travaillé pour le secteur public, les loisirs et l’hôtellerie, et la restauration.',
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
        servicesTitle: 'Services de design et développement web',
        servicesLead: 'Tout ce qu’il faut pour un site qui fonctionne : de la création à la refonte et à la maintenance.',
        whyTitle: 'Ce que nos clients demandent, par écrit',
        processTitle: 'Du premier appel à votre site en ligne',
        teamTitle: 'Une petite équipe, un travail soigné',
        teamLead: 'Nous sommes un studio de développement web en Espagne. Nous travaillons à distance, coordonnés chaque jour, avec des revues croisées et un interlocuteur unique pour vous. Nous préférons peu de projets bien faits à beaucoup à moitié.',
        projectsTitle: 'Du travail réel, des résultats concrets',
        projectsLead: 'Une sélection de sites que nous avons conçus, développés ou rénovés.',
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
    paths: l.paths,
    audit: l.audit,
    guarantees: l.guarantees,
    sectorsLine: l.sectorsLine,
    whyUs: l.whyUs,
    process: l.process,
    sections: l.sections,
  }
}
