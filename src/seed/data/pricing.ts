import type { Locale } from '@/i18n/locales'
import type { SeedDoc } from '../types'

// Source of truth: docs/05-pricing-es.md (transcribed verbatim from the price sheet). Prices are EUR, VAT excluded.
type Item = { text: string; excluded?: boolean }
type PackageShared = { slug: string; initialPrice: number; monthlyPrice: number; featured: boolean }
type PackageLocalized = { name: string; items: Item[]; ctaLabel: string }
type PricingShared = { packages: PackageShared[]; custom: { fromPrice: number; monthlyPrice: number } }
type PricingLocalized = {
  eyebrow: string
  title: string
  subtitle: string
  intro: string
  packages: PackageLocalized[]
  custom: { title: string; subtitle: string; description: string; ctaLabel: string }
  vatNote: string
  footnote: string
  seo: { title: string; description: string }
}

const no = (text: string): Item => ({ text, excluded: true })

export const pricing: SeedDoc<PricingShared, PricingLocalized> = {
  shared: {
    packages: [
      { slug: 'basico', initialPrice: 300, monthlyPrice: 20, featured: false },
      { slug: 'estandar', initialPrice: 400, monthlyPrice: 30, featured: true },
      { slug: 'profesional', initialPrice: 1000, monthlyPrice: 50, featured: false },
    ],
    custom: { fromPrice: 500, monthlyPrice: 20 },
  },
  localized: {
    es: {
      eyebrow: '// presupuestos',
      title: 'Propuesta de tarifas — Landing Pages y Mantenimiento',
      subtitle: 'Paquetes pensados para cada etapa de tu proyecto web',
      intro: 'Todos los paquetes incluyen landing page y dominio. Precios: pago inicial + cuota mensual.',
      packages: [
        {
          name: 'Básico',
          items: [
            { text: 'Landing Page' },
            { text: 'Dominio incluido' },
            no('Sin SEO'),
            { text: 'Mantenimiento básico: revisión de la web y corrección de fallos si los hay' },
          ],
          ctaLabel: 'Solicitar este paquete',
        },
        {
          name: 'Estándar',
          items: [
            { text: 'Landing Page' },
            { text: 'Dominio incluido' },
            { text: 'Con SEO' },
            { text: 'Mantenimiento avanzado: corrección de fallos, mantenimiento y actualización + SEO' },
          ],
          ctaLabel: 'Solicitar este paquete',
        },
        {
          name: 'Profesional',
          items: [
            { text: 'Landing Page' },
            { text: 'Dominio incluido' },
            { text: 'Con SEO' },
            { text: 'Panel de acceso privado' },
            { text: 'Automatizaciones (principalmente a WhatsApp)' },
            { text: 'Mantenimiento experto: todo tipo de soporte, actualización y mantenimiento de la web' },
          ],
          ctaLabel: 'Solicitar este paquete',
        },
      ],
      custom: {
        title: 'Servicio personalizado',
        subtitle: 'Servicios no detallados en ningún paquete',
        description: 'Para cualquier servicio no detallado en los paquetes anteriores.',
        ctaLabel: 'Pedir presupuesto a medida',
      },
      vatNote: '+ IVA',
      footnote: 'Los importes mostrados no incluyen IVA, que se aplicará según la normativa vigente.',
      seo: {
        title: 'Presupuestos: landing page y mantenimiento',
        description:
          'Paquetes Básico, Estándar y Profesional con landing page y dominio incluidos: pago inicial desde 300 € y cuota mensual. Precios sin IVA.',
      },
    },
    en: {
      eyebrow: '// pricing',
      title: 'Pricing — Landing Pages & Maintenance',
      subtitle: 'Packages designed for every stage of your web project',
      intro: 'Every package includes a landing page and a domain. Pricing: initial payment + monthly fee.',
      packages: [
        {
          name: 'Basic',
          items: [
            { text: 'Landing page' },
            { text: 'Domain included' },
            no('No SEO'),
            { text: 'Basic maintenance: website review and bug fixes if needed' },
          ],
          ctaLabel: 'Request this package',
        },
        {
          name: 'Standard',
          items: [
            { text: 'Landing page' },
            { text: 'Domain included' },
            { text: 'SEO included' },
            { text: 'Advanced maintenance: bug fixes, maintenance and updates + SEO' },
          ],
          ctaLabel: 'Request this package',
        },
        {
          name: 'Professional',
          items: [
            { text: 'Landing page' },
            { text: 'Domain included' },
            { text: 'SEO included' },
            { text: 'Private access panel' },
            { text: 'Automations (mainly to WhatsApp)' },
            { text: 'Expert maintenance: full support, updates and maintenance of your website' },
          ],
          ctaLabel: 'Request this package',
        },
      ],
      custom: {
        title: 'Custom service',
        subtitle: 'Services not covered by any package',
        description: 'For any service not covered by the packages above.',
        ctaLabel: 'Request a custom quote',
      },
      vatNote: '+ VAT',
      footnote: 'Prices shown exclude VAT, which will be applied in accordance with current regulations.',
      seo: {
        title: 'Pricing: landing pages and maintenance',
        description:
          'Basic, Standard and Professional packages with landing page and domain included: initial payment from €300 plus a monthly fee. Prices exclude VAT.',
      },
    },
    fr: {
      eyebrow: '// tarifs',
      title: 'Nos tarifs — Landing pages et maintenance',
      subtitle: 'Des formules pensées pour chaque étape de votre projet web',
      intro: 'Toutes les formules incluent une landing page et le nom de domaine. Tarifs : paiement initial + abonnement mensuel.',
      packages: [
        {
          name: 'Basique',
          items: [
            { text: 'Landing page' },
            { text: 'Nom de domaine inclus' },
            no('Sans SEO'),
            { text: 'Maintenance de base : vérification du site et correction des bugs le cas échéant' },
          ],
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Standard',
          items: [
            { text: 'Landing page' },
            { text: 'Nom de domaine inclus' },
            { text: 'SEO inclus' },
            { text: 'Maintenance avancée : correction des bugs, maintenance et mises à jour + SEO' },
          ],
          ctaLabel: 'Choisir cette formule',
        },
        {
          name: 'Professionnel',
          items: [
            { text: 'Landing page' },
            { text: 'Nom de domaine inclus' },
            { text: 'SEO inclus' },
            { text: 'Espace d’accès privé' },
            { text: 'Automatisations (principalement vers WhatsApp)' },
            { text: 'Maintenance experte : assistance complète, mises à jour et maintenance du site' },
          ],
          ctaLabel: 'Choisir cette formule',
        },
      ],
      custom: {
        title: 'Service personnalisé',
        subtitle: 'Services non couverts par nos formules',
        description: 'Pour tout service non détaillé dans les formules ci-dessus.',
        ctaLabel: 'Demander un devis sur mesure',
      },
      vatNote: '+ TVA',
      footnote: 'Les montants affichés s’entendent hors TVA, appliquée conformément à la réglementation en vigueur.',
      seo: {
        title: 'Tarifs : landing pages et maintenance',
        description:
          'Formules Basique, Standard et Professionnel avec landing page et nom de domaine inclus : paiement initial dès 300 € et abonnement mensuel. Prix HT.',
      },
    },
  },
}

/** Global data for one locale. `rowIds` (from the saved ES rows) keep EN/FR attached to the same package rows. */
export function pricingData(locale: Locale, rowIds: (string | null | undefined)[] = []) {
  const { packages, custom, ...rest } = pricing.localized[locale]
  return {
    ...rest,
    packages: pricing.shared.packages.map((p, i) => ({ ...p, ...packages[i], ...(rowIds[i] ? { id: rowIds[i] } : {}) })),
    custom: { ...pricing.shared.custom, ...custom },
  }
}
