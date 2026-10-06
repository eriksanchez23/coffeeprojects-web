import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTACT_EMAIL, withHomeDefaults, withLegalDefaults, withPricingDefaults, withSettingsDefaults } from '@/lib/cms/global-defaults'

// An empty (just-migrated) database returns a global with no groups/arrays, or nothing at all.
const empties = [undefined, null, {}, { id: 1, hero: null, sections: null }] as const

describe('withHomeDefaults', () => {
  it.each(empties)('gives every group, string and list a safe value for %o', (raw) => {
    const home = withHomeDefaults(raw as never)
    expect(home.hero).toEqual({ eyebrow: '', headline: '', subheadline: '', trustLine: '' })
    expect(home.sections.projectsTitle).toBe('')
    expect(home.sections.servicesLead).toBeNull()
    expect(home.stats).toEqual([])
    expect(home.whyUs).toEqual([])
    expect(home.process).toEqual([])
    expect(home.stack).toEqual([])
  })
  it('keeps the content that is there', () => {
    const home = withHomeDefaults({ hero: { headline: 'Hi' }, sections: { teamTitle: 'Team' }, stack: ['Next.js'] } as never)
    expect(home.hero.headline).toBe('Hi')
    expect(home.hero.eyebrow).toBe('')
    expect(home.sections.teamTitle).toBe('Team')
    expect(home.stack).toEqual(['Next.js'])
  })
})

describe('withSettingsDefaults', () => {
  it.each(empties)('falls back to the public contact email for %o', (raw) => {
    const settings = withSettingsDefaults(raw as never)
    expect(settings.contactEmail).toBe(DEFAULT_CONTACT_EMAIL)
    expect(settings.tagline).toBe('')
    expect(settings.socials).toEqual([])
    expect(settings.defaultSeo).toEqual({})
  })
  it('keeps a configured email', () => {
    expect(withSettingsDefaults({ contactEmail: 'team@example.com' } as never).contactEmail).toBe('team@example.com')
  })
})

describe('withPricingDefaults / withLegalDefaults', () => {
  it.each(empties)('never returns undefined lists or documents for %o', (raw) => {
    expect(withPricingDefaults(raw as never).packages).toEqual([])
    const legal = withLegalDefaults(raw as never)
    expect(legal.legalNotice ?? null).toBeNull()
    expect(legal.privacyPolicy ?? null).toBeNull()
    expect(legal.cookiePolicy ?? null).toBeNull()
  })
})
