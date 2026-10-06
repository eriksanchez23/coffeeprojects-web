import { describe, expect, it } from 'vitest'
import { routing } from '@/i18n/routing'

describe('i18n routing', () => {
  it('sends no hreflang Link header: pages emit their own (slug-aware) alternates in <head>', () => {
    // next-intl's header only knows static pathnames, so for localized slugs it would contradict the page.
    expect(routing.alternateLinks).toBe(false)
  })
})
