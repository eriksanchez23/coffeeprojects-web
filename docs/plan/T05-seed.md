# T05 — Seed: all initial content in ES/EN/FR (idempotent)

**Files:**
- Create: `src/seed/types.ts`, `src/seed/lexical.ts`, `src/seed/upsert.ts`, `src/seed/index.ts`, `src/seed/data/home.ts`, `src/seed/data/settings.ts`, `src/seed/data/services.ts`, `src/seed/data/team.ts`, `src/seed/data/projects.ts`, `src/seed/data/faqs.ts`, `src/seed/data/legal.ts`
- Test: `tests/unit/seed-data.test.ts`

**Interfaces:**
- Consumes: collections/globals and `slugify` (T04), `Locale`/`locales` (T03).
- Produces: `pnpm seed` — creates or updates every document; safe to run repeatedly. `lexical(blocks)` helper (also used by T15 tests). Type `Localized<T> = Record<Locale, T>`.

Rules:
- Source of truth for ES copy is `docs/02-content-es.md`. EN/FR below are the reviewed translations.
- The seed **never** creates users or credentials.
- Open questions are respected: no photos (Q2), no chat link (Q4), FiveM store URL empty (Q8), online-store timeline uses the card value "4-8 semanas" until Q10 is answered, legal texts contain visible `[PENDIENTE: …]` markers (Q3).

- [ ] **Step 1: Failing data-integrity test**

`tests/unit/seed-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { slugify } from '@/fields/slug'
import { locales } from '@/i18n/locales'
import { faqs } from '@/seed/data/faqs'
import { home } from '@/seed/data/home'
import { projects } from '@/seed/data/projects'
import { services } from '@/seed/data/services'
import { team } from '@/seed/data/team'

function emptyStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() === '' ? [path] : []
  if (Array.isArray(value)) return value.flatMap((v, i) => emptyStrings(v, `${path}[${i}]`))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, `${path}.${k}`))
  return []
}

const localizedSets = {
  home: [home.localized],
  services: services.map((s) => s.localized),
  team: team.map((t) => t.localized),
  projects: projects.map((p) => p.localized),
  faqs: faqs.map((f) => f.localized),
}

describe('seed data', () => {
  for (const [name, items] of Object.entries(localizedSets)) {
    it(`${name}: every item has ES/EN/FR with no empty strings`, () => {
      for (const item of items) {
        for (const locale of locales) {
          expect(item[locale], `${name} missing ${locale}`).toBeDefined()
          expect(emptyStrings(item[locale])).toEqual([])
        }
      }
    })
  }

  it('slugs are already slugified and unique per locale', () => {
    for (const set of [services, team, projects]) {
      for (const locale of locales) {
        const slugs = set.map((d) => d.localized[locale].slug)
        slugs.forEach((s) => expect(s).toBe(slugify(s)))
        expect(new Set(slugs).size).toBe(slugs.length)
      }
    }
  })

  it('stats are never zero', () => {
    home.shared.stats.forEach((s) => expect(s.value).toBeGreaterThan(0))
  })

  it('list-shaped localized arrays have the same length in every locale', () => {
    for (const s of services) {
      expect(s.localized.en.features.length).toBe(s.localized.es.features.length)
      expect(s.localized.fr.features.length).toBe(s.localized.es.features.length)
      expect(s.localized.en.faq.length).toBe(s.localized.es.faq.length)
      expect(s.localized.fr.faq.length).toBe(s.localized.es.faq.length)
    }
    for (const key of ['whyUs', 'process'] as const) {
      expect(home.localized.en[key].length).toBe(home.localized.es[key].length)
      expect(home.localized.fr[key].length).toBe(home.localized.es[key].length)
    }
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (modules missing)

```bash
pnpm vitest run tests/unit/seed-data.test.ts
```

- [ ] **Step 3: Helpers**

`src/seed/types.ts`:

```ts
import type { Locale } from '@/i18n/locales'

export type Localized<T> = Record<Locale, T>
export type SeedDoc<S, L> = { shared: S; localized: Localized<L> }
```

`src/seed/lexical.ts`:

```ts
type Block = { h2: string } | { p: string }

const text = (value: string) => ({ type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
const base = { format: '', indent: 0, version: 1, direction: 'ltr' as const }

export function lexical(blocks: Block[]) {
  return {
    root: {
      type: 'root',
      ...base,
      children: blocks.map((b) =>
        'h2' in b
          ? { type: 'heading', tag: 'h2', ...base, children: [text(b.h2)] }
          : { type: 'paragraph', ...base, textFormat: 0, children: [text(b.p)] },
      ),
    },
  }
}
```

`src/seed/upsert.ts`:

```ts
import type { CollectionSlug, GlobalSlug, Payload } from 'payload'
import { type Locale, locales } from '@/i18n/locales'
import type { Localized } from './types'

type Match = { field: string; value: string | number }

export async function upsertLocalized(
  payload: Payload,
  collection: CollectionSlug,
  match: Match,
  shared: Record<string, unknown>,
  localized: Localized<Record<string, unknown>>,
  opts: { drafts: boolean },
): Promise<string | number> {
  const status = opts.drafts ? { _status: 'published' } : {}
  const found = await payload.find({
    collection,
    where: { [match.field]: { equals: match.value } },
    locale: 'es',
    limit: 1,
    depth: 0,
    draft: opts.drafts,
  })
  let id = found.docs[0]?.id
  const esData = { ...shared, ...localized.es, ...status }

  if (id) await payload.update({ collection, id, locale: 'es', data: esData as never })
  else id = (await payload.create({ collection, locale: 'es', data: esData as never })).id

  for (const locale of locales.filter((l): l is Exclude<Locale, 'es'> => l !== 'es')) {
    await payload.update({ collection, id, locale, data: { ...localized[locale], ...status } as never })
  }
  return id
}

export async function upsertGlobal(
  payload: Payload,
  slug: GlobalSlug,
  shared: Record<string, unknown>,
  localized: Localized<Record<string, unknown>>,
  opts: { drafts: boolean },
): Promise<void> {
  const status = opts.drafts ? { _status: 'published' } : {}
  await payload.updateGlobal({ slug, locale: 'es', data: { ...shared, ...localized.es, ...status } as never })
  for (const locale of locales.filter((l) => l !== 'es')) {
    await payload.updateGlobal({ slug, locale, data: { ...localized[locale], ...status } as never })
  }
}
```

> Localized **arrays** (`features`, `faq`, `whyUs`, `process`) are stored per locale in Payload, so writing the full array for each locale is correct. Localized **groups** with nested localized fields (`hero`, `sections`, `seo`) are merged per locale.

- [ ] **Step 4: Data — home `src/seed/data/home.ts`**

```ts
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
```

> Stats labels are localized while values are shared. `index.ts` writes stats as one array: ES pass writes `value/prefix/suffix/label`; EN/FR passes rewrite the **same rows** with their label (rows matched by index — Payload keeps array row IDs, so the EN/FR pass must include each row's `id` read back after the ES write; see Step 10).

- [ ] **Step 5: Data — settings `src/seed/data/settings.ts`**

```ts
import type { Localized } from '../types'

export const settings: { shared: { contactEmail: string }; localized: Localized<{ tagline: string; defaultSeo: { title: string; description: string } }> } = {
  shared: { contactEmail: 'contact@coffeeprojects.es' },
  localized: {
    es: {
      tagline: 'Sin café no hay código.',
      defaultSeo: {
        title: 'coffeeProjects — Desarrollo web y software a medida',
        description: 'Webs, tiendas online, bots de Discord y servidores FiveM a medida. Estudio de desarrollo en España. Propuesta en menos de 24 horas.',
      },
    },
    en: {
      tagline: 'No coffee, no code.',
      defaultSeo: {
        title: 'coffeeProjects — Web development and custom software',
        description: 'Custom websites, online stores, Discord bots and FiveM servers. Development studio in Spain. Proposal in under 24 hours.',
      },
    },
    fr: {
      tagline: 'Pas de café, pas de code.',
      defaultSeo: {
        title: 'coffeeProjects — Développement web et logiciels sur mesure',
        description: 'Sites web, boutiques en ligne, bots Discord et serveurs FiveM sur mesure. Studio de développement en Espagne. Proposition en moins de 24 heures.',
      },
    },
  },
}
```

- [ ] **Step 6: Data — services `src/seed/data/services.ts`**

```ts
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
    shared: { icon: 'globe', contactType: 'web', pricing: { mode: 'one-off', amount: 600 }, tags: ['Astro', 'Next.js', 'Tailwind', 'GSAP', 'Vercel'], order: 1 },
    localized: {
      es: {
        title: 'Webs & landing pages',
        slug: 'webs-y-landing-pages',
        promise: 'Una web rápida, bonita y pensada para traer clientes.',
        summary: 'Sitios rápidos, orientados a conversión y optimizados para SEO, con stack moderno y despliegue incluido.',
        typicalTime: '1-2 semanas',
        note: 'Plan de mantenimiento post-venta opcional.',
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
        seo: { title: 'Diseño de páginas web y landing pages', description: 'Webs y landing pages rápidas, optimizadas para SEO y orientadas a conseguir clientes. Desde 600 €, listas en 1-2 semanas.' },
      },
      en: {
        title: 'Websites & landing pages',
        slug: 'websites-and-landing-pages',
        promise: 'A fast, beautiful website built to bring you clients.',
        summary: 'Fast, conversion-focused, SEO-optimized websites with a modern stack and deployment included.',
        typicalTime: '1-2 weeks',
        note: 'Optional post-launch maintenance plan.',
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
        seo: { title: 'Website and landing page design', description: 'Fast, SEO-optimized websites and landing pages built to win clients. From €600, ready in 1-2 weeks.' },
      },
      fr: {
        title: 'Sites web & landing pages',
        slug: 'sites-web-et-landing-pages',
        promise: 'Un site rapide, élégant et pensé pour vous apporter des clients.',
        summary: 'Des sites rapides, orientés conversion et optimisés pour le SEO, avec une stack moderne et la mise en ligne incluse.',
        typicalTime: '1 à 2 semaines',
        note: 'Formule de maintenance après livraison en option.',
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
        seo: { title: 'Création de sites web et landing pages', description: 'Sites web et landing pages rapides, optimisés pour le SEO et pensés pour gagner des clients. À partir de 600 €, prêts en 1 à 2 semaines.' },
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
    shared: { icon: 'wrench', contactType: 'maintenance', pricing: { mode: 'monthly', amount: 35 }, tags: ['Backups', 'Updates', 'Monitoring'], order: 6 },
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
        seo: { title: 'Mantenimiento web mensual', description: 'Mantenimiento web con actualizaciones, copias de seguridad, monitorización y soporte. Para cualquier web. Desde 35 €/mes.' },
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
        seo: { title: 'Monthly website maintenance', description: 'Website maintenance with updates, backups, monitoring and support. For any website. From €35/month.' },
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
        seo: { title: 'Maintenance web mensuelle', description: 'Maintenance de site avec mises à jour, sauvegardes, surveillance et support. Pour tout site. À partir de 35 €/mois.' },
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
```

- [ ] **Step 7: Data — team `src/seed/data/team.ts`**

```ts
import type { SeedDoc } from '../types'

type TeamShared = {
  name: string
  since: number
  skills: string[]
  order: number
  available: boolean
  github: { username?: string; fallbackRepos?: number; fallbackStars?: number }
  socials: { network: string; url: string; handle?: string }[]
}
type TeamLocalized = { slug: string; role: string; location: string; shortBio: string; bio: string }

export const team: SeedDoc<TeamShared, TeamLocalized>[] = [
  {
    shared: {
      name: 'Erik',
      since: 2026,
      skills: ['HTML', 'CSS', 'JavaScript', 'Astro', 'TypeScript', 'C#', 'Java', 'Python', 'Kotlin'],
      order: 1,
      available: true,
      // Username pending (spec Q1). Fallback shows the real public repo count meanwhile.
      github: { fallbackRepos: 3 },
      socials: [{ network: 'email', url: 'mailto:contact@coffeeprojects.es', handle: 'contact@coffeeprojects.es' }],
    },
    localized: {
      es: {
        slug: 'erik',
        role: 'Diseño & Relación con clientes',
        location: 'Murcia, España',
        shortBio: 'Tu primer contacto con coffeeProjects. Convierte tus ideas en diseños claros y se asegura de que el resultado final sea exactamente lo que necesitas.',
        bio: 'Erik es la persona con la que hablarás primero. Se encarga del diseño y de acompañarte durante todo el proyecto: escucha lo que necesitas, lo traduce en una propuesta visual clara y vela por que cada entrega cumpla lo acordado. Su base técnica, que va del desarrollo web con Astro y TypeScript a lenguajes como C#, Java, Python y Kotlin, le permite diseñar pensando en cómo se va a construir. Así evita sorpresas y consigue que diseño y desarrollo hablen el mismo idioma. Para ti, eso significa una comunicación cercana, respuestas rápidas y un proyecto que avanza sin malentendidos.',
      },
      en: {
        slug: 'erik',
        role: 'Design & Client Relations',
        location: 'Murcia, Spain',
        shortBio: 'Your first contact at coffeeProjects. He turns your ideas into clear designs and makes sure the final result is exactly what you need.',
        bio: "Erik is the first person you'll talk to. He leads design and stays with you throughout the project: he listens to what you need, turns it into a clear visual proposal and makes sure every delivery matches what was agreed. His technical background, from web development with Astro and TypeScript to languages such as C#, Java, Python and Kotlin, lets him design with the build in mind. That avoids surprises and keeps design and development speaking the same language. For you, that means close communication, fast answers and a project that moves forward without misunderstandings.",
      },
      fr: {
        slug: 'erik',
        role: 'Design & Relation client',
        location: 'Murcie, Espagne',
        shortBio: 'Votre premier contact chez coffeeProjects. Il transforme vos idées en designs clairs et veille à ce que le résultat final corresponde exactement à vos besoins.',
        bio: "Erik est la première personne avec qui vous échangerez. Il s'occupe du design et vous accompagne tout au long du projet : il écoute vos besoins, les traduit en une proposition visuelle claire et veille à ce que chaque livraison respecte ce qui a été convenu. Sa base technique, du développement web avec Astro et TypeScript à des langages comme C#, Java, Python et Kotlin, lui permet de concevoir en pensant à la réalisation. Résultat : pas de mauvaises surprises, et un design et un développement qui parlent la même langue. Pour vous, cela signifie une communication proche, des réponses rapides et un projet qui avance sans malentendus.",
      },
    },
  },
  {
    shared: {
      name: 'Diego',
      since: 2024,
      skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue'],
      order: 2,
      available: true,
      github: { username: 'Dieguito005' },
      socials: [{ network: 'github', url: 'https://github.com/Dieguito005', handle: '@Dieguito005' }],
    },
    localized: {
      es: {
        slug: 'diego',
        role: 'Frontend · Interfaces & experiencia de usuario',
        location: 'Tarancón (Cuenca), España',
        shortBio: 'Construye interfaces rápidas, accesibles y pensadas para convertir visitas en clientes.',
        bio: 'Diego da forma a todo lo que tus clientes ven y tocan. Está especializado en interfaces orientadas a la conversión, en componentes reutilizables que hacen que tu web crezca sin rehacerse y en el rendimiento, porque una web lenta pierde clientes. Ha trabajado en el rediseño de un portal web institucional para un ayuntamiento, mejorando su accesibilidad, velocidad y navegación, y en el desarrollo de coffeeprojects.es. Su objetivo en cada proyecto es que tu web no solo se vea bien, sino que funcione para tu negocio.',
      },
      en: {
        slug: 'diego',
        role: 'Frontend · Interfaces & User Experience',
        location: 'Tarancón (Cuenca), Spain',
        shortBio: 'Builds fast, accessible interfaces designed to turn visitors into clients.',
        bio: "Diego shapes everything your clients see and touch. He specializes in conversion-focused interfaces, reusable components that let your website grow without being rebuilt, and performance, because a slow website loses clients. He has worked on the redesign of an institutional web portal for a town council, improving its accessibility, speed and navigation, and on the development of coffeeprojects.es. His goal in every project is for your website not only to look good, but to work for your business.",
      },
      fr: {
        slug: 'diego',
        role: 'Frontend · Interfaces & expérience utilisateur',
        location: 'Tarancón (Cuenca), Espagne',
        shortBio: 'Crée des interfaces rapides, accessibles et pensées pour transformer les visiteurs en clients.',
        bio: "Diego façonne tout ce que vos clients voient et touchent. Il est spécialisé dans les interfaces orientées conversion, les composants réutilisables qui permettent à votre site d'évoluer sans être refait, et la performance, car un site lent fait fuir les clients. Il a participé à la refonte du portail web institutionnel d'une mairie, en améliorant son accessibilité, sa vitesse et sa navigation, ainsi qu'au développement de coffeeprojects.es. Son objectif à chaque projet : que votre site ne soit pas seulement beau, mais qu'il travaille pour votre activité.",
      },
    },
  },
  {
    shared: {
      name: 'Juan',
      since: 2020,
      skills: ['Lua', 'JavaScript', 'HTML', 'CSS', 'FiveM', 'ESX', 'QBCore'],
      order: 3,
      available: true,
      github: { username: 'TtvNekix' },
      socials: [
        { network: 'github', url: 'https://github.com/TtvNekix', handle: '@TtvNekix' },
        { network: 'twitch', url: 'https://twitch.tv/ttvnekix', handle: '@ttvnekix' },
      ],
    },
    localized: {
      es: {
        slug: 'juan',
        role: 'Backend · Sistemas & FiveM',
        location: 'España',
        shortBio: 'Más de 50 scripts publicados para FiveM. Sistemas sólidos, optimizados y listos para producción.',
        bio: 'Juan es quien hace que todo funcione por detrás. Lleva programando desde 2020 y ha publicado más de 50 scripts para servidores FiveM, como sistemas de reparto, concesionarios, gimnasios o inventarios, usados por comunidades reales. Domina los frameworks ESX y QBCore y escribe código Lua limpio y optimizado para alto rendimiento. Cuando tu proyecto necesita lógica, integraciones o un sistema que aguante carga, Juan se encarga de que sea estable, rápido y fácil de mantener.',
      },
      en: {
        slug: 'juan',
        role: 'Backend · Systems & FiveM',
        location: 'Spain',
        shortBio: '50+ published FiveM scripts. Solid, optimized, production-ready systems.',
        bio: "Juan is the one who makes everything work behind the scenes. He has been programming since 2020 and has published more than 50 scripts for FiveM servers, such as delivery jobs, car dealerships, gyms and inventories, used by real communities. He masters the ESX and QBCore frameworks and writes clean Lua code optimized for high performance. When your project needs business logic, integrations or a system that holds up under load, Juan makes sure it's stable, fast and easy to maintain.",
      },
      fr: {
        slug: 'juan',
        role: 'Backend · Systèmes & FiveM',
        location: 'Espagne',
        shortBio: 'Plus de 50 scripts FiveM publiés. Des systèmes solides, optimisés et prêts pour la production.',
        bio: "Juan est celui qui fait tout fonctionner en coulisses. Il programme depuis 2020 et a publié plus de 50 scripts pour serveurs FiveM, comme des métiers de livraison, des concessionnaires, des salles de sport ou des inventaires, utilisés par de vraies communautés. Il maîtrise les frameworks ESX et QBCore et écrit un code Lua propre et optimisé pour de hautes performances. Quand votre projet a besoin de logique métier, d'intégrations ou d'un système qui tient la charge, Juan s'assure qu'il soit stable, rapide et facile à maintenir.",
      },
    },
  },
]
```

- [ ] **Step 8: Data — projects `src/seed/data/projects.ts`**

```ts
import type { SeedDoc } from '../types'

type ProjectShared = { stack: string[]; year: number; status: 'live' | 'in-progress'; url?: string; nda: boolean; featured: boolean }
type ProjectLocalized = { slug: string; title: string; category: string; summary: string }

export const projects: SeedDoc<ProjectShared, ProjectLocalized>[] = [
  {
    shared: { stack: ['Next.js', 'Payload CMS', 'GSAP', 'Three.js'], year: 2026, status: 'live', url: 'https://coffeeprojects.es', nda: false, featured: true },
    localized: {
      es: { slug: 'coffeeprojects-es', title: 'coffeeprojects.es', category: 'Web corporativa', summary: 'Nuestra propia web: diseño y desarrollo completo, trilingüe, con panel de gestión propio, animaciones y SEO técnico.' },
      en: { slug: 'coffeeprojects-es', title: 'coffeeprojects.es', category: 'Corporate website', summary: 'Our own website: full design and development, trilingual, with its own admin panel, animations and technical SEO.' },
      fr: { slug: 'coffeeprojects-es', title: 'coffeeprojects.es', category: "Site d'entreprise", summary: "Notre propre site : design et développement complets, trilingue, avec son propre panneau d'administration, des animations et un SEO technique." },
    },
  },
  {
    shared: { stack: ['HTML', 'CSS', 'JavaScript'], year: 2025, status: 'live', nda: true, featured: true },
    localized: {
      es: { slug: 'portal-web-institucional', title: 'Portal web institucional', category: 'Web institucional', summary: 'Rediseño y mejora de rendimiento de la web de un ayuntamiento: mayor accesibilidad, velocidad de carga y una navegación más clara.' },
      en: { slug: 'institutional-web-portal', title: 'Institutional web portal', category: 'Public sector website', summary: "Redesign and performance improvements for a town council's website: better accessibility, faster loading and clearer navigation." },
      fr: { slug: 'portail-web-institutionnel', title: 'Portail web institutionnel', category: 'Site institutionnel', summary: "Refonte et amélioration des performances du site d'une mairie : meilleure accessibilité, chargement plus rapide et navigation plus claire." },
    },
  },
  {
    shared: { stack: ['React', 'Node.js'], year: 2026, status: 'in-progress', nda: false, featured: true },
    localized: {
      es: { slug: 'que-comemos-hoy', title: '¿Qué comemos hoy?', category: 'Aplicación web', summary: 'Aplicación web para gestionar y decidir el menú del día, con recetas, filtros por ingredientes y sugerencias aleatorias.' },
      en: { slug: 'what-should-we-eat-today', title: 'What should we eat today?', category: 'Web app', summary: "A web app to plan and decide the day's menu, with recipes, ingredient filters and random suggestions." },
      fr: { slug: 'on-mange-quoi-aujourd-hui', title: "On mange quoi aujourd'hui ?", category: 'Application web', summary: 'Une application web pour organiser et choisir le menu du jour, avec recettes, filtres par ingrédients et suggestions aléatoires.' },
    },
  },
  {
    shared: { stack: ['React', 'Dashboard'], year: 2026, status: 'in-progress', nda: true, featured: true },
    localized: {
      es: { slug: 'trading-journal', title: 'Trading Journal', category: 'Dashboard privado', summary: 'Plataforma privada de seguimiento de operaciones financieras: registro de operaciones, métricas de rendimiento y estadísticas visuales.' },
      en: { slug: 'trading-journal', title: 'Trading Journal', category: 'Private dashboard', summary: 'Private platform to track financial trades: trade log, performance metrics and visual statistics.' },
      fr: { slug: 'trading-journal', title: 'Trading Journal', category: 'Tableau de bord privé', summary: 'Plateforme privée de suivi des opérations financières : journal des opérations, indicateurs de performance et statistiques visuelles.' },
    },
  },
]
```

- [ ] **Step 9: Data — FAQs `src/seed/data/faqs.ts`**

```ts
import type { Localized } from '../types'

type QA = { question: string; answer: string }

export const faqs: { order: number; localized: Localized<QA> }[] = [
  {
    order: 1,
    localized: {
      es: { question: '¿Cuánto tarda un proyecto?', answer: 'Depende del alcance. Una landing sencilla: 1-2 semanas. Una tienda online: 4-8 semanas. Un script de FiveM: días. Tras la primera llamada te damos un plazo concreto basado en el alcance real.' },
      en: { question: 'How long does a project take?', answer: 'It depends on the scope. A simple landing page: 1-2 weeks. An online store: 4-8 weeks. A FiveM script: days. After the first call we give you a concrete timeline based on the real scope.' },
      fr: { question: 'Combien de temps dure un projet ?', answer: 'Cela dépend du périmètre. Une landing page simple : 1 à 2 semaines. Une boutique en ligne : 4 à 8 semaines. Un script FiveM : quelques jours. Après le premier appel, nous vous donnons un délai précis basé sur le périmètre réel.' },
    },
  },
  {
    order: 2,
    localized: {
      es: { question: '¿Cuánto cuesta?', answer: 'Cada proyecto es diferente, por eso trabajamos con presupuestos personalizados. Cuéntanos tu idea y te enviamos una propuesta detallada con entregables, plazos y coste total. Sin costes ocultos.' },
      en: { question: 'How much does it cost?', answer: 'Every project is different, so we work with tailored quotes. Tell us your idea and we will send a detailed proposal with deliverables, timeline and total cost. No hidden fees.' },
      fr: { question: 'Combien ça coûte ?', answer: 'Chaque projet est différent, c’est pourquoi nous travaillons sur devis personnalisé. Partagez votre idée et nous vous enverrons une proposition détaillée avec livrables, délais et coût total. Sans frais cachés.' },
    },
  },
  {
    order: 3,
    localized: {
      es: { question: '¿Cómo es el proceso desde la primera llamada?', answer: 'Empezamos con una llamada de descubrimiento de 30-45 minutos. Después te enviamos una propuesta con entregables y precio cerrado. Con un adelanto del 30-50% arrancamos, con revisiones semanales. Tras las pruebas y ajustes finales: entrega, pago restante y, si quieres, plan de mantenimiento.' },
      en: { question: 'What happens after the first call?', answer: 'We start with a 30-45 minute discovery call. Then we send you a proposal with deliverables and a fixed price. With a 30-50% deposit we get started, with weekly reviews. After testing and final tweaks: delivery, remaining payment and, if you want, a maintenance plan.' },
      fr: { question: 'Comment se déroule le projet après le premier appel ?', answer: 'Nous commençons par un appel de découverte de 30 à 45 minutes. Nous vous envoyons ensuite une proposition avec livrables et prix fixe. Avec un acompte de 30 à 50 %, nous démarrons, avec des revues hebdomadaires. Après les tests et derniers ajustements : livraison, solde et, si vous le souhaitez, formule de maintenance.' },
    },
  },
  {
    order: 4,
    localized: {
      es: { question: '¿Cómo trabajáis si estáis en ciudades diferentes?', answer: 'Trabajamos en remoto desde Murcia, Tarancón y otros puntos de España, con coordinación diaria en tiempo real, revisiones cruzadas de código y un único punto de contacto para ti. La distancia no afecta ni a la calidad ni a los plazos.' },
      en: { question: 'How do you work from different cities?', answer: 'We work remotely from Murcia, Tarancón and other parts of Spain, with daily real-time coordination, cross code reviews and a single point of contact for you. Distance affects neither quality nor deadlines.' },
      fr: { question: 'Comment travaillez-vous depuis des villes différentes ?', answer: 'Nous travaillons à distance depuis Murcie, Tarancón et d’autres villes d’Espagne, avec une coordination quotidienne en temps réel, des revues de code croisées et un interlocuteur unique pour vous. La distance n’affecte ni la qualité ni les délais.' },
    },
  },
  {
    order: 5,
    localized: {
      es: { question: '¿Aceptáis cambios de alcance a mitad del proyecto?', answer: 'Sí, son habituales. Los gestionamos como un anexo al presupuesto inicial: te enviamos coste y plazo del cambio antes de hacerlo, y tú decides. Nada se factura sin tu aprobación.' },
      en: { question: 'Do you accept scope changes mid-project?', answer: 'Yes, they are common. We handle them as an addendum to the original quote: we send you the cost and timeline of the change before doing it, and you decide. Nothing is billed without your approval.' },
      fr: { question: 'Acceptez-vous les changements de périmètre en cours de projet ?', answer: 'Oui, c’est courant. Nous les traitons comme un avenant au devis initial : nous vous envoyons le coût et le délai du changement avant de le réaliser, et vous décidez. Rien n’est facturé sans votre accord.' },
    },
  },
  {
    order: 6,
    localized: {
      es: { question: '¿Hacéis mantenimiento después?', answer: 'Sí. Ofrecemos planes mensuales de mantenimiento (actualizaciones, copias de seguridad, monitorización) o trabajo por bolsa de horas si prefieres algo más flexible.' },
      en: { question: 'Do you offer maintenance afterwards?', answer: 'Yes. We offer monthly maintenance plans (updates, backups, monitoring) or a block of hours if you prefer something more flexible.' },
      fr: { question: 'Assurez-vous la maintenance ensuite ?', answer: 'Oui. Nous proposons des formules de maintenance mensuelle (mises à jour, sauvegardes, surveillance) ou un forfait d’heures si vous préférez plus de souplesse.' },
    },
  },
  {
    order: 7,
    localized: {
      es: { question: '¿Trabajáis con la tecnología que necesito?', answer: 'Con toda probabilidad, sí. Si no dominamos una tecnología concreta, te lo decimos con claridad antes de comprometernos. Solo aceptamos proyectos que podamos entregar con garantías.' },
      en: { question: 'Do you work with the technology I need?', answer: "Most likely, yes. If we don't master a specific technology, we tell you clearly before committing. We only take on projects we can deliver with confidence." },
      fr: { question: 'Travaillez-vous avec la technologie dont j’ai besoin ?', answer: 'Très probablement, oui. Si nous ne maîtrisons pas une technologie précise, nous vous le disons clairement avant de nous engager. Nous n’acceptons que les projets que nous pouvons livrer avec garantie.' },
    },
  },
  {
    order: 8,
    localized: {
      es: { question: '¿Quién tiene los derechos del código?', answer: 'Una vez completado el pago, todos los derechos del código a medida pasan a ti. Solo usamos una referencia general del proyecto en nuestro portfolio si nos das permiso, y respetamos cualquier NDA firmado.' },
      en: { question: 'Who owns the code?', answer: 'Once paid in full, all rights to the custom code are yours. We only mention the project in our portfolio with your permission, and we respect any signed NDA.' },
      fr: { question: 'À qui appartient le code ?', answer: 'Une fois le paiement effectué, tous les droits sur le code sur mesure vous appartiennent. Nous ne mentionnons le projet dans notre portfolio qu’avec votre accord, et nous respectons tout NDA signé.' },
    },
  },
  {
    order: 9,
    localized: {
      es: { question: '¿Firmáis NDA?', answer: 'Claro. Si tu proyecto lo requiere, firmamos antes de recibir cualquier detalle sensible.' },
      en: { question: 'Do you sign NDAs?', answer: 'Of course. If your project requires it, we sign before receiving any sensitive details.' },
      fr: { question: 'Signez-vous des NDA ?', answer: 'Bien sûr. Si votre projet l’exige, nous signons avant de recevoir le moindre détail sensible.' },
    },
  },
  {
    order: 10,
    localized: {
      es: { question: '¿En qué idiomas atendéis?', answer: 'Atendemos en español e inglés. Nuestra web está disponible en español, inglés y francés.' },
      en: { question: 'Which languages do you work in?', answer: 'We work in Spanish and English. Our website is available in Spanish, English and French.' },
      fr: { question: 'Dans quelles langues travaillez-vous ?', answer: 'Nous travaillons en espagnol et en anglais. Notre site est disponible en espagnol, en anglais et en français.' },
    },
  },
]
```

> FAQ #10 follows spec Q9's safe default (no French service claim). If the team confirms French support, edit it in the admin panel — no code change needed.

- [ ] **Step 10: Data — legal drafts `src/seed/data/legal.ts`**

```ts
import { lexical } from '../lexical'
import type { Localized } from '../types'

const P = (text: string) => ({ p: text })
const H = (text: string) => ({ h2: text })

export const legal: Localized<{ legalNotice: unknown; privacyPolicy: unknown; cookiePolicy: unknown }> = {
  es: {
    legalNotice: lexical([
      H('Datos identificativos'),
      P('Titular: [PENDIENTE: razón social]. NIF/CIF: [PENDIENTE]. Domicilio: [PENDIENTE]. Email: contact@coffeeprojects.es.'),
      H('Objeto'),
      P('Este sitio web informa sobre los servicios de desarrollo de software de coffeeProjects y permite solicitar presupuestos.'),
      H('Propiedad intelectual'),
      P('Los contenidos, el diseño y el código de este sitio pertenecen a su titular salvo que se indique lo contrario.'),
      H('Legislación aplicable'),
      P('Este aviso legal se rige por la legislación española (LSSI-CE).'),
    ]),
    privacyPolicy: lexical([
      H('Responsable del tratamiento'),
      P('[PENDIENTE: razón social], NIF/CIF [PENDIENTE], contact@coffeeprojects.es.'),
      H('Qué datos tratamos y para qué'),
      P('Los datos que nos envías en el formulario de contacto (nombre, email, teléfono opcional y descripción del proyecto) se usan únicamente para responder a tu solicitud y preparar un presupuesto.'),
      H('Base legal'),
      P('Tu consentimiento al enviar el formulario y la aplicación de medidas precontractuales a petición tuya.'),
      H('Conservación'),
      P('Conservamos las solicitudes durante 12 meses si no se convierten en proyecto, salvo obligación legal.'),
      H('Destinatarios'),
      P('Proveedores que nos prestan servicios técnicos (alojamiento en Vercel, base de datos en Neon, envío de emails con Resend) con garantías adecuadas. No vendemos tus datos.'),
      H('Tus derechos'),
      P('Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a contact@coffeeprojects.es, y reclamar ante la Agencia Española de Protección de Datos (aepd.es).'),
    ]),
    cookiePolicy: lexical([
      H('Qué son las cookies'),
      P('Pequeños archivos que el navegador guarda para que la web funcione o para medir su uso.'),
      H('Cookies que usamos'),
      P('Necesarias: guardan tu elección de cookies (cp_consent, 6 meses). Marketing, solo con tu consentimiento: Meta Pixel (_fbp, _fbc) para medir nuestras campañas en Facebook e Instagram, y cp_attr (30 días) para saber qué campaña te trajo.'),
      H('Cómo cambiar tu elección'),
      P('Pulsa «Configurar cookies» en el pie de página en cualquier momento.'),
    ]),
  },
  en: {
    legalNotice: lexical([
      H('Company details'),
      P('Owner: [PENDING: legal name]. Tax ID: [PENDING]. Address: [PENDING]. Email: contact@coffeeprojects.es.'),
      H('Purpose'),
      P("This website presents coffeeProjects' software development services and lets you request quotes."),
      H('Intellectual property'),
      P('The content, design and code of this website belong to its owner unless stated otherwise.'),
      H('Applicable law'),
      P('This legal notice is governed by Spanish law (LSSI-CE).'),
    ]),
    privacyPolicy: lexical([
      H('Data controller'),
      P('[PENDING: legal name], Tax ID [PENDING], contact@coffeeprojects.es.'),
      H('What data we process and why'),
      P('The data you send through the contact form (name, email, optional phone and project description) is used only to answer your request and prepare a quote.'),
      H('Legal basis'),
      P('Your consent when submitting the form and pre-contractual measures taken at your request.'),
      H('Retention'),
      P('We keep requests for 12 months if they do not become a project, unless legally required otherwise.'),
      H('Recipients'),
      P('Providers of technical services (hosting on Vercel, database on Neon, email delivery with Resend) with appropriate safeguards. We never sell your data.'),
      H('Your rights'),
      P('You can exercise your rights of access, rectification, erasure, objection, restriction and portability by writing to contact@coffeeprojects.es, and lodge a complaint with the Spanish Data Protection Agency (aepd.es).'),
    ]),
    cookiePolicy: lexical([
      H('What cookies are'),
      P('Small files your browser stores so the website works or so its use can be measured.'),
      H('Cookies we use'),
      P('Necessary: store your cookie choice (cp_consent, 6 months). Marketing, only with your consent: Meta Pixel (_fbp, _fbc) to measure our campaigns on Facebook and Instagram, and cp_attr (30 days) to know which campaign brought you here.'),
      H('How to change your choice'),
      P('Click "Cookie settings" in the footer at any time.'),
    ]),
  },
  fr: {
    legalNotice: lexical([
      H("Informations sur l'éditeur"),
      P('Éditeur : [EN ATTENTE : raison sociale]. N° fiscal : [EN ATTENTE]. Adresse : [EN ATTENTE]. E-mail : contact@coffeeprojects.es.'),
      H('Objet'),
      P('Ce site présente les services de développement logiciel de coffeeProjects et permet de demander des devis.'),
      H('Propriété intellectuelle'),
      P('Les contenus, le design et le code de ce site appartiennent à son éditeur sauf mention contraire.'),
      H('Droit applicable'),
      P('Les présentes mentions légales sont régies par le droit espagnol (LSSI-CE).'),
    ]),
    privacyPolicy: lexical([
      H('Responsable du traitement'),
      P('[EN ATTENTE : raison sociale], n° fiscal [EN ATTENTE], contact@coffeeprojects.es.'),
      H('Données traitées et finalités'),
      P('Les données envoyées via le formulaire de contact (nom, e-mail, téléphone facultatif et description du projet) servent uniquement à répondre à votre demande et à préparer un devis.'),
      H('Base légale'),
      P('Votre consentement lors de l’envoi du formulaire et des mesures précontractuelles prises à votre demande.'),
      H('Conservation'),
      P('Nous conservons les demandes 12 mois si elles ne deviennent pas un projet, sauf obligation légale.'),
      H('Destinataires'),
      P('Des prestataires techniques (hébergement chez Vercel, base de données chez Neon, envoi d’e-mails avec Resend) offrant des garanties appropriées. Nous ne vendons jamais vos données.'),
      H('Vos droits'),
      P('Vous pouvez exercer vos droits d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité en écrivant à contact@coffeeprojects.es, et introduire une réclamation auprès de l’autorité espagnole de protection des données (aepd.es).'),
    ]),
    cookiePolicy: lexical([
      H('Que sont les cookies ?'),
      P('De petits fichiers enregistrés par votre navigateur pour faire fonctionner le site ou mesurer son utilisation.'),
      H('Cookies utilisés'),
      P('Nécessaires : enregistrent votre choix de cookies (cp_consent, 6 mois). Marketing, uniquement avec votre accord : Meta Pixel (_fbp, _fbc) pour mesurer nos campagnes sur Facebook et Instagram, et cp_attr (30 jours) pour savoir quelle campagne vous a amené ici.'),
      H('Modifier votre choix'),
      P('Cliquez sur « Gérer les cookies » en bas de page à tout moment.'),
    ]),
  },
}
```

- [ ] **Step 11: Run data test — expect PASS**

```bash
pnpm vitest run tests/unit/seed-data.test.ts
```

- [ ] **Step 12: Seed runner `src/seed/index.ts`**

```ts
import config from '@payload-config'
import { getPayload } from 'payload'
import { locales } from '@/i18n/locales'
import { faqs } from './data/faqs'
import { home, homeData } from './data/home'
import { legal } from './data/legal'
import { projects } from './data/projects'
import { services } from './data/services'
import { settings } from './data/settings'
import { team } from './data/team'
import { upsertGlobal, upsertLocalized } from './upsert'

const payload = await getPayload({ config })

for (const s of services) {
  await upsertLocalized(payload, 'services', { field: 'slug', value: s.localized.es.slug }, s.shared, s.localized, { drafts: true })
}
for (const m of team) {
  await upsertLocalized(payload, 'team-members', { field: 'slug', value: m.localized.es.slug }, m.shared, m.localized, { drafts: true })
}
for (const p of projects) {
  await upsertLocalized(payload, 'projects', { field: 'slug', value: p.localized.es.slug }, p.shared, p.localized, { drafts: true })
}
for (const f of faqs) {
  await upsertLocalized(payload, 'faqs', { field: 'order', value: f.order }, { order: f.order }, f.localized, { drafts: false })
}

await upsertGlobal(payload, 'site-settings', settings.shared, settings.localized, { drafts: false })
await upsertGlobal(payload, 'legal', { companyComplete: false }, legal, { drafts: false })

// Home: write ES with stats rows, read back row ids, then write EN/FR labels onto the same rows.
await payload.updateGlobal({
  slug: 'home',
  locale: 'es',
  data: {
    ...homeData('es'),
    stack: home.shared.stack,
    stats: home.shared.stats.map((s, i) => ({ ...s, label: home.localized.es.statLabels[i] })),
    _status: 'published',
  } as never,
})
const saved = await payload.findGlobal({ slug: 'home', locale: 'es', draft: true })
const rowIds = (saved.stats ?? []).map((r) => r.id)
for (const locale of locales.filter((l) => l !== 'es')) {
  await payload.updateGlobal({
    slug: 'home',
    locale,
    data: {
      ...homeData(locale),
      stats: home.shared.stats.map((s, i) => ({ ...s, id: rowIds[i], label: home.localized[locale].statLabels[i] })),
      _status: 'published',
    } as never,
  })
}

payload.logger.info('Seed complete')
process.exit(0)
```

- [ ] **Step 13: Run the seed twice (idempotency)**

```bash
pnpm seed
pnpm seed
```

Expected: both runs finish with `Seed complete`; in `/admin` there are exactly 7 services, 3 team members, 4 projects, 10 FAQs (no duplicates); switching the admin locale to EN/FR shows translated fields; Home stats show labels in all 3 locales.

- [ ] **Step 14: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(cms): add idempotent trilingual seed with initial content"
```
