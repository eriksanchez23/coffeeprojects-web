import { describe, expect, it } from 'vitest'
import { switchHref } from '@/i18n/switch-href'

const at = (pathname: string, search = '', hash = '') => ({ pathname, search, hash })

describe('language switcher href', () => {
  it('keeps the query string and hash, so preselected choices survive the switch', () => {
    expect(switchHref('/en/contact', at('/contacto', '?type=redesign&url=miweb.es'))).toBe('/en/contact?type=redesign&url=miweb.es')
    expect(switchHref('/fr/tarifs', at('/precios', '', '#plan-tienda-online'))).toBe('/fr/tarifs#plan-tienda-online')
    expect(switchHref('/contacto', at('/en/contact', '?type=web&plan=landing-page', '#form'))).toBe('/contacto?type=web&plan=landing-page#form')
  })

  it('returns the plain alternate when there is nothing to carry', () => {
    expect(switchHref('/en', at('/'))).toBe('/en')
    expect(switchHref('/en', at('/', '?', '#'))).toBe('/en')
  })

  it('never carries the thank-you proof (?e=) to another language', () => {
    expect(switchHref('/en/contact/thanks', at('/contacto/gracias', '?e=abc-123'))).toBe('/en/contact/thanks')
    expect(switchHref('/contacto/gracias', at('/fr/contact/merci/', '?e=abc'))).toBe('/contacto/gracias')
  })

  it('replaces any query or hash already on the alternate', () => {
    expect(switchHref('/en/contact?old=1#x', at('/contacto', '?type=web'))).toBe('/en/contact?type=web')
  })
})
