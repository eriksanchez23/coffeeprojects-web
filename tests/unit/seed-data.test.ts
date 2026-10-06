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
