import type { Locale } from '@/i18n/locales'
import type { SeedDoc } from '../types'

// Source of truth: docs/sources/propuesta-tarifas-web-v4.txt (Tarifas v4, client-facing pages 3–7 and 9).
// Spanish is transcribed from the source; EN/FR are translations made for the site. Prices are EUR, VAT excluded.
// Not published (internal): p.2 v3→v4 changes, p.8 costs/market, p.10 decisions/sources, legal note on permanence.
type Item = { text: string; excluded?: boolean }
type Note = { title: string; text: string }

type WebPlanShared = {
  slug: string
  priceWithMaintenance: number
  priceWebOnly: number
  fromPrice: boolean
  minPlan: string
  contactType: 'web' | 'ecommerce' | 'custom'
  featured: boolean
  isNew: boolean
}
type WebPlanLocalized = { name: string; pitch: string; itemsLead?: string; items: Item[]; ctaLabel: string }
type MaintenanceShared = { slug: string; monthlyPrice: number; permanenceMonths: number; featured: boolean }
type MaintenanceLocalized = { name: string; pitch: string; items: Item[]; ctaLabel: string }
/** An extras cell is an amount (shared) or, when null, the localized text of the same column. */
type ExtraShared = { withPlan: number | null; withoutPlan: number | null }
type ExtraLocalized = { service: string; withPlanText?: string; withoutPlanText?: string }

type PricingShared = {
  packages: WebPlanShared[]
  maintenancePlans: MaintenanceShared[]
  customSupport: { fromPrice: number; permanenceMonths: number }
  extras: ExtraShared[]
}
type PricingLocalized = {
  eyebrow: string
  title: string
  subtitle: string
  intro: string
  vatNote: string
  footnote: string
  webTitle: string
  webIntro: string
  packages: WebPlanLocalized[]
  webNotes: Note[]
  maintenanceTitle: string
  maintenanceIntro: string
  maintenancePlans: MaintenanceLocalized[]
  customSupport: { title: string; text: string }
  changeNotes: Note[]
  comparison: { title: string; intro: string; rows: { label: string; withPlan: string; webOnly: string }[] }
  permanenceRules: Note[]
  extras: { title: string; intro: string; rows: ExtraLocalized[] }
  seo: { title: string; description: string }
}

const ok = (...texts: string[]): Item[] => texts.map((text) => ({ text }))
const no = (text: string): Item => ({ text, excluded: true })

export const pricing: SeedDoc<PricingShared, PricingLocalized> = {
  shared: {
    packages: [
      { slug: 'landing-page', priceWithMaintenance: 349, priceWebOnly: 590, fromPrice: false, minPlan: 'esencial', contactType: 'web', featured: false, isNew: false },
      { slug: 'landing-premium', priceWithMaintenance: 590, priceWebOnly: 890, fromPrice: false, minPlan: 'esencial', contactType: 'web', featured: false, isNew: true },
      { slug: 'custom', priceWithMaintenance: 490, priceWebOnly: 790, fromPrice: true, minPlan: 'plus', contactType: 'custom', featured: false, isNew: false },
      { slug: 'web-corporativa', priceWithMaintenance: 890, priceWebOnly: 1390, fromPrice: false, minPlan: 'esencial', contactType: 'web', featured: false, isNew: false },
      { slug: 'tienda-online', priceWithMaintenance: 1490, priceWebOnly: 2190, fromPrice: false, minPlan: 'plus', contactType: 'ecommerce', featured: true, isNew: false },
      { slug: 'web-profesional', priceWithMaintenance: 1790, priceWebOnly: 2590, fromPrice: true, minPlan: 'pro', contactType: 'web', featured: false, isNew: false },
    ],
    maintenancePlans: [
      { slug: 'esencial', monthlyPrice: 25, permanenceMonths: 24, featured: false },
      { slug: 'plus', monthlyPrice: 45, permanenceMonths: 24, featured: true },
      { slug: 'pro', monthlyPrice: 79, permanenceMonths: 12, featured: false },
    ],
    customSupport: { fromPrice: 139, permanenceMonths: 12 },
    extras: [
      { withPlan: null, withoutPlan: 35 },
      { withPlan: 45, withoutPlan: 90 },
      { withPlan: 75, withoutPlan: 150 },
      { withPlan: 45, withoutPlan: 90 },
      { withPlan: 180, withoutPlan: 320 },
      { withPlan: 30, withoutPlan: 50 },
      { withPlan: 150, withoutPlan: 220 },
      { withPlan: null, withoutPlan: 90 },
      { withPlan: null, withoutPlan: 150 },
      { withPlan: null, withoutPlan: 290 },
      { withPlan: null, withoutPlan: null },
    ],
  },
  localized: {
    es: {
      eyebrow: '// presupuestos',
      title: 'Tarifas web',
      subtitle: 'Precios cerrados y límites claros, en dos pasos',
      intro: 'Elige primero tu web y, si quieres, después un plan de mantenimiento: con cualquier plan la web sale más barata.',
      vatNote: '+ IVA',
      footnote: 'Todos los precios se muestran sin IVA, que se aplicará según la normativa vigente.',
      webTitle: '1. Elige tu web',
      webIntro:
        'Pago único. Todas incluyen diseño responsive, SSL, textos legales, 2 rondas de revisiones y 30 días de garantía de corrección de fallos.',
      packages: [
        {
          name: 'Landing Page',
          pitch: 'Producto de entrada: estar en Google y recibir contactos.',
          items: ok(
            'Una página con hasta 5 secciones',
            'Formulario de contacto + botón de WhatsApp',
            'SEO básico on-page',
            'Alta de 1 ficha de Google Business Profile',
          ),
          ctaLabel: 'Solicitar este plan',
        },
        {
          name: 'Landing Premium',
          pitch: 'Para restaurantes, tiendas físicas y negocios con varios locales.',
          items: ok(
            'Una página con hasta 10 secciones',
            'Vídeo de cabecera y galería de fotos',
            'Hasta 2 locales con mapa, horarios y contacto',
            'Diseño a medida con animaciones',
            'SEO básico + hasta 2 fichas de Google Business',
          ),
          ctaLabel: 'Solicitar este plan',
        },
        {
          name: 'Custom',
          pitch: 'Plan personalizado, por ejemplo una landing con panel de control privado.',
          items: ok(
            'Base de Landing Page (hasta 5 secciones)',
            'Panel de control privado',
            'Funciones a medida, presupuestadas aparte',
            'SEO básico + 1 ficha de Google Business',
          ),
          ctaLabel: 'Solicitar este plan',
        },
        {
          name: 'Web Corporativa',
          pitch: 'La web de empresa para atraer clientes y transmitir confianza.',
          items: ok(
            'Hasta 6 páginas (inicio, servicios, nosotros…)',
            'Blog activado y listo para publicar',
            'SEO local on-page + Analytics y Search Console',
            'Mapa, reseñas de Google y formularios',
          ),
          ctaLabel: 'Solicitar este plan',
        },
        {
          name: 'Tienda Online',
          pitch: 'Para vender por internet, desde pocos productos hasta catálogos grandes.',
          items: ok(
            'Todo lo de la Web Corporativa',
            'Catálogo sin límite de productos',
            'Carga de hasta 30 productos incluida (con variantes)',
            'Panel de control privado',
            'Pagos con tarjeta, Bizum y PayPal · envíos',
            '1 idioma adicional incluido',
          ),
          ctaLabel: 'Solicitar este plan',
        },
        {
          name: 'Web Profesional',
          pitch: 'A medida con funciones avanzadas. Precio final tras reunión.',
          itemsLead: 'El precio base incluye exactamente:',
          items: ok(
            'Hasta 6 páginas',
            'Panel de control privado con acceso de usuarios',
            'Sistema de reservas o citas online',
            '1 automatización a WhatsApp (ej. aviso de nueva reserva)',
            '1 integración (calendario o CRM)',
            '1 idioma adicional incluido',
          ),
          ctaLabel: 'Solicitar este plan',
        },
      ],
      webNotes: [
        {
          title: 'Forma de pago',
          text: 'Con mantenimiento: 50 % al aceptar y 50 % a la entrega. Solo la web: 100 % por adelantado en la Landing Page; 50 / 50 en el resto.',
        },
        {
          title: '«Solo la web»',
          text: 'Incluye la instalación en el hosting que contrate el cliente y la configuración de su dominio. Después, cambios y arreglos se cobran con la tarifa «sin plan».',
        },
        {
          title: 'Funciones extra en la Web Profesional',
          text: 'Cualquier función por encima de la base (más automatizaciones, más integraciones, pasarelas especiales, áreas de usuario complejas) se presupuesta por escrito antes de empezar. Así el «desde» nunca se convierte en una sorpresa.',
        },
      ],
      maintenanceTitle: '2. Elige tu mantenimiento (opcional)',
      maintenanceIntro:
        'Opcional, pero con cualquier plan la web sale más barata. Todos incluyen hosting, dominio, SSL, actualizaciones de seguridad y copias de seguridad.',
      maintenancePlans: [
        {
          name: 'Esencial',
          pitch: 'Web siempre online y segura.',
          items: [
            ...ok(
              'Hosting, dominio y SSL',
              'Actualizaciones de seguridad',
              'Copia de seguridad semanal',
              '2 cambios al mes',
              'Soporte por email · 72 h laborables',
            ),
            no('Sin correo profesional'),
          ],
          ctaLabel: 'Quiero este plan',
        },
        {
          name: 'Plus',
          pitch: 'Para negocios que actualizan a menudo.',
          items: ok(
            'Todo lo de Esencial',
            'Copia diaria + vigilancia 24/7',
            '6 cambios al mes',
            '2 cuentas de correo profesional',
            'Respuesta en 48 h',
            'Informe trimestral',
          ),
          ctaLabel: 'Quiero este plan',
        },
        {
          name: 'Pro',
          pitch: 'Para tiendas y webs de venta.',
          items: ok(
            'Todo lo de Plus',
            '12 cambios al mes, incluidos pequeños ajustes de diseño',
            'Actualización de tienda con pruebas',
            'SEO mensual: 1 mejora + informe',
            '5 cuentas de correo',
            'WhatsApp · respuesta en 24 h',
          ),
          ctaLabel: 'Quiero este plan',
        },
      ],
      customSupport: {
        title: 'Soporte a medida',
        text: 'Para clientes que necesitan mejoras continuas, reunión mensual, SEO con contenido o mantenimiento de automatizaciones complejas, se hace un presupuesto con lo que incluye exactamente.',
      },
      changeNotes: [
        {
          title: '¿Qué cuenta como un cambio?',
          text: 'Una petición concreta sobre algo que ya existe: un texto, una foto, un precio, un horario, un producto o una noticia. Lo nuevo (páginas, funciones, rediseños) es un servicio extra.',
        },
        {
          title: 'Reglas del cupo',
          text: 'Los cambios no usados no se acumulan al mes siguiente. Si el cliente pasa de su cupo, cada cambio extra cuesta 20 €, o puede subir de plan.',
        },
      ],
      comparison: {
        title: 'Con mantenimiento vs. solo la web',
        intro: 'Es opcional, pero sale a cuenta: esto es lo que cubre el mantenimiento y lo que costaría resolverlo por tu cuenta.',
        rows: [
          { label: 'Precio de la web', withPlan: 'Reducido', webOnly: 'Completo' },
          { label: 'Hosting y dominio', withPlan: 'Incluidos', webOnly: 'Los contrata y paga el cliente' },
          { label: 'Actualizaciones y seguridad', withPlan: 'Incluidas', webOnly: '90 € por intervención' },
          { label: 'Cambios', withPlan: '2–12 al mes según plan', webOnly: '35 € cada uno' },
          { label: 'Si la web se cae o la hackean', withPlan: 'Lo resolvemos', webOnly: '150–290 € por incidencia' },
          { label: 'Garantía de fallos', withPlan: 'Mientras dure el plan', webOnly: '30 días' },
          { label: 'Permanencia', withPlan: '12 o 24 meses', webOnly: 'Ninguna' },
        ],
      },
      permanenceRules: [
        { title: 'Inicio', text: 'Empieza el día de entrega de la web.' },
        {
          title: 'Fin',
          text: 'Renovación mensual, baja con 30 días de preaviso. Si se da de baja, se le entrega la web completa y se instala en su hosting sin coste.',
        },
        {
          title: 'Baja anticipada',
          text: 'Devuelve la parte proporcional del descuento de la web. Ej.: Corporativa (descuento 500 €) con Esencial, baja en el mes 10: 14/24 × 500 € = 292 €.',
        },
        { title: 'Subir de plan', text: 'Siempre. De un plan de 24 meses a Pro, la permanencia pasa a 12 meses desde el cambio.' },
      ],
      extras: {
        title: 'Tarifa de servicios',
        intro:
          'Solo dos precios: con cualquier plan o sin plan. Idiomas, productos y funciones por encima de lo incluido en cada web se cobran con esta tarifa.',
        rows: [
          { service: 'Cambio (texto, foto, precio, horario)', withPlanText: 'En el cupo · 20 € fuera' },
          { service: 'Sección nueva dentro de una página' },
          { service: 'Página nueva' },
          { service: 'Pack de 25 productos cargados' },
          { service: 'Idioma adicional' },
          { service: 'Redacción de textos (por página)' },
          { service: 'Logo sencillo' },
          { service: 'Actualización de seguridad', withPlanText: 'Incluida' },
          { service: 'Recuperar web caída', withPlanText: 'Incluido' },
          { service: 'Limpieza tras hackeo', withPlanText: 'Incluida' },
          { service: 'Rediseño o funciones nuevas', withPlanText: 'Presupuesto', withoutPlanText: 'Presupuesto' },
        ],
      },
      seo: {
        title: 'Tarifas web: landing, webs, tiendas y mantenimiento',
        description:
          'Landing Page desde 349 €, Web Corporativa 890 € y Tienda Online 1.490 € con mantenimiento desde 25 €/mes. Precios cerrados y límites claros, + IVA.',
      },
    },
    en: {
      eyebrow: '// pricing',
      title: 'Website pricing',
      subtitle: 'Fixed prices and clear limits, in two steps',
      intro: 'Choose your website first and then, if you like, a maintenance plan: with any plan, the website costs less.',
      vatNote: '+ VAT',
      footnote: 'All prices exclude VAT, which will be applied in accordance with current regulations.',
      webTitle: '1. Choose your website',
      webIntro:
        'One-off payment. All of them include responsive design, SSL, legal texts, 2 rounds of revisions and a 30-day bug-fix guarantee.',
      packages: [
        {
          name: 'Landing Page',
          pitch: 'Entry-level product: get found on Google and start receiving enquiries.',
          items: ok(
            'A single page with up to 5 sections',
            'Contact form + WhatsApp button',
            'Basic on-page SEO',
            'Setup of 1 Google Business Profile listing',
          ),
          ctaLabel: 'Request this plan',
        },
        {
          name: 'Landing Premium',
          pitch: 'For restaurants, physical shops and businesses with several locations.',
          items: ok(
            'A single page with up to 10 sections',
            'Header video and photo gallery',
            'Up to 2 locations with map, opening hours and contact details',
            'Custom design with animations',
            'Basic SEO + up to 2 Google Business listings',
          ),
          ctaLabel: 'Request this plan',
        },
        {
          name: 'Custom',
          pitch: 'A tailored plan, for example a landing page with a private control panel.',
          items: ok(
            'Landing Page base (up to 5 sections)',
            'Private control panel',
            'Custom features, quoted separately',
            'Basic SEO + 1 Google Business listing',
          ),
          ctaLabel: 'Request this plan',
        },
        {
          name: 'Business Website',
          pitch: 'The company website that attracts clients and builds trust.',
          items: ok(
            'Up to 6 pages (home, services, about us…)',
            'Blog enabled and ready to publish',
            'Local on-page SEO + Analytics and Search Console',
            'Map, Google reviews and forms',
          ),
          ctaLabel: 'Request this plan',
        },
        {
          name: 'Online Store',
          pitch: 'To sell online, from a handful of products to large catalogues.',
          items: ok(
            'Everything in the Business Website',
            'Unlimited product catalogue',
            'Upload of up to 30 products included (with variants)',
            'Private control panel',
            'Card, Bizum and PayPal payments · shipping',
            '1 additional language included',
          ),
          ctaLabel: 'Request this plan',
        },
        {
          name: 'Professional Website',
          pitch: 'Bespoke, with advanced features. Final price after a meeting.',
          itemsLead: 'The base price includes exactly:',
          items: ok(
            'Up to 6 pages',
            'Private control panel with user access',
            'Online booking or appointment system',
            '1 WhatsApp automation (e.g. new-booking alert)',
            '1 integration (calendar or CRM)',
            '1 additional language included',
          ),
          ctaLabel: 'Request this plan',
        },
      ],
      webNotes: [
        {
          title: 'Payment terms',
          text: 'With maintenance: 50% on acceptance and 50% on delivery. Website only: 100% upfront for the Landing Page; 50/50 for the rest.',
        },
        {
          title: '"Website only"',
          text: 'Includes installation on the hosting the client contracts and the setup of their domain. After that, changes and fixes are charged at the "without a plan" rate.',
        },
        {
          title: 'Extra features on the Professional Website',
          text: 'Any feature beyond the base (more automations, more integrations, special payment gateways, complex user areas) is quoted in writing before we start. That way the "from" price never turns into a surprise.',
        },
      ],
      maintenanceTitle: '2. Choose your maintenance (optional)',
      maintenanceIntro:
        'Optional, but with any plan the website costs less. All plans include hosting, domain, SSL, security updates and backups.',
      maintenancePlans: [
        {
          name: 'Essential',
          pitch: 'A website that is always online and secure.',
          items: [
            ...ok('Hosting, domain and SSL', 'Security updates', 'Weekly backup', '2 changes per month', 'Email support · 72 business hours'),
            no('No professional email'),
          ],
          ctaLabel: 'I want this plan',
        },
        {
          name: 'Plus',
          pitch: 'For businesses that update often.',
          items: ok(
            'Everything in Essential',
            'Daily backup + 24/7 monitoring',
            '6 changes per month',
            '2 professional email accounts',
            'Response within 48 h',
            'Quarterly report',
          ),
          ctaLabel: 'I want this plan',
        },
        {
          name: 'Pro',
          pitch: 'For online stores and sales websites.',
          items: ok(
            'Everything in Plus',
            '12 changes per month, including small design tweaks',
            'Store updates with testing',
            'Monthly SEO: 1 improvement + report',
            '5 email accounts',
            'WhatsApp · response within 24 h',
          ),
          ctaLabel: 'I want this plan',
        },
      ],
      customSupport: {
        title: 'Tailored support',
        text: 'For clients who need continuous improvements, a monthly meeting, content-driven SEO or maintenance of complex automations, we prepare a quote stating exactly what it includes.',
      },
      changeNotes: [
        {
          title: 'What counts as a change?',
          text: 'A specific request about something that already exists: a text, a photo, a price, opening hours, a product or a news item. Anything new (pages, features, redesigns) is an extra service.',
        },
        {
          title: 'Allowance rules',
          text: 'Unused changes do not roll over to the next month. If the client goes over their allowance, each extra change costs €20, or they can upgrade their plan.',
        },
      ],
      comparison: {
        title: 'With maintenance vs. website only',
        intro: 'It is optional, but it pays off: this is what maintenance covers and what it would cost to handle it on your own.',
        rows: [
          { label: 'Website price', withPlan: 'Reduced', webOnly: 'Full' },
          { label: 'Hosting and domain', withPlan: 'Included', webOnly: 'Contracted and paid by the client' },
          { label: 'Updates and security', withPlan: 'Included', webOnly: '€90 per intervention' },
          { label: 'Changes', withPlan: '2–12 per month depending on the plan', webOnly: '€35 each' },
          { label: 'If the website goes down or gets hacked', withPlan: 'We fix it', webOnly: '€150–290 per incident' },
          { label: 'Bug-fix guarantee', withPlan: 'For as long as the plan lasts', webOnly: '30 days' },
          { label: 'Minimum term', withPlan: '12 or 24 months', webOnly: 'None' },
        ],
      },
      permanenceRules: [
        { title: 'Start', text: 'It starts on the day the website is delivered.' },
        {
          title: 'End',
          text: 'Monthly renewal, cancellation with 30 days’ notice. On cancellation, the client receives the complete website, installed on their hosting at no cost.',
        },
        {
          title: 'Early cancellation',
          text: 'The client returns the proportional part of the website discount. E.g.: Business Website (€500 discount) with Essential, cancelled in month 10: 14/24 × €500 = €292.',
        },
        { title: 'Upgrading', text: 'Always possible. From a 24-month plan to Pro, the minimum term becomes 12 months from the change.' },
      ],
      extras: {
        title: 'Service rates',
        intro:
          'Just two prices: with any plan or without a plan. Languages, products and features beyond what each website includes are charged at these rates.',
        rows: [
          { service: 'Change (text, photo, price, opening hours)', withPlanText: 'Within allowance · €20 beyond' },
          { service: 'New section within a page' },
          { service: 'New page' },
          { service: 'Pack of 25 uploaded products' },
          { service: 'Additional language' },
          { service: 'Copywriting (per page)' },
          { service: 'Simple logo' },
          { service: 'Security update', withPlanText: 'Included' },
          { service: 'Recovering a website that is down', withPlanText: 'Included' },
          { service: 'Clean-up after a hack', withPlanText: 'Included' },
          { service: 'Redesign or new features', withPlanText: 'Quote', withoutPlanText: 'Quote' },
        ],
      },
      seo: {
        title: 'Website pricing: landing pages, stores and maintenance',
        description:
          'Landing Page from €349, Business Website €890 and Online Store €1,490 with maintenance from €25/month. Fixed prices and clear limits, + VAT.',
      },
    },
    fr: {
      eyebrow: '// tarifs',
      title: 'Nos tarifs web',
      subtitle: 'Des prix fixes et des limites claires, en deux étapes',
      intro: 'Choisissez d’abord votre site, puis, si vous le souhaitez, une formule de maintenance : avec n’importe quelle formule, le site coûte moins cher.',
      vatNote: '+ TVA',
      footnote: 'Tous les prix s’entendent hors TVA, appliquée conformément à la réglementation en vigueur.',
      webTitle: '1. Choisissez votre site',
      webIntro:
        'Paiement unique. Tous incluent un design responsive, le SSL, les mentions légales, 2 cycles de révisions et 30 jours de garantie de correction des bugs.',
      packages: [
        {
          name: 'Landing Page',
          pitch: 'L’offre d’entrée : être présent sur Google et recevoir des demandes.',
          items: ok(
            'Une page avec jusqu’à 5 sections',
            'Formulaire de contact + bouton WhatsApp',
            'SEO on-page de base',
            'Création d’une fiche Google Business Profile',
          ),
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Landing Premium',
          pitch: 'Pour les restaurants, les boutiques physiques et les entreprises à plusieurs adresses.',
          items: ok(
            'Une page avec jusqu’à 10 sections',
            'Vidéo d’en-tête et galerie photos',
            'Jusqu’à 2 établissements avec carte, horaires et contact',
            'Design sur mesure avec animations',
            'SEO de base + jusqu’à 2 fiches Google Business',
          ),
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Custom',
          pitch: 'Une formule personnalisée, par exemple une landing page avec un espace d’administration privé.',
          items: ok(
            'Base Landing Page (jusqu’à 5 sections)',
            'Espace d’administration privé',
            'Fonctionnalités sur mesure, chiffrées à part',
            'SEO de base + 1 fiche Google Business',
          ),
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Site vitrine',
          pitch: 'Le site d’entreprise pour attirer des clients et inspirer confiance.',
          items: ok(
            'Jusqu’à 6 pages (accueil, services, à propos…)',
            'Blog activé et prêt à publier',
            'SEO local on-page + Analytics et Search Console',
            'Carte, avis Google et formulaires',
          ),
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Boutique en ligne',
          pitch: 'Pour vendre en ligne, de quelques produits à de grands catalogues.',
          items: ok(
            'Tout le contenu du Site vitrine',
            'Catalogue de produits illimité',
            'Mise en ligne de jusqu’à 30 produits incluse (avec variantes)',
            'Espace d’administration privé',
            'Paiement par carte, Bizum et PayPal · livraisons',
            '1 langue supplémentaire incluse',
          ),
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Site professionnel',
          pitch: 'Sur mesure, avec des fonctionnalités avancées. Prix final après un rendez-vous.',
          itemsLead: 'Le prix de base comprend exactement :',
          items: ok(
            'Jusqu’à 6 pages',
            'Espace d’administration privé avec accès utilisateurs',
            'Système de réservation ou de prise de rendez-vous en ligne',
            '1 automatisation WhatsApp (ex. alerte de nouvelle réservation)',
            '1 intégration (agenda ou CRM)',
            '1 langue supplémentaire incluse',
          ),
          ctaLabel: 'Choisir cette formule',
        },
      ],
      webNotes: [
        {
          title: 'Modalités de paiement',
          text: 'Avec maintenance : 50 % à l’acceptation et 50 % à la livraison. Site seul : 100 % d’avance pour la Landing Page ; 50 / 50 pour les autres.',
        },
        {
          title: '« Site seul »',
          text: 'Comprend l’installation sur l’hébergement souscrit par le client et la configuration de son nom de domaine. Ensuite, modifications et corrections sont facturées au tarif « sans formule ».',
        },
        {
          title: 'Fonctionnalités supplémentaires du Site professionnel',
          text: 'Toute fonctionnalité au-delà de la base (plus d’automatisations, plus d’intégrations, passerelles de paiement spécifiques, espaces utilisateurs complexes) fait l’objet d’un devis écrit avant de commencer. Ainsi, le prix « à partir de » ne réserve jamais de surprise.',
        },
      ],
      maintenanceTitle: '2. Choisissez votre maintenance (facultatif)',
      maintenanceIntro:
        'Facultative, mais avec n’importe quelle formule le site coûte moins cher. Toutes incluent l’hébergement, le nom de domaine, le SSL, les mises à jour de sécurité et les sauvegardes.',
      maintenancePlans: [
        {
          name: 'Essentielle',
          pitch: 'Un site toujours en ligne et sécurisé.',
          items: [
            ...ok(
              'Hébergement, nom de domaine et SSL',
              'Mises à jour de sécurité',
              'Sauvegarde hebdomadaire',
              '2 modifications par mois',
              'Support par e-mail · 72 h ouvrées',
            ),
            no('Sans messagerie professionnelle'),
          ],
          ctaLabel: 'Je veux cette formule',
        },
        {
          name: 'Plus',
          pitch: 'Pour les entreprises qui mettent souvent leur site à jour.',
          items: ok(
            'Tout le contenu d’Essentielle',
            'Sauvegarde quotidienne + surveillance 24/7',
            '6 modifications par mois',
            '2 adresses e-mail professionnelles',
            'Réponse sous 48 h',
            'Rapport trimestriel',
          ),
          ctaLabel: 'Je veux cette formule',
        },
        {
          name: 'Pro',
          pitch: 'Pour les boutiques et les sites de vente.',
          items: ok(
            'Tout le contenu de Plus',
            '12 modifications par mois, petits ajustements de design inclus',
            'Mises à jour de la boutique avec tests',
            'SEO mensuel : 1 amélioration + rapport',
            '5 adresses e-mail',
            'WhatsApp · réponse sous 24 h',
          ),
          ctaLabel: 'Je veux cette formule',
        },
      ],
      customSupport: {
        title: 'Support sur mesure',
        text: 'Pour les clients qui ont besoin d’améliorations continues, d’un point mensuel, d’un SEO avec création de contenu ou de la maintenance d’automatisations complexes, nous établissons un devis détaillant exactement ce qu’il comprend.',
      },
      changeNotes: [
        {
          title: 'Qu’est-ce qu’une modification ?',
          text: 'Une demande précise portant sur un élément existant : un texte, une photo, un prix, des horaires, un produit ou une actualité. Tout ce qui est nouveau (pages, fonctionnalités, refontes) est un service supplémentaire.',
        },
        {
          title: 'Règles du quota',
          text: 'Les modifications non utilisées ne sont pas reportées au mois suivant. Si le client dépasse son quota, chaque modification supplémentaire coûte 20 €, ou il peut passer à une formule supérieure.',
        },
      ],
      comparison: {
        title: 'Avec maintenance ou site seul',
        intro: 'Elle est facultative, mais elle est rentable : voici ce que couvre la maintenance et ce qu’il vous en coûterait de le gérer vous-même.',
        rows: [
          { label: 'Prix du site', withPlan: 'Réduit', webOnly: 'Complet' },
          { label: 'Hébergement et nom de domaine', withPlan: 'Inclus', webOnly: 'Souscrits et payés par le client' },
          { label: 'Mises à jour et sécurité', withPlan: 'Incluses', webOnly: '90 € par intervention' },
          { label: 'Modifications', withPlan: '2 à 12 par mois selon la formule', webOnly: '35 € chacune' },
          { label: 'Si le site tombe en panne ou est piraté', withPlan: 'Nous le réparons', webOnly: '150–290 € par incident' },
          { label: 'Garantie de correction', withPlan: 'Pendant toute la durée de la formule', webOnly: '30 jours' },
          { label: 'Engagement', withPlan: '12 ou 24 mois', webOnly: 'Aucun' },
        ],
      },
      permanenceRules: [
        { title: 'Début', text: 'L’engagement commence le jour de la livraison du site.' },
        {
          title: 'Fin',
          text: 'Renouvellement mensuel, résiliation avec un préavis de 30 jours. En cas de résiliation, le site complet est remis au client et installé sur son hébergement sans frais.',
        },
        {
          title: 'Résiliation anticipée',
          text: 'Le client rembourse la part proportionnelle de la remise sur le site. Ex. : Site vitrine (remise de 500 €) avec Essentielle, résiliation au 10e mois : 14/24 × 500 € = 292 €.',
        },
        {
          title: 'Passer à une formule supérieure',
          text: 'Toujours possible. D’une formule de 24 mois à Pro, l’engagement passe à 12 mois à compter du changement.',
        },
      ],
      extras: {
        title: 'Tarifs des services',
        intro:
          'Seulement deux prix : avec n’importe quelle formule ou sans formule. Langues, produits et fonctionnalités au-delà de ce que comprend chaque site sont facturés selon ces tarifs.',
        rows: [
          { service: 'Modification (texte, photo, prix, horaires)', withPlanText: 'Dans le quota · 20 € au-delà' },
          { service: 'Nouvelle section dans une page' },
          { service: 'Nouvelle page' },
          { service: 'Pack de 25 produits mis en ligne' },
          { service: 'Langue supplémentaire' },
          { service: 'Rédaction de textes (par page)' },
          { service: 'Logo simple' },
          { service: 'Mise à jour de sécurité', withPlanText: 'Incluse' },
          { service: 'Remise en ligne d’un site en panne', withPlanText: 'Incluse' },
          { service: 'Nettoyage après piratage', withPlanText: 'Inclus' },
          { service: 'Refonte ou nouvelles fonctionnalités', withPlanText: 'Sur devis', withoutPlanText: 'Sur devis' },
        ],
      },
      seo: {
        title: 'Tarifs web : landing pages, boutiques et maintenance',
        description:
          'Landing Page dès 349 €, Site vitrine 890 € et Boutique en ligne 1 490 € avec maintenance dès 25 €/mois. Prix fixes et limites claires, HT.',
      },
    },
  },
}

/** Saved ES row ids of the arrays whose rows hold shared numbers; EN/FR are written onto the same rows. */
export type PricingRowIds = { packages?: (string | null | undefined)[]; maintenancePlans?: (string | null | undefined)[]; extras?: (string | null | undefined)[] }

const withId = <T extends object>(row: T, id: string | null | undefined) => (id ? { ...row, id } : row)

/** Global data for one locale: shared numbers merged into every localized row, attached to saved row ids. */
export function pricingData(locale: Locale, ids: PricingRowIds = {}) {
  const { packages, maintenancePlans, extras, customSupport, ...rest } = pricing.localized[locale]
  const { shared } = pricing
  return {
    ...rest,
    packages: shared.packages.map((p, i) => withId({ ...p, ...packages[i] }, ids.packages?.[i])),
    maintenancePlans: shared.maintenancePlans.map((p, i) => withId({ ...p, ...maintenancePlans[i] }, ids.maintenancePlans?.[i])),
    customSupport: { ...shared.customSupport, ...customSupport },
    extras: {
      title: extras.title,
      intro: extras.intro,
      rows: shared.extras.map((r, i) => withId({ ...r, ...extras.rows[i] }, ids.extras?.[i])),
    },
  }
}
