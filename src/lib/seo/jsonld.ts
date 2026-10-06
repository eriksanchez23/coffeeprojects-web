import type { Locale } from '@/i18n/locales'
import { env } from '@/lib/env'
import type { Project, Service, TeamMember } from '@/payload-types'

const ORG_ID = () => `${env.SITE_URL}/#organization`

export function organizationLd(email: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID(),
    name: 'coffeeProjects',
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
    name: 'coffeeProjects',
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
  packages?: { name: string; initialPrice: number; monthlyPrice?: number | null; items?: { text: string }[] | null }[] | null
  custom?: { title: string; description?: string | null; fromPrice?: number | null; monthlyPrice?: number | null } | null
}

const exVat = { priceCurrency: 'EUR', valueAddedTaxIncluded: false } as const
const monthlySpec = (price: number) => ({
  '@type': 'UnitPriceSpecification',
  price,
  ...exVat,
  unitCode: 'MON',
  referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
})

/** Pricing page: one Offer per package (initial payment + monthly fee, VAT excluded) plus the custom service ("from" price). */
export function pricingLd(p: PricingInput, url: string, locale: Locale) {
  const seller = { '@id': ORG_ID() }
  const packages = (p.packages ?? []).map((pkg) => ({
    '@type': 'Offer',
    name: pkg.name,
    description: (pkg.items ?? []).map((i) => i.text).join(' · '),
    url,
    price: pkg.initialPrice,
    priceCurrency: 'EUR',
    seller,
    priceSpecification: [
      { '@type': 'UnitPriceSpecification', price: pkg.initialPrice, ...exVat },
      ...(pkg.monthlyPrice != null ? [monthlySpec(pkg.monthlyPrice)] : []),
    ] as Record<string, unknown>[],
  }))
  const c = p.custom
  const custom =
    c?.fromPrice != null
      ? [
          {
            '@type': 'Offer',
            name: c.title,
            description: c.description ?? undefined,
            url,
            priceCurrency: 'EUR',
            seller,
            priceSpecification: [
              { '@type': 'UnitPriceSpecification', minPrice: c.fromPrice, ...exVat },
              ...(c.monthlyPrice != null ? [monthlySpec(c.monthlyPrice)] : []),
            ] as Record<string, unknown>[],
          },
        ]
      : []
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: p.title,
    url,
    inLanguage: locale,
    itemListElement: [...packages, ...custom],
  }
}
