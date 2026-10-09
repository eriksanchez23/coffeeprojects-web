import type { Locale } from '@/i18n/locales'
import { env } from '@/lib/env'
import { completeMaintenancePlans, completeWebPlans } from '@/lib/pricing'
import type { Project, Service, TeamMember } from '@/payload-types'

const ORG_ID = () => `${env.SITE_URL}/#organization`

export function organizationLd(email: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID(),
    name: 'CoffeeProjects',
    url: env.SITE_URL,
    email,
    slogan: 'Sin café no hay código',
    areaServed: [{ '@type': 'Country', name: 'Spain' }, 'Worldwide'],
    address: { '@type': 'PostalAddress', addressCountry: 'ES' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email, availableLanguage: ['es', 'en', 'fr'] },
    knowsAbout: ['Web development', 'E-commerce', 'Next.js', 'SEO', 'FiveM', 'Discord bots'],
  }
}

export function websiteLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: env.SITE_URL,
    name: 'CoffeeProjects',
    inLanguage: locale,
    publisher: { '@id': ORG_ID() },
  }
}

export function serviceLd(s: Pick<Service, 'title' | 'summary' | 'pricing'>, url: string, locale: Locale) {
  const amount = s.pricing?.mode === 'one-off' || s.pricing?.mode === 'monthly' ? s.pricing.amount : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.summary,
    url,
    inLanguage: locale,
    provider: { '@id': ORG_ID() },
    areaServed: 'Worldwide',
    offers:
      amount != null
        ? {
            '@type': 'Offer',
            price: amount,
            priceCurrency: 'EUR',
            ...(s.pricing?.mode === 'monthly'
              ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: amount, priceCurrency: 'EUR', unitCode: 'MON' } }
              : {}),
          }
        : undefined,
  }
}

export function personLd(m: Pick<TeamMember, 'name' | 'role' | 'shortBio' | 'skills' | 'socials'>, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: m.name,
    jobTitle: m.role,
    description: m.shortBio,
    url,
    worksFor: { '@id': ORG_ID() },
    knowsAbout: m.skills ?? [],
    sameAs: (m.socials ?? []).map((s) => s.url).filter((u) => u.startsWith('http')),
  }
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
  }
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  }
}

export function projectLd(p: Pick<Project, 'title' | 'summary' | 'year' | 'stack'>, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.summary,
    dateCreated: String(p.year),
    keywords: (p.stack ?? []).join(', '),
    url,
    creator: { '@id': ORG_ID() },
  }
}

type PricingInput = {
  title: string
  packages?:
    | { name: string; pitch?: string | null; priceWithMaintenance?: number | null; priceWebOnly?: number | null; fromPrice?: boolean | null }[]
    | null
  maintenancePlans?: { name: string; pitch?: string | null; monthlyPrice?: number | null; permanenceMonths?: number | null }[] | null
  customSupport?: { title?: string | null; text?: string | null; fromPrice?: number | null } | null
}
type PricingLabels = { withMaintenance: string; webOnly: string }

const exVat = { priceCurrency: 'EUR', valueAddedTaxIncluded: false } as const
const monthly = { unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } } as const
/** A fixed price, or a minimum one for "from" prices. */
const amount = (value: number, from: boolean) => (from ? { minPrice: value } : { price: value })

/**
 * Pricing page (v4): one Offer per web plan (price with maintenance and web only, VAT excluded; "from" plans as
 * minimum prices), one per maintenance plan (monthly fee) and tailored support (monthly minimum).
 * Plans without prices (rows left by an older schema) are skipped, like on the page.
 */
export function pricingLd(p: PricingInput, url: string, labels: PricingLabels) {
  const seller = { '@id': ORG_ID() }
  const offer = (name: string, description: string | null | undefined) => ({
    '@type': 'Offer',
    name,
    ...(description ? { description } : {}),
    url,
    priceCurrency: 'EUR',
    seller,
  })
  const web = completeWebPlans(p.packages).map((plan) => {
    const from = Boolean(plan.fromPrice)
    return {
      ...offer(plan.name, plan.pitch),
      ...(from ? {} : { price: plan.priceWithMaintenance }),
      priceSpecification: [
        { '@type': 'UnitPriceSpecification', name: labels.withMaintenance, ...amount(plan.priceWithMaintenance as number, from), ...exVat },
        { '@type': 'UnitPriceSpecification', name: labels.webOnly, ...amount(plan.priceWebOnly as number, from), ...exVat },
      ] as Record<string, unknown>[],
    }
  })
  const maintenance = completeMaintenancePlans(p.maintenancePlans).map((plan) => ({
    ...offer(plan.name, plan.pitch),
    price: plan.monthlyPrice,
    priceSpecification: [{ '@type': 'UnitPriceSpecification', price: plan.monthlyPrice, ...exVat, ...monthly }] as Record<string, unknown>[],
  }))
  const c = p.customSupport
  const support =
    c?.title && c.fromPrice != null
      ? [
          {
            ...offer(c.title, c.text),
            priceSpecification: [{ '@type': 'UnitPriceSpecification', minPrice: c.fromPrice, ...exVat, ...monthly }] as Record<string, unknown>[],
          },
        ]
      : []
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: p.title,
    url,
    itemListElement: [...web, ...maintenance, ...support] as (Record<string, unknown> & { name: string; priceSpecification: Record<string, unknown>[] })[],
  }
}
