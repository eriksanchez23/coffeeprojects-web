import type { SeedDoc } from '../types'

type QA = { question: string; answer: string }
type ServiceShared = {
  icon: 'globe' | 'shopping-cart' | 'code' | 'server' | 'bot' | 'wrench' | 'sparkles'
  contactType: 'web' | 'ecommerce' | 'fivem-script' | 'fivem-server' | 'discord-bot' | 'maintenance' | 'custom'
  pricing: { mode: 'one-off' | 'monthly' | 'custom' | 'store'; amount?: number; storeUrl?: string }
  tags: string[]
  order: number
}
type ServiceLocalized = {
  title: string
  slug: string
  promise: string
  summary: string
  typicalTime: string
  note: string
  features: { text: string }[]
  faq: QA[]
  seo: { title: string; description: string }
}

export const services: SeedDoc<ServiceShared, ServiceLocalized>[] = [
  {
    shared: { icon: 'globe', contactType: 'web', pricing: { mode: 'one-off', amount: 300 }, tags: ['Astro', 'Next.js', 'Tailwind', 'GSAP', 'Vercel'], order: 1 },
    localized: {
      es: {
        title: 'Webs & landing pages',
        slug: 'webs-y-landing-pages',
        promise: 'Una web rápida, bonita y pensada para traer clientes.',
        summary: 'Sitios rápidos, orientados a conversión y optimizados para SEO, con stack moderno y despliegue incluido.',
        typicalTime: '1-2 semanas',
        note: 'Mantenimiento mensual desde 20 €/mes + IVA, según el paquete.',
        features: [
          { text: 'Landing de producto o campaña' },
          { text: 'Web corporativa' },
          { text: 'Blog o portfolio' },
          { text: 'SEO técnico y rendimiento Lighthouse 95+' },
          { text: 'Despliegue y hosting incluidos' },
        ],
        faq: [
          { question: '¿Cuánto tarda una web?', answer: 'Una landing sencilla suele estar lista en 1-2 semanas. Tras la primera llamada te damos un plazo concreto según el alcance real.' },
          { question: '¿Podré editar los textos yo mismo?', answer: 'Sí. Si lo necesitas, incluimos un panel de gestión para que cambies textos e imágenes sin tocar código.' },
        ],
        seo: { title: 'Diseño de páginas web y landing pages', description: 'Webs y landing pages rápidas, optimizadas para SEO y orientadas a conseguir clientes. Desde 300 € + IVA, listas en 1-2 semanas.' },
      },
      en: {
        title: 'Websites & landing pages',
        slug: 'websites-and-landing-pages',
        promise: 'A fast, beautiful website built to bring you clients.',
        summary: 'Fast, conversion-focused, SEO-optimized websites with a modern stack and deployment included.',
        typicalTime: '1-2 weeks',
        note: 'Monthly maintenance from €20/month + VAT, depending on the package.',
        features: [
          { text: 'Product or campaign landing page' },
          { text: 'Corporate website' },
          { text: 'Blog or portfolio' },
          { text: 'Technical SEO and Lighthouse 95+ performance' },
          { text: 'Deployment and hosting included' },
        ],
        faq: [
          { question: 'How long does a website take?', answer: 'A simple landing page is usually ready in 1-2 weeks. After the first call we give you a concrete timeline based on the real scope.' },
          { question: 'Will I be able to edit the content myself?', answer: 'Yes. If you need it, we include an admin panel so you can change text and images without touching code.' },
        ],
        seo: { title: 'Website and landing page design', description: 'Fast, SEO-optimized websites and landing pages built to win clients. From €300 + VAT, ready in 1-2 weeks.' },
      },
      fr: {
        title: 'Sites web & landing pages',
        slug: 'sites-web-et-landing-pages',
        promise: 'Un site rapide, élégant et pensé pour vous apporter des clients.',
        summary: 'Des sites rapides, orientés conversion et optimisés pour le SEO, avec une stack moderne et la mise en ligne incluse.',
        typicalTime: '1 à 2 semaines',
        note: 'Maintenance mensuelle à partir de 20 €/mois + TVA, selon la formule.',
        features: [
          { text: 'Landing page produit ou campagne' },
          { text: "Site vitrine d'entreprise" },
          { text: 'Blog ou portfolio' },
          { text: 'SEO technique et performance Lighthouse 95+' },
          { text: 'Mise en ligne et hébergement inclus' },
        ],
        faq: [
          { question: 'Combien de temps faut-il pour un site ?', answer: 'Une landing page simple est généralement prête en 1 à 2 semaines. Après le premier appel, nous vous donnons un délai précis selon le périmètre réel.' },
          { question: 'Pourrai-je modifier les contenus moi-même ?', answer: "Oui. Si besoin, nous incluons un panneau d'administration pour modifier textes et images sans toucher au code." },
        ],
        seo: { title: 'Création de sites web et landing pages', description: 'Sites web et landing pages rapides, optimisés pour le SEO et pensés pour gagner des clients. À partir de 300 € + TVA, prêts en 1 à 2 semaines.' },
      },
    },
  },
  {
    shared: { icon: 'shopping-cart', contactType: 'ecommerce', pricing: { mode: 'one-off', amount: 2500 }, tags: ['Shopify', 'WooCommerce', 'Stripe', 'Next.js'], order: 2 },
    localized: {
      es: {
        title: 'Tiendas online',
        slug: 'tiendas-online',
        promise: 'Vende online con una tienda segura, rápida y fácil de gestionar.',
        summary: 'E-commerce con carrito, pagos con Stripe y panel de administración intuitivo. Shopify, WooCommerce o desarrollo propio según lo que necesites.',
        typicalTime: '4-8 semanas',
        note: 'Integración con tu logística y CRM.',
        features: [
          { text: 'Catálogo y carrito' },
          { text: 'Pagos con Stripe o PayPal' },
          { text: 'Gestión de stock' },
          { text: 'Panel de administración' },
        ],
        faq: [
          { question: '¿Qué plataforma usaréis?', answer: 'Depende de tu catálogo y presupuesto: Shopify, WooCommerce o una tienda a medida. Te recomendamos la opción más rentable en la propuesta.' },
          { question: '¿Puedo cobrar con tarjeta y PayPal?', answer: 'Sí. Integramos Stripe y PayPal, con pagos seguros y facturación.' },
        ],
        seo: { title: 'Desarrollo de tiendas online a medida', description: 'Tiendas online seguras y rápidas con pagos Stripe y PayPal, gestión de stock y panel propio. Desde 2.500 €.' },
      },
      en: {
        title: 'Online stores',
        slug: 'online-stores',
        promise: 'Sell online with a secure, fast and easy-to-manage store.',
        summary: 'E-commerce with cart, Stripe payments and an intuitive admin panel. Shopify, WooCommerce or a custom build, depending on what you need.',
        typicalTime: '4-8 weeks',
        note: 'Integration with your logistics and CRM.',
        features: [
          { text: 'Catalog and cart' },
          { text: 'Stripe or PayPal payments' },
          { text: 'Stock management' },
          { text: 'Admin panel' },
        ],
        faq: [
          { question: 'Which platform will you use?', answer: 'It depends on your catalog and budget: Shopify, WooCommerce or a custom store. We recommend the most cost-effective option in the proposal.' },
          { question: 'Can I accept cards and PayPal?', answer: 'Yes. We integrate Stripe and PayPal, with secure payments and invoicing.' },
        ],
        seo: { title: 'Custom online store development', description: 'Secure, fast online stores with Stripe and PayPal payments, stock management and their own admin panel. From €2,500.' },
      },
      fr: {
        title: 'Boutiques en ligne',
        slug: 'boutiques-en-ligne',
        promise: 'Vendez en ligne avec une boutique sûre, rapide et facile à gérer.',
        summary: "E-commerce avec panier, paiements Stripe et panneau d'administration intuitif. Shopify, WooCommerce ou développement sur mesure selon vos besoins.",
        typicalTime: '4 à 8 semaines',
        note: 'Intégration avec votre logistique et votre CRM.',
        features: [
          { text: 'Catalogue et panier' },
          { text: 'Paiements Stripe ou PayPal' },
          { text: 'Gestion des stocks' },
          { text: "Panneau d'administration" },
        ],
        faq: [
          { question: 'Quelle plateforme utiliserez-vous ?', answer: 'Cela dépend de votre catalogue et de votre budget : Shopify, WooCommerce ou une boutique sur mesure. Nous recommandons l’option la plus rentable dans la proposition.' },
          { question: 'Puis-je accepter la carte et PayPal ?', answer: 'Oui. Nous intégrons Stripe et PayPal, avec paiements sécurisés et facturation.' },
        ],
        seo: { title: 'Création de boutiques en ligne sur mesure', description: "Boutiques en ligne sûres et rapides avec paiements Stripe et PayPal, gestion des stocks et panneau d'administration. À partir de 2 500 €." },
      },
    },
  },
  {
    shared: { icon: 'code', contactType: 'fivem-script', pricing: { mode: 'store', storeUrl: '' }, tags: ['Lua', 'QBCore', 'ESX', 'NUI'], order: 3 },
    localized: {
      es: {
        title: 'Scripts FiveM',
        slug: 'scripts-fivem',
        promise: 'Recursos optimizados para que tu servidor RP destaque.',
        summary: 'Recursos para tu servidor roleplay: economías, trabajos, sistemas RP e interfaces. Código Lua limpio y optimizado para alto rendimiento.',
        typicalTime: 'Días',
        note: 'Scripts a la venta y desarrollos a medida.',
        features: [
          { text: 'Economías y trabajos (jobs)' },
          { text: 'Sistemas de roleplay' },
          { text: 'Interfaces NUI' },
          { text: 'Compatibles con ESX y QBCore' },
        ],
        faq: [],
        seo: { title: 'Scripts FiveM para servidores RP (ESX y QBCore)', description: 'Scripts FiveM optimizados para ESX y QBCore: trabajos, economías, sistemas RP e interfaces NUI. Más de 50 scripts publicados.' },
      },
      en: {
        title: 'FiveM scripts',
        slug: 'fivem-scripts',
        promise: 'Optimized resources to make your RP server stand out.',
        summary: 'Resources for your roleplay server: economies, jobs, RP systems and interfaces. Clean Lua code optimized for high performance.',
        typicalTime: 'Days',
        note: 'Ready-made scripts and custom development.',
        features: [
          { text: 'Economies and jobs' },
          { text: 'Roleplay systems' },
          { text: 'NUI interfaces' },
          { text: 'ESX and QBCore compatible' },
        ],
        faq: [],
        seo: { title: 'FiveM scripts for RP servers (ESX & QBCore)', description: 'Optimized FiveM scripts for ESX and QBCore: jobs, economies, RP systems and NUI interfaces. 50+ scripts published.' },
      },
      fr: {
        title: 'Scripts FiveM',
        slug: 'scripts-fivem',
        promise: 'Des ressources optimisées pour faire briller votre serveur RP.',
        summary: 'Des ressources pour votre serveur roleplay : économies, métiers, systèmes RP et interfaces. Un code Lua propre et optimisé pour de hautes performances.',
        typicalTime: 'Quelques jours',
        note: 'Scripts prêts à l’emploi et développements sur mesure.',
        features: [
          { text: 'Économies et métiers (jobs)' },
          { text: 'Systèmes de roleplay' },
          { text: 'Interfaces NUI' },
          { text: 'Compatibles ESX et QBCore' },
        ],
        faq: [],
        seo: { title: 'Scripts FiveM pour serveurs RP (ESX et QBCore)', description: 'Scripts FiveM optimisés pour ESX et QBCore : métiers, économies, systèmes RP et interfaces NUI. Plus de 50 scripts publiés.' },
      },
    },
  },
  {
    shared: { icon: 'server', contactType: 'fivem-server', pricing: { mode: 'one-off', amount: 800 }, tags: ['QBCore', 'ESX', 'txAdmin', 'Hosting'], order: 4 },
    localized: {
      es: {
        title: 'Servidores FiveM llave en mano',
        slug: 'servidores-fivem',
        promise: 'Tu servidor completo, configurado y listo para tu comunidad.',
        summary: 'Montamos tu servidor completo: framework, recursos esenciales, configuración y hosting opcional. Listo para que tu comunidad entre a jugar.',
        typicalTime: '1 semana',
        note: 'Soporte post-entrega opcional con cuota mensual.',
        features: [
          { text: 'Instalación completa del framework' },
          { text: 'Recursos esenciales preinstalados' },
          { text: 'Configuración de txAdmin' },
          { text: 'Hosting opcional' },
        ],
        faq: [],
        seo: { title: 'Servidores FiveM llave en mano', description: 'Servidor FiveM completo con QBCore o ESX, recursos esenciales, txAdmin y hosting opcional. Desde 800 €, listo en una semana.' },
      },
      en: {
        title: 'Turnkey FiveM servers',
        slug: 'fivem-servers',
        promise: 'Your complete server, configured and ready for your community.',
        summary: 'We build your whole server: framework, essential resources, configuration and optional hosting. Ready for your community to jump in.',
        typicalTime: '1 week',
        note: 'Optional post-delivery support with a monthly fee.',
        features: [
          { text: 'Full framework setup' },
          { text: 'Essential resources pre-installed' },
          { text: 'txAdmin configuration' },
          { text: 'Optional hosting' },
        ],
        faq: [],
        seo: { title: 'Turnkey FiveM servers', description: 'Complete FiveM server with QBCore or ESX, essential resources, txAdmin and optional hosting. From €800, ready in one week.' },
      },
      fr: {
        title: 'Serveurs FiveM clés en main',
        slug: 'serveurs-fivem',
        promise: 'Votre serveur complet, configuré et prêt pour votre communauté.',
        summary: 'Nous montons votre serveur de A à Z : framework, ressources essentielles, configuration et hébergement en option. Prêt pour accueillir votre communauté.',
        typicalTime: '1 semaine',
        note: 'Support après livraison en option, avec abonnement mensuel.',
        features: [
          { text: 'Installation complète du framework' },
          { text: 'Ressources essentielles préinstallées' },
          { text: 'Configuration de txAdmin' },
          { text: 'Hébergement en option' },
        ],
        faq: [],
        seo: { title: 'Serveurs FiveM clés en main', description: 'Serveur FiveM complet avec QBCore ou ESX, ressources essentielles, txAdmin et hébergement en option. À partir de 800 €, prêt en une semaine.' },
      },
    },
  },
  {
    shared: { icon: 'bot', contactType: 'discord-bot', pricing: { mode: 'one-off', amount: 120 }, tags: ['discord.js', 'Slash commands', 'FiveM', '24/7'], order: 5 },
    localized: {
      es: {
        title: 'Bots de Discord',
        slug: 'bots-de-discord',
        promise: 'Automatiza y protege tu comunidad con un bot a medida.',
        summary: 'Bots a medida para tu comunidad o servidor RP: verificación y whitelist, moderación automática, tickets de soporte e integraciones con FiveM.',
        typicalTime: '1-2 semanas',
        note: 'Lo alojamos y mantenemos por ti, o te lo entregamos listo para tu hosting.',
        features: [
          { text: 'Verificación y whitelist RP' },
          { text: 'Moderación y automod' },
          { text: 'Tickets de soporte' },
          { text: 'Integraciones y comandos a medida' },
        ],
        faq: [],
        seo: { title: 'Bots de Discord a medida', description: 'Bots de Discord a medida: whitelist, moderación, tickets e integración con FiveM. Alojados y mantenidos. Desde 120 €.' },
      },
      en: {
        title: 'Discord bots',
        slug: 'discord-bots',
        promise: 'Automate and protect your community with a custom bot.',
        summary: 'Custom bots for your community or RP server: verification and whitelist, auto-moderation, support tickets and FiveM integrations.',
        typicalTime: '1-2 weeks',
        note: 'We host and maintain it for you, or hand it over ready for your hosting.',
        features: [
          { text: 'RP verification and whitelist' },
          { text: 'Moderation and automod' },
          { text: 'Support tickets' },
          { text: 'Custom integrations and commands' },
        ],
        faq: [],
        seo: { title: 'Custom Discord bots', description: 'Custom Discord bots: whitelist, moderation, tickets and FiveM integration. Hosted and maintained. From €120.' },
      },
      fr: {
        title: 'Bots Discord',
        slug: 'bots-discord',
        promise: 'Automatisez et protégez votre communauté avec un bot sur mesure.',
        summary: 'Des bots sur mesure pour votre communauté ou serveur RP : vérification et whitelist, modération automatique, tickets de support et intégrations FiveM.',
        typicalTime: '1 à 2 semaines',
        note: "Nous l'hébergeons et le maintenons pour vous, ou vous le livrons prêt pour votre hébergement.",
        features: [
          { text: 'Vérification et whitelist RP' },
          { text: 'Modération et automod' },
          { text: 'Tickets de support' },
          { text: 'Intégrations et commandes sur mesure' },
        ],
        faq: [],
        seo: { title: 'Bots Discord sur mesure', description: 'Bots Discord sur mesure : whitelist, modération, tickets et intégration FiveM. Hébergés et maintenus. À partir de 120 €.' },
      },
    },
  },
  {
    shared: { icon: 'wrench', contactType: 'maintenance', pricing: { mode: 'monthly', amount: 20 }, tags: ['Backups', 'Updates', 'Monitoring'], order: 6 },
    localized: {
      es: {
        title: 'Mantenimiento web mensual',
        slug: 'mantenimiento-web',
        promise: 'Tu web siempre rápida, segura y actualizada, la hayamos hecho nosotros o no.',
        summary: '¿Ya tienes web y quieres que la cuidemos? Nos encargamos aunque no la hayamos hecho nosotros: actualizaciones, copias de seguridad, soporte y cambios menores por una cuota fija.',
        typicalTime: 'Respuesta en 24h laborables',
        note: 'Para webs hechas por nosotros o por terceros. Auditoría inicial incluida.',
        features: [
          { text: 'Actualizaciones y parches' },
          { text: 'Copias de seguridad semanales' },
          { text: 'Monitorización de disponibilidad y errores' },
          { text: 'Cambios menores y soporte' },
        ],
        faq: [],
        seo: { title: 'Mantenimiento web mensual', description: 'Mantenimiento web con actualizaciones, copias de seguridad, monitorización y soporte. Para cualquier web. Desde 20 €/mes + IVA.' },
      },
      en: {
        title: 'Monthly website maintenance',
        slug: 'website-maintenance',
        promise: "Your website always fast, secure and up to date, whether we built it or not.",
        summary: "Already have a website and want us to look after it? We take care of it even if we didn't build it: updates, backups, support and minor changes for a fixed monthly fee.",
        typicalTime: 'Reply within 24 business hours',
        note: 'For websites built by us or by others. Initial audit included.',
        features: [
          { text: 'Updates and patches' },
          { text: 'Weekly backups' },
          { text: 'Uptime and error monitoring' },
          { text: 'Minor changes and support' },
        ],
        faq: [],
        seo: { title: 'Monthly website maintenance', description: 'Website maintenance with updates, backups, monitoring and support. For any website. From €20/month + VAT.' },
      },
      fr: {
        title: 'Maintenance web mensuelle',
        slug: 'maintenance-site-web',
        promise: "Votre site toujours rapide, sûr et à jour, que nous l'ayons créé ou non.",
        summary: "Vous avez déjà un site et souhaitez qu'on s'en occupe ? Nous le prenons en charge même si nous ne l'avons pas créé : mises à jour, sauvegardes, support et petites modifications pour un forfait mensuel fixe.",
        typicalTime: 'Réponse sous 24 h ouvrées',
        note: 'Pour les sites créés par nous ou par d’autres. Audit initial inclus.',
        features: [
          { text: 'Mises à jour et correctifs' },
          { text: 'Sauvegardes hebdomadaires' },
          { text: 'Surveillance de la disponibilité et des erreurs' },
          { text: 'Petites modifications et support' },
        ],
        faq: [],
        seo: { title: 'Maintenance web mensuelle', description: 'Maintenance de site avec mises à jour, sauvegardes, surveillance et support. Pour tout site. À partir de 20 €/mois + TVA.' },
      },
    },
  },
  {
    shared: { icon: 'sparkles', contactType: 'custom', pricing: { mode: 'custom' }, tags: ['Node.js', 'Python', 'API'], order: 7 },
    localized: {
      es: {
        title: 'Desarrollo a medida',
        slug: 'desarrollo-a-medida',
        promise: 'Software hecho a tu medida: automatizaciones, integraciones y dashboards.',
        summary: 'Lo que no encaja en lo anterior: bots, automatizaciones, integraciones de API, dashboards internos y herramientas hechas para tu negocio.',
        typicalTime: '2-12 semanas',
        note: 'Primera consulta gratis.',
        features: [
          { text: 'Bots y automatizaciones' },
          { text: 'Integraciones de API' },
          { text: 'Dashboards internos' },
          { text: 'Scripts y herramientas' },
        ],
        faq: [],
        seo: { title: 'Desarrollo de software a medida', description: 'Automatizaciones, integraciones de API, dashboards y herramientas a medida para tu negocio. Primera consulta gratis.' },
      },
      en: {
        title: 'Custom development',
        slug: 'custom-development',
        promise: 'Software tailored to you: automations, integrations and dashboards.',
        summary: "Whatever doesn't fit above: bots, automations, API integrations, internal dashboards and tools built for your business.",
        typicalTime: '2-12 weeks',
        note: 'First consultation free.',
        features: [
          { text: 'Bots and automations' },
          { text: 'API integrations' },
          { text: 'Internal dashboards' },
          { text: 'Scripts and tools' },
        ],
        faq: [],
        seo: { title: 'Custom software development', description: 'Automations, API integrations, dashboards and custom tools for your business. First consultation free.' },
      },
      fr: {
        title: 'Développement sur mesure',
        slug: 'developpement-sur-mesure',
        promise: 'Des logiciels faits pour vous : automatisations, intégrations et tableaux de bord.',
        summary: "Tout ce qui ne rentre pas dans les cases ci-dessus : bots, automatisations, intégrations d'API, tableaux de bord internes et outils conçus pour votre activité.",
        typicalTime: '2 à 12 semaines',
        note: 'Première consultation gratuite.',
        features: [
          { text: 'Bots et automatisations' },
          { text: "Intégrations d'API" },
          { text: 'Tableaux de bord internes' },
          { text: 'Scripts et outils' },
        ],
        faq: [],
        seo: { title: 'Développement de logiciels sur mesure', description: "Automatisations, intégrations d'API, tableaux de bord et outils sur mesure pour votre activité. Première consultation gratuite." },
      },
    },
  },
]
