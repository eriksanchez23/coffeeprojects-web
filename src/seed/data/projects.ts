import type { SeedDoc } from '../types'

type ProjectShared = {
  stack: string[]
  year: number
  status: 'live' | 'in-progress'
  url?: string
  nda: boolean
  featured: boolean
  kind: 'new-website' | 'redesign' | 'store' | 'app' | 'other'
  /** Design proposal not (yet) delivered: shown with a "Design proposal" label, never as a client. */
  concept: boolean
}
type ProjectLocalized = {
  slug: string
  title: string
  category: string
  summary: string
  sector: string
  challenge?: string
  solution?: string
  /** Real, measured data only. */
  results: { value: string; label: string }[]
}

export const projects: SeedDoc<ProjectShared, ProjectLocalized>[] = [
  {
    shared: { stack: ['HTML', 'CSS', 'JavaScript'], year: 2025, status: 'live', nda: true, featured: true, kind: 'redesign', concept: false },
    localized: {
      es: {
        slug: 'portal-web-institucional',
        title: 'Portal web institucional',
        category: 'Web institucional',
        sector: 'Administración pública',
        summary: 'Rediseño y mejora de rendimiento de la web de un ayuntamiento: mayor accesibilidad, velocidad de carga y una navegación más clara.',
        challenge: 'La web era lenta, difícil de usar en el móvil y poco accesible, y los vecinos no encontraban la información que buscaban.',
        solution: 'Nueva estructura de navegación, diseño actual y accesible, optimización de imágenes y código, y adaptación completa a móvil.',
        results: [],
      },
      en: {
        slug: 'institutional-web-portal',
        title: 'Institutional web portal',
        category: 'Public sector website',
        sector: 'Public sector',
        summary: "Redesign and performance improvements for a town council's website: better accessibility, faster loading and clearer navigation.",
        challenge: 'The website was slow, hard to use on mobile and not very accessible, and residents could not find the information they needed.',
        solution: 'New navigation structure, a modern and accessible design, optimised images and code, and a fully mobile-ready layout.',
        results: [],
      },
      fr: {
        slug: 'portail-web-institutionnel',
        title: 'Portail web institutionnel',
        category: 'Site institutionnel',
        sector: 'Secteur public',
        summary: "Refonte et amélioration des performances du site d'une mairie : meilleure accessibilité, chargement plus rapide et navigation plus claire.",
        challenge: "Le site était lent, difficile à utiliser sur mobile et peu accessible, et les habitants ne trouvaient pas l'information.",
        solution: 'Nouvelle structure de navigation, design actuel et accessible, optimisation des images et du code, et adaptation complète au mobile.',
        results: [],
      },
    },
  },
  {
    shared: { stack: ['Next.js', 'Payload CMS', 'Tailwind CSS'], year: 2026, status: 'live', url: 'https://coffeeprojects.es', nda: false, featured: true, kind: 'new-website', concept: false },
    localized: {
      es: {
        slug: 'coffeeprojects-es',
        title: 'coffeeprojects.es',
        category: 'Web corporativa',
        sector: 'Servicios digitales',
        summary: 'Nuestra propia web, diseñada y desarrollada desde cero: trilingüe, con panel de gestión propio y SEO técnico.',
        challenge: 'Una web trilingüe, rápida y fácil de gestionar por todo el equipo, con formulario seguro y bandeja de solicitudes.',
        solution: 'Diseño a medida, panel de gestión en tres idiomas, formulario con protección antispam y respuestas desde el panel, SEO técnico y textos legales.',
        results: [
          { value: '100', label: 'Accesibilidad (Lighthouse móvil)' },
          { value: '100', label: 'Buenas prácticas (Lighthouse móvil)' },
          { value: '100', label: 'SEO (Lighthouse móvil)' },
        ],
      },
      en: {
        slug: 'coffeeprojects-es',
        title: 'coffeeprojects.es',
        category: 'Corporate website',
        sector: 'Digital services',
        summary: 'Our own website, designed and built from scratch: trilingual, with its own admin panel and technical SEO.',
        challenge: 'A trilingual, fast website the whole team can manage, with a secure contact form and a request inbox.',
        solution: 'Custom design, an admin panel in three languages, a spam-protected form with replies from the panel, technical SEO and legal pages.',
        results: [
          { value: '100', label: 'Accessibility (Lighthouse mobile)' },
          { value: '100', label: 'Best practices (Lighthouse mobile)' },
          { value: '100', label: 'SEO (Lighthouse mobile)' },
        ],
      },
      fr: {
        slug: 'coffeeprojects-es',
        title: 'coffeeprojects.es',
        category: "Site d'entreprise",
        sector: 'Services numériques',
        summary: "Notre propre site, conçu et développé de zéro : trilingue, avec son propre panneau d'administration et un SEO technique.",
        challenge: "Un site trilingue, rapide et facile à gérer par toute l'équipe, avec un formulaire sécurisé et une boîte de demandes.",
        solution: 'Design sur mesure, panneau en trois langues, formulaire protégé contre le spam avec réponses depuis le panneau, SEO technique et mentions légales.',
        results: [
          { value: '100', label: 'Accessibilité (Lighthouse mobile)' },
          { value: '100', label: 'Bonnes pratiques (Lighthouse mobile)' },
          { value: '100', label: 'SEO (Lighthouse mobile)' },
        ],
      },
    },
  },
  {
    shared: { stack: ['Next.js', 'Payload CMS', 'Tailwind CSS', 'GSAP'], year: 2026, status: 'live', url: 'https://noore-club-demo.vercel.app/', nda: false, featured: true, kind: 'new-website', concept: true },
    localized: {
      es: {
        slug: 'noore-club',
        title: 'Nooré Club',
        category: 'Web de ocio',
        sector: 'Ocio y hostelería · San Javier',
        summary: 'Web con reservas online para un lounge de cachimbas, cócteles y gofres en San Javier (Murcia), con panel propio para gestionar mesas, carta y eventos.',
        challenge: 'Transmitir la experiencia del local en pocos segundos y convertir las visitas que llegan desde Instagram y Google en reservas.',
        solution: 'Diseño a medida centrado en la imagen, carta y horarios fáciles de consultar, botón de contacto siempre visible y SEO local para San Javier y el Mar Menor.',
        results: [],
      },
      en: {
        slug: 'noore-club',
        title: 'Nooré Club',
        category: 'Leisure website',
        sector: 'Leisure and hospitality · San Javier',
        summary: 'Website with online table booking for a shisha, cocktail and waffle lounge in San Javier (Murcia), with its own panel to manage tables, menu and events.',
        challenge: 'Convey the experience of the venue in a few seconds and turn visits from Instagram and Google into bookings.',
        solution: 'Image-led custom design, menu and opening hours that are easy to check, an always-visible contact button and local SEO for San Javier and the Mar Menor.',
        results: [],
      },
      fr: {
        slug: 'noore-club',
        title: 'Nooré Club',
        category: 'Site de loisirs',
        sector: 'Loisirs et hôtellerie · San Javier',
        summary: 'Site avec réservation en ligne pour un lounge chicha, cocktails et gaufres à San Javier (Murcie), avec son propre panneau pour gérer tables, carte et événements.',
        challenge: "Transmettre l'expérience du lieu en quelques secondes et transformer les visites venues d'Instagram et de Google en réservations.",
        solution: 'Design sur mesure centré sur l’image, carte et horaires faciles à consulter, bouton de contact toujours visible et SEO local pour San Javier et la Mar Menor.',
        results: [],
      },
    },
  },
  {
    shared: { stack: ['Astro', 'Tailwind CSS', 'GSAP'], year: 2026, status: 'live', url: 'https://don-panini-prototipo.vercel.app/', nda: false, featured: true, kind: 'new-website', concept: true },
    localized: {
      es: {
        slug: 'don-panini',
        title: 'Don Panini',
        category: 'Web de restauración',
        sector: 'Restauración · Cartagena',
        summary: 'Web para un restaurante halal de kebab, paninis y tacos de Cartagena con dos locales: carta, mapa, horario con aviso de abierto/cerrado y pedido por Glovo o por teléfono.',
        challenge: 'Que el cliente encuentre en segundos la carta, el local más cercano y cómo pedir, sobre todo desde el móvil.',
        solution: 'Carta digital clara y apetecible, ficha de cada local con mapa y horario, acceso directo al pedido a domicilio y diseño pensado para el móvil.',
        results: [],
      },
      en: {
        slug: 'don-panini',
        title: 'Don Panini',
        category: 'Restaurant website',
        sector: 'Restaurants · Cartagena',
        summary: 'Website for a halal kebab, panini and taco restaurant in Cartagena with two locations: menu, map, opening hours with a live open/closed sign and ordering via Glovo or by phone.',
        challenge: 'Help customers find the menu, the nearest location and how to order in seconds, especially on mobile.',
        solution: 'A clear, appetising digital menu, a page per location with map and opening hours, direct access to delivery ordering and a mobile-first design.',
        results: [],
      },
      fr: {
        slug: 'don-panini',
        title: 'Don Panini',
        category: 'Site de restauration',
        sector: 'Restauration · Carthagène',
        summary: 'Site pour un restaurant halal de kebabs, paninis et tacos à Carthagène avec deux adresses : carte, plan, horaires avec indicateur ouvert/fermé et commande via Glovo ou par téléphone.',
        challenge: "Permettre au client de trouver en quelques secondes la carte, l'adresse la plus proche et comment commander, surtout sur mobile.",
        solution: 'Carte numérique claire et appétissante, fiche par adresse avec plan et horaires, accès direct à la livraison et design pensé pour le mobile.',
        results: [],
      },
    },
  },
  {
    shared: { stack: ['React', 'Node.js'], year: 2026, status: 'in-progress', nda: false, featured: false, kind: 'app', concept: false },
    localized: {
      es: { slug: 'que-comemos-hoy', title: '¿Qué comemos hoy?', category: 'Aplicación web', sector: 'Producto propio', summary: 'Aplicación web para gestionar y decidir el menú del día, con recetas, filtros por ingredientes y sugerencias aleatorias.', results: [] },
      en: { slug: 'what-should-we-eat-today', title: 'What should we eat today?', category: 'Web app', sector: 'Own product', summary: "A web app to plan and decide the day's menu, with recipes, ingredient filters and random suggestions.", results: [] },
      fr: { slug: 'on-mange-quoi-aujourd-hui', title: "On mange quoi aujourd'hui ?", category: 'Application web', sector: 'Produit maison', summary: 'Une application web pour organiser et choisir le menu du jour, avec recettes, filtres par ingrédients et suggestions aléatoires.', results: [] },
    },
  },
  {
    shared: { stack: ['React', 'Dashboard'], year: 2026, status: 'in-progress', nda: true, featured: false, kind: 'app', concept: false },
    localized: {
      es: { slug: 'trading-journal', title: 'Trading Journal', category: 'Dashboard privado', sector: 'Finanzas', summary: 'Plataforma privada de seguimiento de operaciones financieras: registro de operaciones, métricas de rendimiento y estadísticas visuales.', results: [] },
      en: { slug: 'trading-journal', title: 'Trading Journal', category: 'Private dashboard', sector: 'Finance', summary: 'Private platform to track financial trades: trade log, performance metrics and visual statistics.', results: [] },
      fr: { slug: 'trading-journal', title: 'Trading Journal', category: 'Tableau de bord privé', sector: 'Finance', summary: 'Plateforme privée de suivi des opérations financières : journal des opérations, indicateurs de performance et statistiques visuelles.', results: [] },
    },
  },
]
