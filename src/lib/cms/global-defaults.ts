import type { Home, Legal, Pricing, SiteSetting } from '@/payload-types'

/**
 * A just-migrated (or not yet seeded/published) database returns globals without their groups and arrays.
 * These helpers give every field the pages read a safe empty value, so prerendering never throws a
 * TypeError; pages then fall back to translated titles or `notFound()` where they have no content.
 */

/** Public inbox shown in the footer, contact page and Organization JSON-LD until Site settings is filled in. */
export const DEFAULT_CONTACT_EMAIL = 'contact@coffeeprojects.es'

type Raw<T> = Partial<T> | null | undefined

export function withHomeDefaults(raw: Raw<Home>): Home {
  const home = raw ?? {}
  return {
    ...home,
    id: home.id ?? 0,
    hero: { eyebrow: '', headline: '', subheadline: '', trustLine: '', ...home.hero },
    sections: {
      servicesTitle: '',
      servicesLead: null,
      whyTitle: '',
      processTitle: '',
      teamTitle: '',
      teamLead: null,
      projectsTitle: '',
      projectsLead: null,
      stackTitle: '',
      ...home.sections,
    },
    stats: home.stats ?? [],
    whyUs: home.whyUs ?? [],
    process: home.process ?? [],
    stack: home.stack ?? [],
  }
}

export function withSettingsDefaults(raw: Raw<SiteSetting>): SiteSetting {
  const settings = raw ?? {}
  return {
    ...settings,
    id: settings.id ?? 0,
    contactEmail: settings.contactEmail || DEFAULT_CONTACT_EMAIL,
    tagline: settings.tagline ?? '',
    socials: settings.socials ?? [],
    defaultSeo: settings.defaultSeo ?? {},
  }
}

export function withPricingDefaults(raw: Raw<Pricing>): Pricing {
  const pricing = raw ?? {}
  return {
    ...pricing,
    id: pricing.id ?? 0,
    eyebrow: pricing.eyebrow ?? '',
    title: pricing.title ?? '',
    webTitle: pricing.webTitle ?? '',
    maintenanceTitle: pricing.maintenanceTitle ?? '',
    packages: pricing.packages ?? [],
    webNotes: pricing.webNotes ?? [],
    maintenancePlans: pricing.maintenancePlans ?? [],
    customSupport: { ...pricing.customSupport },
    changeNotes: pricing.changeNotes ?? [],
    comparison: { ...pricing.comparison, rows: pricing.comparison?.rows ?? [] },
    permanenceRules: pricing.permanenceRules ?? [],
    extras: { ...pricing.extras, rows: pricing.extras?.rows ?? [] },
  }
}

export function withLegalDefaults(raw: Raw<Legal>): Legal {
  const legal = raw ?? {}
  return { ...legal, id: legal.id ?? 0 }
}
