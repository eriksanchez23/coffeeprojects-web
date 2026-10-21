import { describe, expect, it, vi } from 'vitest'

const calls = vi.hoisted(() => ({ locales: [] as string[] }))

vi.mock('next/og', () => ({ ImageResponse: class {} }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale }: { locale: string }) => {
    calls.locales.push(locale)
    return () => 'tagline'
  },
}))

const { default: OgImage } = await import('@/app/(frontend)/[locale]/opengraph-image')

describe('opengraph-image locale param', () => {
  it('renders for a supported locale', async () => {
    await expect(OgImage({ params: Promise.resolve({ locale: 'fr' }) })).resolves.toBeDefined()
    expect(calls.locales).toEqual(['fr'])
  })

  it('404s on an unknown locale instead of rendering (and caching) a new image', async () => {
    calls.locales = []
    await expect(OgImage({ params: Promise.resolve({ locale: 'xx-random' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(calls.locales).toEqual([])
  })
})
