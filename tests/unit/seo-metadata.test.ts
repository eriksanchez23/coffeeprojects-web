import { beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://coffeeprojects.es')
  vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'production')
})

describe('buildMetadata', () => {
  it('sets canonical, hreflang alternates and x-default', async () => {
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const m = buildMetadata({
      locale: 'en',
      paths: { es: '/servicios', en: '/en/services', fr: '/fr/services' },
      title: 'Services',
      description: 'desc',
    })
    expect(m.alternates?.canonical).toBe('https://coffeeprojects.es/en/services')
    expect(m.alternates?.languages).toEqual({
      es: 'https://coffeeprojects.es/servicios',
      en: 'https://coffeeprojects.es/en/services',
      fr: 'https://coffeeprojects.es/fr/services',
      'x-default': 'https://coffeeprojects.es/servicios',
    })
    expect(m.openGraph).toMatchObject({ locale: 'en_US', url: 'https://coffeeprojects.es/en/services', siteName: 'CoffeeProjects' })
  })

  it('marks noindex pages', async () => {
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const m = buildMetadata({ locale: 'es', paths: { es: '/a', en: '/en/a', fr: '/fr/a' }, title: 't', description: 'd', noindex: true })
    expect(m.robots).toEqual({ index: false, follow: false })
  })

  it('truncates long titles and descriptions', async () => {
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const m = buildMetadata({ locale: 'es', paths: { es: '/', en: '/en', fr: '/fr' }, title: 'x'.repeat(80), description: 'y'.repeat(300) })
    expect(String(m.title).length).toBeLessThanOrEqual(60)
    expect(String(m.description).length).toBeLessThanOrEqual(160)
  })
})

describe('non-production environments', () => {
  it('buildMetadata is noindex and robots disallows everything on staging', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'staging')
    const { buildMetadata } = await import('@/lib/seo/metadata')
    const robots = (await import('@/app/robots')).default
    const m = buildMetadata({ locale: 'es', paths: { es: '/a', en: '/en/a', fr: '/fr/a' }, title: 't', description: 'd' })
    expect(m.robots).toEqual({ index: false, follow: false })
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
    vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'production')
  })
})

describe('robots in production', () => {
  it('allows AI crawlers explicitly and keeps private paths disallowed', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'production')
    const robots = (await import('@/app/robots')).default
    const r = robots()
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules]
    const disallow = ['/admin', '/api', '/next']
    expect(rules.find((x) => x.userAgent === '*')).toEqual({ userAgent: '*', allow: '/', disallow })
    const ai = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended']
    for (const bot of ai) expect(rules.find((x) => x.userAgent === bot)).toEqual({ userAgent: bot, allow: '/', disallow })
    expect(r.sitemap).toMatch(/[/]sitemap[.]xml$/)
  })
})
