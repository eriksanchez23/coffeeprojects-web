import { describe, expect, it } from 'vitest'
import { localizedPaths } from '@/i18n/paths'

describe('localizedPaths', () => {
  it('maps static pages with ES unprefixed', () => {
    expect(localizedPaths('/services')).toEqual({ es: '/servicios', en: '/en/services', fr: '/fr/services' })
    expect(localizedPaths('/team')).toEqual({ es: '/equipo', en: '/en/team', fr: '/fr/equipe' })
  })

  it('maps home', () => {
    expect(localizedPaths('/')).toEqual({ es: '/', en: '/en', fr: '/fr' })
  })

  it('uses a different slug per locale on dynamic pages', () => {
    const paths = localizedPaths('/services/[slug]', { es: 'tiendas-online', en: 'online-stores', fr: 'boutiques-en-ligne' })
    expect(paths).toEqual({
      es: '/servicios/tiendas-online',
      en: '/en/services/online-stores',
      fr: '/fr/services/boutiques-en-ligne',
    })
  })

  it('maps the thank-you page', () => {
    expect(localizedPaths('/contact/thanks')).toEqual({
      es: '/contacto/gracias',
      en: '/en/contact/thanks',
      fr: '/fr/contact/merci',
    })
  })
})

describe('partner programme page (S16)', () => {
  it('has a localized path in every locale', () => {
    expect(localizedPaths('/partners')).toEqual({ es: '/gana-dinero', en: '/en/earn-with-us', fr: '/fr/gagnez-avec-nous' })
  })
})
