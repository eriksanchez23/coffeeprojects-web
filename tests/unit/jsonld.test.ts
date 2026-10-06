import { describe, expect, it } from 'vitest'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, faqLd, organizationLd, serviceLd } from '@/lib/seo/jsonld'

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
