import { describe, expect, it } from 'vitest'
import { detectStack } from '@/features/project-import/detect-stack'

describe('detectStack (S23)', () => {
  it('detects Next.js (and React) from build assets, __NEXT_DATA__ or x-powered-by, plus Vercel from headers', () => {
    expect(detectStack({ html: '<script src="/_next/static/chunks/main.js"></script>', headers: { 'x-vercel-id': 'fra1::abc' } })).toEqual([
      'Next.js',
      'React',
      'Vercel',
    ])
    expect(detectStack({ html: '<script id="__NEXT_DATA__"></script>', headers: {} })).toContain('Next.js')
    expect(detectStack({ html: '', headers: { 'x-powered-by': 'Next.js' } })).toContain('Next.js')
  })

  it('detects Nuxt with Vue, Astro, WordPress, Shopify, Webflow, Wix and Squarespace', () => {
    expect(detectStack({ html: '<script>window.__NUXT__={}</script>', headers: {} })).toEqual(['Nuxt', 'Vue'])
    expect(detectStack({ html: '<astro-island></astro-island>', headers: {} })).toEqual(['Astro'])
    expect(detectStack({ html: '<link href="/wp-content/themes/x/style.css">', headers: {} })).toEqual(['WordPress'])
    expect(detectStack({ html: '<script src="https://cdn.shopify.com/s/x.js"></script>', headers: {} })).toEqual(['Shopify'])
    expect(detectStack({ html: '<html data-wf-page="abc">', headers: {} })).toEqual(['Webflow'])
    expect(detectStack({ html: '<img src="https://static.wixstatic.com/media/a.jpg">', headers: {} })).toEqual(['Wix'])
    expect(detectStack({ html: '<link href="https://static1.squarespace.com/x.css">', headers: {} })).toEqual(['Squarespace'])
  })

  it('adds Tailwind CSS only when obvious, Netlify from headers and an unknown generator by name', () => {
    expect(detectStack({ html: '<style>*{--tw-ring-color:red}</style>', headers: { server: 'Netlify' } })).toEqual(['Tailwind CSS', 'Netlify'])
    expect(detectStack({ html: '<div class="flex p-4">', headers: {} })).toEqual([])
    expect(detectStack({ html: '', headers: {}, generator: 'Hugo 0.128.0' })).toEqual(['Hugo'])
  })

  it('does not duplicate a technology that both a rule and the generator report', () => {
    expect(detectStack({ html: '<link href="/wp-content/a.css">', headers: {}, generator: 'WordPress 6.6' })).toEqual(['WordPress'])
  })
})
