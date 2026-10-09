import { expect, test } from '@playwright/test'
import { setConsent } from './support/consent'

test.beforeEach(async ({ context, baseURL }) => {
  // A stored (rejected) choice keeps the consent banner from covering links.
  await setConsent(context, baseURL, false)
})

test('home renders in each locale with matching lang attribute', async ({ page }) => {
  for (const [path, lang] of [['/', 'es'], ['/en', 'en'], ['/fr', 'fr']] as const) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

test('language switch keeps the localized slug of a service page', async ({ page }) => {
  await page.goto('/servicios/tiendas-online')
  await page.locator('footer').getByRole('link', { name: 'en', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/services\/online-stores$/)
  await page.locator('footer').getByRole('link', { name: 'fr', exact: true }).click()
  await expect(page).toHaveURL(/\/fr\/services\/boutiques-en-ligne$/)
})

test('translated slug-less fallback still resolves (ES slug under /en)', async ({ page }) => {
  const res = await page.goto('/en/services/tiendas-online')
  expect(res?.status()).toBe(200)
})

test('hreflang comes only from the page head, never from a Link header', async ({ page }) => {
  const res = await page.goto('/servicios/tiendas-online')
  expect(res?.headers()['link'] ?? '').not.toContain('hreflang')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/services\/online-stores$/)
})

test('unknown pages return a branded 404', async ({ page }) => {
  const res = await page.goto('/esto-no-existe')
  expect(res?.status()).toBe(404)
  await expect(page.getByText('error 404: coffee not found')).toBeVisible()
})

test('old-site legal URLs redirect permanently', async ({ request }) => {
  for (const [from, to] of [['/legal', '/aviso-legal'], ['/en/legal', '/en/legal-notice']] as const) {
    const res = await request.get(from, { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers()['location']).toBe(to)
  }
})

test('public pages send a CSP without unsafe-eval and the right indexing policy', async ({ request }) => {
  const res = await request.get('/')
  const csp = res.headers()['content-security-policy'] ?? ''
  expect(csp).toContain("default-src 'self'")
  expect(csp).not.toContain('unsafe-eval')
  // Payload's admin client hints must not force a Critical-CH retry on public pages.
  expect(res.headers()['critical-ch']).toBeUndefined()
  const robots = await (await request.get('/robots.txt')).text()
  if (process.env.NEXT_PUBLIC_SITE_ENV === 'production') {
    expect(res.headers()['x-robots-tag']).toBeUndefined()
    expect(robots).toMatch(/User-Agent: GPTBot\s+Allow: \//)
  } else {
    // Staging/local must never be indexed.
    expect(res.headers()['x-robots-tag']).toContain('noindex')
    expect(robots).toMatch(/Disallow: \/\s*$/m)
  }
})

test('no stat or GitHub block renders 0 or an em dash placeholder', async ({ page }) => {
  await page.goto('/')
  const statValues = await page.locator('[data-count-to]').allTextContents()
  expect(statValues.length).toBeGreaterThan(0)
  for (const v of statValues) expect(Number(v)).toBeGreaterThan(0)
  await expect(page.locator('#team dd', { hasText: /^—$/ })).toHaveCount(0)
})

test('service CTA pre-selects the project type in the contact form', async ({ page }) => {
  await page.goto('/servicios/tiendas-online')
  // Scoped to <main>: the header CTA has the same label but carries no type.
  await page.locator('main').getByRole('link', { name: 'Pide tu presupuesto' }).first().click()
  await expect(page).toHaveURL(/\/contacto\?type=ecommerce$/)
  await expect(page.getByLabel(/Tipo de proyecto/)).toHaveValue('ecommerce')
})

test('CTA band sends only the project type to the contact page (no personal data in the URL)', async ({ page }) => {
  await page.goto('/')
  const band = page.locator('section[aria-labelledby="cta-title"]')
  await band.getByRole('combobox').selectOption('discord-bot')
  await band.getByRole('button', { name: 'Quiero mi propuesta' }).click()
  await expect(page).toHaveURL(/\/contacto\?type=discord-bot$/)
  await expect(page.getByLabel(/Tipo de proyecto/)).toHaveValue('discord-bot')
})

test('an unknown ?type= falls back to the default project type', async ({ page }) => {
  await page.goto('/contacto?type=%3Cscript%3E')
  await expect(page.getByLabel(/Tipo de proyecto/)).toHaveValue('web')
})

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'The menu only exists below the md breakpoint')

  test('opens over an inert page, closes with Escape and past md', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Abrir menú' })
    await toggle.click()
    const menu = page.locator('#mobile-menu')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true')
    expect(await page.locator('#main').evaluate((el) => (el as HTMLElement).inert)).toBe(true)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(toggle).toBeFocused()
    expect(await page.locator('#main').evaluate((el) => (el as HTMLElement).inert)).toBe(false)

    await toggle.click()
    await expect(menu).toBeVisible()
    await page.setViewportSize({ width: 1024, height: 800 })
    await expect(menu).toHaveCount(0)
    expect(await page.locator('#main').evaluate((el) => (el as HTMLElement).inert)).toBe(false)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  })

  test('menu links navigate and close the menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await page.locator('#mobile-menu').getByRole('link', { name: 'Equipo' }).click()
    await expect(page).toHaveURL(/\/equipo$/)
    await expect(page.locator('#mobile-menu')).toHaveCount(0)
  })
})

test('approved legal pages carry no draft note and are listed in the sitemap', async ({ page, request }) => {
  // The seeded legal texts have no pending markers left, so they are indexable.
  await page.goto('/privacidad')
  await expect(page.getByText('[PENDIENTE')).toHaveCount(0)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const path of ['/presupuestos', '/aviso-legal', '/privacidad', '/cookies']) expect(sitemap).toContain(path)
})
