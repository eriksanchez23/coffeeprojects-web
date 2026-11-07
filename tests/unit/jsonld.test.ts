import { describe, expect, it } from 'vitest'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, faqLd, organizationLd, pricingLd, serviceLd, websiteLd } from '@/lib/seo/jsonld'

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
  it('the WebSite url is the home page of its language', () => {
    expect(websiteLd('es').url).toMatch(/^https?:\/\/[^/]+$/)
    expect(websiteLd('en').url).toBe(`${websiteLd('es').url}/en`)
    expect(websiteLd('fr')).toMatchObject({ url: `${websiteLd('es').url}/fr`, inLanguage: 'fr' })
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
    title: 'Tarifas web',
    packages: [
      { slug: 'landing-page', name: 'Landing Page', pitch: 'Estar en Google.', priceWithMaintenance: 349, priceWebOnly: 590, fromPrice: false },
      { slug: 'custom', name: 'Custom', pitch: 'A medida.', priceWithMaintenance: 490, priceWebOnly: 790, fromPrice: true },
      { slug: 'basico', name: 'Básico', priceWithMaintenance: null, priceWebOnly: null },
    ],
    maintenancePlans: [{ slug: 'esencial', name: 'Esencial', pitch: 'Web segura.', monthlyPrice: 25, permanenceMonths: 24 }],
    customSupport: { title: 'Soporte a medida', text: 'Bajo presupuesto.', fromPrice: 139 },
  }
  const labels = { withMaintenance: 'Con mantenimiento', webOnly: 'Solo la web' }
  const ld = pricingLd(pricing as never, 'https://x/presupuestos', labels)
  const offers = ld.itemListElement
  const exVat = { priceCurrency: 'EUR', valueAddedTaxIncluded: false }
  const monthly = { unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } }

  it('is an OfferCatalog with one Offer per complete web plan, maintenance plan and tailored support', () => {
    expect(ld['@type']).toBe('OfferCatalog')
    expect(ld.url).toBe('https://x/presupuestos')
    // inLanguage is not an OfferCatalog property.
    expect(ld).not.toHaveProperty('inLanguage')
    expect(offers.map((o) => o.name)).toEqual(['Landing Page', 'Custom', 'Esencial', 'Soporte a medida'])
    expect(offers.every((o) => o['@type'] === 'Offer')).toBe(true)
  })

  it('prices a web plan with maintenance and as web only, both excluding VAT', () => {
    expect(offers[0]).toMatchObject({ name: 'Landing Page', description: 'Estar en Google.', price: 349, priceCurrency: 'EUR' })
    expect(offers[0].priceSpecification).toEqual([
      { '@type': 'UnitPriceSpecification', name: 'Con mantenimiento', price: 349, ...exVat },
      { '@type': 'UnitPriceSpecification', name: 'Solo la web', price: 590, ...exVat },
    ])
  })

  it('states "from" plans as minimum prices, never fixed ones', () => {
    expect(offers[1]).not.toHaveProperty('price')
    expect(offers[1].priceSpecification).toEqual([
      { '@type': 'UnitPriceSpecification', name: 'Con mantenimiento', minPrice: 490, ...exVat },
      { '@type': 'UnitPriceSpecification', name: 'Solo la web', minPrice: 790, ...exVat },
    ])
  })

  it('prices maintenance monthly and tailored support as a monthly minimum', () => {
    expect(offers[2]).toMatchObject({ description: 'Web segura.', price: 25 })
    expect(offers[2].priceSpecification).toEqual([{ '@type': 'UnitPriceSpecification', price: 25, ...exVat, ...monthly }])
    expect(offers[3]).not.toHaveProperty('price')
    expect(offers[3].priceSpecification).toEqual([{ '@type': 'UnitPriceSpecification', minPrice: 139, ...exVat, ...monthly }])
  })

  it('omits tailored support without a price', () => {
    const ld2 = pricingLd({ ...pricing, customSupport: { title: 'Soporte' } } as never, 'https://x', labels)
    expect(ld2.itemListElement).toHaveLength(3)
  })
})
