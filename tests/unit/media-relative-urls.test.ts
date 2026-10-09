import { describe, expect, it } from 'vitest'
import { Media } from '@/collections/Media'
import { relativizeOwnOrigin, relativizeMediaDoc } from '@/lib/media/relative-urls'

const SITE = 'https://coffeeprojects.es'

describe('relativizeOwnOrigin', () => {
  it('turns an own-origin URL into its path (next/image localPatterns only allow relative /api/media/file/**)', () => {
    expect(relativizeOwnOrigin(`${SITE}/api/media/file/a%20b.png`, SITE)).toBe('/api/media/file/a%20b.png')
    expect(relativizeOwnOrigin(`${SITE}/api/media/file/a.png?x=1`, SITE)).toBe('/api/media/file/a.png?x=1')
  })
  it('leaves relative, external, look-alike and empty values untouched', () => {
    expect(relativizeOwnOrigin('/api/media/file/a.png', SITE)).toBe('/api/media/file/a.png')
    expect(relativizeOwnOrigin('https://cdn.example.com/a.png', SITE)).toBe('https://cdn.example.com/a.png')
    expect(relativizeOwnOrigin(`${SITE}.evil.com/a.png`, SITE)).toBe(`${SITE}.evil.com/a.png`)
    expect(relativizeOwnOrigin(null, SITE)).toBeNull()
    expect(relativizeOwnOrigin(undefined, SITE)).toBeUndefined()
  })
  it('does nothing without a serverURL', () => {
    expect(relativizeOwnOrigin(`${SITE}/api/media/file/a.png`, undefined)).toBe(`${SITE}/api/media/file/a.png`)
  })
})

describe('relativizeMediaDoc', () => {
  it('rewrites url, thumbnailURL and every size url, keeping external urls and other fields', () => {
    const doc = {
      id: 1,
      alt: 'x',
      url: `${SITE}/api/media/file/a.png`,
      thumbnailURL: `${SITE}/api/media/file/a-800.png`,
      sizes: {
        card: { url: `${SITE}/api/media/file/a-800.png`, width: 800 },
        og: { url: 'https://blob.example.com/a-og.png', width: 1200 },
        empty: { url: null },
      },
    }
    expect(relativizeMediaDoc(doc, SITE)).toEqual({
      id: 1,
      alt: 'x',
      url: '/api/media/file/a.png',
      thumbnailURL: '/api/media/file/a-800.png',
      sizes: {
        card: { url: '/api/media/file/a-800.png', width: 800 },
        og: { url: 'https://blob.example.com/a-og.png', width: 1200 },
        empty: { url: null },
      },
    })
  })
  it('tolerates docs without sizes', () => {
    expect(relativizeMediaDoc({ id: 2, url: `${SITE}/api/media/file/b.png` }, SITE)).toEqual({
      id: 2,
      url: '/api/media/file/b.png',
    })
  })
})

describe('Media afterRead wiring', () => {
  it('registers a collection afterRead hook that uses the configured serverURL', async () => {
    const hook = Media.hooks?.afterRead?.[0]
    expect(hook).toBeTypeOf('function')
    const doc = { id: 1, url: `${SITE}/api/media/file/a.png` }
    const out = await hook!({ doc, req: { payload: { config: { serverURL: SITE } } } } as never)
    expect(out).toEqual({ id: 1, url: '/api/media/file/a.png' })
  })
})
