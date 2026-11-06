import { describe, expect, it, vi } from 'vitest'
import { type FetchLike, captureScreenshot, microlinkUrl } from '@/features/project-import/import'
import { SafeFetchError } from '@/features/project-import/fetch-safe'
import { pickShowcase } from '@/lib/showcase'
import type { Project } from '@/payload-types'

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)])
const site = 'https://www.noore.example/'
const shot = 'https://iad.microlink.io/phone.jpg'

function fakeFetch(routes: Record<string, { body: Buffer | string; headers: Record<string, string> }>) {
  return vi.fn<FetchLike>(async (url) => {
    const route = routes[url]
    if (!route) throw new SafeFetchError('network')
    const body = typeof route.body === 'string' ? Buffer.from(route.body) : route.body
    return { url: new URL(url), status: 200, headers: route.headers, body }
  })
}

describe('captureScreenshot', () => {
  it('asks Microlink for a 2x phone viewport and returns a Media-ready file', async () => {
    const url = microlinkUrl(site, false, 'mobile')
    expect(url).toContain('viewport.width=390')
    expect(url).toContain('viewport.isMobile=true')
    const fetch = fakeFetch({
      [url]: { body: JSON.stringify({ status: 'success', data: { screenshot: { url: shot } } }), headers: { 'content-type': 'application/json' } },
      [shot]: { body: JPEG, headers: { 'content-type': 'image/jpeg' } },
    })
    const file = await captureScreenshot(site, 'mobile', { fetch })
    expect(file).toMatchObject({ mimetype: 'image/jpeg', name: 'mobile-noore-example.jpg' })
    expect(file.data.equals(JPEG)).toBe(true)
  })

  it('keeps the desktop request unchanged and fails when Microlink cannot capture the page', async () => {
    expect(microlinkUrl(site, false)).toBe(microlinkUrl(site, false, 'desktop'))
    const fetch = fakeFetch({ [microlinkUrl(site, false)]: { body: JSON.stringify({ status: 'fail' }), headers: {} } })
    await expect(captureScreenshot(site, 'desktop', { fetch })).rejects.toThrow()
  })
})

const media = (id: number, width: number, height: number) => ({ id, url: `/m/${id}.webp`, alt: `alt ${id}`, width, height })
const project = (over: Partial<Project>): Project =>
  ({ id: 1, slug: 'p', title: 'P', kind: 'new-website', nda: false, concept: false, gallery: [], ...over }) as Project

describe('pickShowcase', () => {
  it('uses projects with a cover, keeps portrait gallery images as the phone view and puts our own site last', () => {
    const slides = pickShowcase([
      project({ slug: 'own', title: 'coffeeprojects.es', url: 'https://coffeeprojects.es', cover: media(1, 1440, 900) as never }),
      project({ slug: 'noore', title: 'Nooré', url: 'https://noore.example/', cover: media(2, 1440, 900) as never, gallery: [media(3, 780, 1688)] as never }),
      project({ slug: 'wide-gallery', cover: media(4, 1440, 900) as never, gallery: [media(5, 1600, 900)] as never }),
    ])
    expect(slides.map((s) => s.slug)).toEqual(['noore', 'wide-gallery', 'own'])
    expect(slides[0]).toMatchObject({ url: 'noore.example', mobile: { src: '/m/3.webp' } })
    expect(slides[1].mobile).toBeUndefined()
  })

  it('never shows NDA work, apps or projects without a cover', () => {
    expect(
      pickShowcase([
        project({ nda: true, cover: media(1, 1440, 900) as never }),
        project({ kind: 'app', cover: media(2, 1440, 900) as never }),
        project({ cover: null }),
      ]),
    ).toEqual([])
  })
})
