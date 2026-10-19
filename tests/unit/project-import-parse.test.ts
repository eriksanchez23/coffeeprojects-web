import { describe, expect, it } from 'vitest'
import { cleanTitle, parsePageMeta } from '@/features/project-import/parse'

const page = 'https://demo.example.com/es/home'

describe('parsePageMeta (S23)', () => {
  it('prefers og:site_name, then og:title, then <title>', () => {
    const all = `<head><title>Home | Noore</title><meta property="og:title" content="Noore Club — Home"><meta property="og:site_name" content="Noore Club"></head>`
    expect(parsePageMeta(all, page).title).toBe('Noore Club')
    const og = `<head><title>Ignored</title><meta property="og:title" content="Noore Club | Members"></head>`
    expect(parsePageMeta(og, page).title).toBe('Noore Club')
    expect(parsePageMeta('<html><head><title>  Café &amp; Co  </title></head></html>', page).title).toBe('Café & Co')
  })

  it('takes og:description, then the meta description, with entities decoded', () => {
    const both = `<meta name="description" content="Plain"><meta property="og:description" content="Social &quot;card&quot; text">`
    expect(parsePageMeta(both, page).description).toBe('Social "card" text')
    expect(parsePageMeta(`<meta content='Only plain' name='description'>`, page).description).toBe('Only plain')
  })

  it('resolves a relative og:image against the page URL and falls back to twitter:image', () => {
    expect(parsePageMeta('<meta property="og:image" content="/img/og.png">', page).image).toBe('https://demo.example.com/img/og.png')
    expect(parsePageMeta('<meta name="twitter:image" content="https://cdn.example.com/t.jpg">', page).image).toBe('https://cdn.example.com/t.jpg')
  })

  it('drops images that are not http(s)', () => {
    expect(parsePageMeta('<meta property="og:image" content="javascript:alert(1)">', page).image).toBeUndefined()
    expect(parsePageMeta('<meta property="og:image" content="data:image/png;base64,AAA">', page).image).toBeUndefined()
  })

  it('reads the generator meta and ignores tags after </head>', () => {
    const html = '<head><meta name="generator" content="WordPress 6.6"></head><body><meta property="og:title" content="Body"></body>'
    const meta = parsePageMeta(html, page)
    expect(meta.generator).toBe('WordPress 6.6')
    expect(meta.title).toBeUndefined()
  })
})

describe('parsePageMeta length caps', () => {
  it('caps the title at 200 characters and the description at 500', () => {
    const html = `<meta property="og:site_name" content="${'Long name '.repeat(100)}"><meta name="description" content="${'word '.repeat(300)}">`
    const meta = parsePageMeta(html, page)
    expect(meta.title!.length).toBeLessThanOrEqual(200)
    expect(meta.title).toMatch(/…$/)
    expect(meta.description!.length).toBeLessThanOrEqual(500)
  })
})

describe('cleanTitle', () => {
  it('removes " | …", " – …" and " — …" suffixes and collapses whitespace', () => {
    expect(cleanTitle('Shop  name | Home')).toBe('Shop name')
    expect(cleanTitle('Shop – Best shoes in town')).toBe('Shop')
    expect(cleanTitle('A-B Studio')).toBe('A-B Studio')
  })

  it('keeps the title when the first part would be empty', () => {
    expect(cleanTitle(' | Only suffix')).toBe('| Only suffix')
  })
})
