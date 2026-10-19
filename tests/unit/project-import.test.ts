import type { PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { projectImportEndpoint } from '@/endpoints/project-import'
import { type FetchLike, importFromWebsite, microlinkUrl } from '@/features/project-import/import'
import { planFill, wantsImage } from '@/features/project-import/plan'
import { SafeFetchError } from '@/features/project-import/fetch-safe'

const YEAR = new Date().getFullYear()
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)])
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')

const html = `<html><head>
  <title>Noore Club | Home</title>
  <meta property="og:description" content="Members club in Murcia">
  <meta property="og:image" content="/og.png">
</head><body><script src="/_next/static/a.js"></script></body></html>`

const found = { title: 'Noore Club', description: 'Members club in Murcia', stack: ['Next.js', 'React'], year: YEAR, imageId: 42 }

describe('planFill (S23 fill rule)', () => {
  it('fills only empty fields and reports the ones already set', () => {
    const plan = planFill({ title: 'Mine', summary: '', stack: [], year: null, cover: 7, 'seo.title': '  ' }, found, { replaceCover: false })
    expect(plan.fill).toEqual({
      summary: 'Members club in Murcia',
      stack: ['Next.js', 'React'],
      year: YEAR,
      'seo.title': 'Noore Club',
      'seo.description': 'Members club in Murcia',
      'seo.image': 42,
    })
    expect(plan.skipped).toEqual(['title', 'cover'])
  })

  it('replaces the cover only on explicit choice', () => {
    expect(planFill({ cover: 7 }, found, { replaceCover: true }).fill.cover).toBe(42)
    expect(planFill({ cover: { id: 7 } }, found, { replaceCover: false }).skipped).toContain('cover')
  })

  it('lists what the website did not provide and keeps SEO values within their max length', () => {
    const plan = planFill({}, { stack: [], year: YEAR, description: 'word '.repeat(60).trim() }, { replaceCover: false })
    expect(plan.missing).toEqual(['title', 'stack', 'cover', 'seo.title', 'seo.image'])
    expect((plan.fill['seo.description'] as string).length).toBeLessThanOrEqual(160)
    expect(plan.fill['seo.description']).toMatch(/…$/)
  })

  it('wants an image when the cover or the SEO image is empty, or the cover is replaced', () => {
    expect(wantsImage({ cover: 1, 'seo.image': 2 }, false)).toBe(false)
    expect(wantsImage({ cover: 1, 'seo.image': 2 }, true)).toBe(true)
    expect(wantsImage({ cover: 1 }, false)).toBe(true)
  })
})

type Route = { status?: number; headers?: Record<string, string>; body: Buffer | string } | SafeFetchError
function fakeFetch(routes: Record<string, Route>) {
  return vi.fn<FetchLike>(async (url, init) => {
    const route = routes[url]
    if (!route) throw new SafeFetchError('network')
    if (route instanceof SafeFetchError) throw route
    void init
    const data = typeof route.body === 'string' ? Buffer.from(route.body) : route.body
    return { url: new URL(url), status: route.status ?? 200, headers: route.headers ?? {}, body: data }
  })
}

const site = 'https://noore.example/'
const shot = 'https://iad.microlink.io/shot.jpg'
const microlinkOk = { body: JSON.stringify({ status: 'success', data: { screenshot: { url: shot } } }), headers: { 'content-type': 'application/json' } }
const page = { body: html, headers: { 'content-type': 'text/html; charset=utf-8', 'x-vercel-id': 'fra1' } }

describe('importFromWebsite', () => {
  it('uses the Microlink screenshot as the cover and stores it in Media with alt text in every locale', async () => {
    const fetch = fakeFetch({ [site]: page, [microlinkUrl(site, false)]: microlinkOk, [shot]: { body: JPEG, headers: { 'content-type': 'image/jpeg' } } })
    const createMedia = vi.fn().mockResolvedValue(42)
    const result = await importFromWebsite({ url: site, current: {}, replaceCover: false }, { fetch, createMedia })
    expect(createMedia).toHaveBeenCalledWith(
      expect.objectContaining({ mimetype: 'image/jpeg', name: 'cover-noore-example.jpg' }),
      { es: 'Portada de Noore Club', en: 'Cover of Noore Club', fr: 'Couverture de Noore Club' },
    )
    expect(result.fill).toMatchObject({ title: 'Noore Club', cover: 42, 'seo.image': 42, stack: ['Next.js', 'React', 'Vercel'] })
    expect(result.coverSource).toBe('screenshot')
    expect(result.warnings).toEqual([])
  })

  it('sends only the public URL to Microlink, and the API key as a header on the pro endpoint', async () => {
    expect(microlinkUrl(site, false)).toBe(
      'https://api.microlink.io/?url=https%3A%2F%2Fnoore.example%2F&screenshot=true&meta=false&viewport.width=1440&viewport.height=900&screenshot.type=jpeg',
    )
    expect(microlinkUrl(site, true).startsWith('https://pro.microlink.io/?')).toBe(true)
    const fetch = fakeFetch({ [site]: page, [microlinkUrl(site, true)]: microlinkOk, [shot]: { body: JPEG, headers: { 'content-type': 'image/jpeg' } } })
    await importFromWebsite({ url: site, current: {}, replaceCover: false }, { fetch, createMedia: vi.fn().mockResolvedValue(1), microlinkKey: 'k' })
    const call = fetch.mock.calls.find(([u]) => u.includes('microlink'))!
    expect(call[1].headers).toMatchObject({ 'x-api-key': 'k' })
  })

  it('falls back to og:image when the screenshot fails', async () => {
    const fetch = fakeFetch({ [site]: page, [microlinkUrl(site, false)]: new SafeFetchError('timeout'), 'https://noore.example/og.png': { body: PNG, headers: { 'content-type': 'image/png' } } })
    const createMedia = vi.fn().mockResolvedValue(5)
    const result = await importFromWebsite({ url: site, current: {}, replaceCover: false }, { fetch, createMedia })
    expect(result.coverSource).toBe('ogImage')
    expect(createMedia.mock.calls[0][0]).toMatchObject({ mimetype: 'image/png', name: 'cover-noore-example.png' })
  })

  it('refuses SVG or mislabelled images and reports coverFailed while still filling the text fields', async () => {
    const fetch = fakeFetch({
      [site]: page,
      [microlinkUrl(site, false)]: microlinkOk,
      [shot]: { body: SVG, headers: { 'content-type': 'image/svg+xml' } },
      'https://noore.example/og.png': { body: SVG, headers: { 'content-type': 'image/png' } },
    })
    const createMedia = vi.fn()
    const result = await importFromWebsite({ url: site, current: {}, replaceCover: false }, { fetch, createMedia })
    expect(createMedia).not.toHaveBeenCalled()
    expect(result.warnings).toEqual(['coverFailed'])
    expect(result.fill.title).toBe('Noore Club')
    expect(result.fill.cover).toBeUndefined()
  })

  it('does not fetch any image when the cover and SEO image are set and not replaced', async () => {
    const fetch = fakeFetch({ [site]: page })
    const createMedia = vi.fn()
    const result = await importFromWebsite({ url: site, current: { cover: 1, 'seo.image': 1 }, replaceCover: false }, { fetch, createMedia })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(createMedia).not.toHaveBeenCalled()
    expect(result.skipped).toEqual(['cover', 'seo.image'])
  })

  it('rejects a page that is not HTML', async () => {
    const fetch = fakeFetch({ [site]: { body: '{}', headers: { 'content-type': 'application/json' } } })
    await expect(importFromWebsite({ url: site, current: {}, replaceCover: false }, { fetch, createMedia: vi.fn() })).rejects.toMatchObject({
      code: 'notHtml',
    })
  })
})

function fakeReq(over: { user?: unknown; body?: unknown } = {}) {
  const payload = {
    create: vi.fn().mockResolvedValue({ id: 42 }),
    update: vi.fn().mockResolvedValue({}),
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  }
  const req = {
    user: 'user' in over ? over.user : { id: 3, email: 'erik@coffeeprojects.es', collection: 'users', role: 'editor' },
    json: async () => ('body' in over ? over.body : { url: 'http://127.0.0.1:3000/', current: {} }),
    payload,
  }
  return { req: req as unknown as PayloadRequest, payload }
}

describe('POST /api/projects/import-from-url', () => {
  beforeEach(() => vi.stubEnv('MICROLINK_API_KEY', ''))
  afterEach(() => vi.unstubAllEnvs())

  it('is a team-only endpoint', async () => {
    const res = await projectImportEndpoint.handler(fakeReq({ user: null }).req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('validates the body', async () => {
    const res = await projectImportEndpoint.handler(fakeReq({ body: { url: 42 } }).req)
    expect(res.status).toBe(400)
  })

  it('refuses private addresses before any request leaves the server', async () => {
    const { req, payload } = fakeReq()
    const res = await projectImportEndpoint.handler(req)
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'blockedUrl' })
    expect(payload.create).not.toHaveBeenCalled()
  })
})
