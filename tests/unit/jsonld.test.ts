import { describe, expect, it } from 'vitest'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, faqLd, organizationLd, pricingLd, serviceLd } from '@/lib/seo/jsonld'

describe('json-ld', () => {
  it('organization is a ProfessionalService with contact point', () => {
    const o = organizationLd('contact@coffeeprojects.es')
    expect(o['@type']).toBe('ProfessionalService')
    expect(o.contactPoint).toMatchObject({ email: 'contact@coffeeprojects.es', availableLanguage: ['es', 'en', 'fr'] })
  })
  it('service includes a price offer only when there is an amount', () => {
    const s = serviceLd({ title: 'Webs', summary: 's', pricing: { mode: 'one-off', amount: 600 } } as never, 'https://x/s', 'es')
    expect(s.offers).toMatchObject({ '@type': 'Offer', price: 600, priceCurrency: 'EUR' })
    const c = serviceLd({ title: 'A medida', summary: 's', pricing: { mode: 'custom' } } as never, 'https://x/c', 'es')
    expect(c.offers).toBeUndefined()
  })
  it('faq maps questions', () => {
    expect(faqLd([{ question: 'Q', answer: 'A' }]).mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Q',
      acceptedAnswer: { '@type': 'Answer', text: 'A' },
    })
  })
  it('breadcrumb numbers positions from 1', () => {
    expect(breadcrumbLd([{ name: 'Inicio', url: 'https://x/' }, { name: 'Servicios', url: 'https://x/servicios' }]).itemListElement[1].position).toBe(2)
  })
  it('JsonLd escapes < so CMS strings cannot break out of the script tag', () => {
    const el = JsonLd({ data: { name: '</script><script>alert(1)</script>' } })
    const html = (el.props as { dangerouslySetInnerHTML: { __html: string } }).dangerouslySetInnerHTML.__html
    expect(html).not.toContain('<')
    expect(JSON.parse(html).name).toBe('</script><script>alert(1)</script>')
  })
})

describe('pricingLd', () => {
  const pricing = {
    title: 'Presupuestos',
    packages: [
      { slug: 'basico', name: 'Básico', initialPrice: 300, monthlyPrice: 20, items: [{ text: 'Landing Page' }, { text: 'Dominio incluido' }] },
      { slug: 'sin-cuota', name: 'Sin cuota', initialPrice: 100, monthlyPrice: null, items: [] },
    ],
    custom: { title: 'Servicio personalizado', description: 'Para cualquier servicio.', fromPrice: 500, monthlyPrice: 20 },
  }
  const ld = pricingLd(pricing as never, 'https://x/presupuestos', 'es')
  const offers = ld.itemListElement

  it('is an OfferCatalog with one Offer per package plus the custom service', () => {
    expect(ld['@type']).toBe('OfferCatalog')
    expect(ld.url).toBe('https://x/presupuestos')
    expect(offers).toHaveLength(3)
    expect(offers.every((o) => o['@type'] === 'Offer')).toBe(true)
  })

  it('splits the initial payment and the monthly fee, both excluding VAT', () => {
    expect(offers[0]).toMatchObject({ name: 'Básico', price: 300, priceCurrency: 'EUR', description: 'Landing Page · Dominio incluido' })
    expect(offers[0].priceSpecification).toEqual([
      { '@type': 'UnitPriceSpecification', price: 300, priceCurrency: 'EUR', valueAddedTaxIncluded: false },
      { '@type': 'UnitPriceSpecification', price: 20, priceCurrency: 'EUR', valueAddedTaxIncluded: false, unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } },
    ])
  })

  it('omits a monthly fee that does not exist', () => {
    expect(offers[1].priceSpecification).toHaveLength(1)
  })

  it('states the custom service as a minimum price, never a fixed one', () => {
    expect(offers[2]).toMatchObject({ name: 'Servicio personalizado', description: 'Para cualquier servicio.' })
    expect(offers[2]).not.toHaveProperty('price')
    expect(offers[2].priceSpecification[0]).toEqual({ '@type': 'UnitPriceSpecification', minPrice: 500, priceCurrency: 'EUR', valueAddedTaxIncluded: false })
  })
})
