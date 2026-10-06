import type { Page } from '@playwright/test'
import { expect, test } from './support/client-ip'
import { FBEVENTS_STUB, type FbqCall, setConsent } from './support/consent'
import { e2eContactEmail } from './support/contacts'

const META = /facebook\.(net|com)/

function recordMetaRequests(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (r) => {
    if (META.test(r.url())) urls.push(r.url())
  })
  return urls
}

/** Records and aborts Meta requests, so a regression is caught without ever contacting Meta. */
async function blockMeta(page: Page): Promise<string[]> {
  const urls = recordMetaRequests(page)
  await page.route(META, (route) => route.abort())
  return urls
}

test('rejecting cookies loads no Meta script', async ({ page }) => {
  const metaRequests = await blockMeta(page)
  await page.goto('/servicios/webs-y-landing-pages?utm_source=facebook&fbclid=E2E')
  await page.getByRole('button', { name: 'Rechazar' }).click()
  await page.reload()
  // Not 'networkidle': Chromium keeps the previous document's in-flight RSC prefetches open across a reload.
  await page.waitForTimeout(2000)
  expect(metaRequests).toEqual([])
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === 'cp_attr')).toBeUndefined()
})

test('nothing from Meta loads before a consent choice', async ({ page }) => {
  const metaRequests = await blockMeta(page)
  await page.goto('/?utm_source=facebook&fbclid=E2E')
  await expect(page.getByRole('dialog', { name: 'Usamos cookies' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(metaRequests).toEqual([])
  expect(await page.evaluate(() => typeof (window as { fbq?: unknown }).fbq)).toBe('undefined')
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === 'cp_attr')).toBeUndefined()
})

test('the banner gives Reject the same prominence as Accept', async ({ page }) => {
  await page.goto('/')
  const reject = page.getByRole('button', { name: 'Rechazar' })
  const accept = page.getByRole('button', { name: 'Aceptar todas' })
  await expect(reject).toBeVisible()
  await expect(accept).toBeVisible()
  expect(await reject.getAttribute('class')).toBe(await accept.getAttribute('class'))
})

test('the footer can reopen the consent settings', async ({ page, context, baseURL }) => {
  await setConsent(context, baseURL, false)
  await page.goto('/')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('footer').getByRole('button', { name: 'Configurar cookies' }).click()
  await expect(page.getByRole('dialog', { name: 'Usamos cookies' })).toBeFocused()
})

// The Pixel only renders when the build has a Pixel ID. CI and the local E2E run build with a dummy ID and
// fbevents.js is replaced by a recording stub, so nothing ever reaches Meta.
test.describe('Meta Pixel (dummy Pixel ID, stubbed fbevents.js)', () => {
  test.skip(!process.env.NEXT_PUBLIC_META_PIXEL_ID, 'Build without NEXT_PUBLIC_META_PIXEL_ID: Pixel is disabled')

  test.beforeEach(async ({ page }) => {
    await page.route('https://connect.facebook.net/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: FBEVENTS_STUB }),
    )
  })

  const calls = (page: Page) => page.evaluate(() => (window as unknown as { __fbqCalls?: FbqCall[] }).__fbqCalls ?? [])
  const pageViews = async (page: Page) => (await calls(page)).filter((c) => c[0] === 'track' && c[1] === 'PageView').length

  test('accepting loads the Pixel once, keeps attribution and sends exactly one PageView per route', async ({ page }) => {
    const metaRequests = recordMetaRequests(page)
    await page.goto('/?utm_source=facebook&fbclid=E2E')
    await page.waitForLoadState('networkidle')
    expect(metaRequests).toEqual([])

    await page.getByRole('button', { name: 'Aceptar todas' }).click()
    await expect.poll(() => pageViews(page)).toBe(1)
    expect(metaRequests.filter((u) => u.includes('fbevents.js'))).toHaveLength(1)
    expect(await page.evaluate(() => (window as { fbq?: { disablePushState?: boolean } }).fbq?.disablePushState)).toBe(true)
    const attr = (await page.context().cookies()).find((c) => c.name === 'cp_attr')
    expect(attr?.value).toContain('facebook')

    // Client-side navigation: one more PageView from the app, none from fbevents' pushState hook.
    await page.locator('main').getByRole('link', { name: 'Ver servicios' }).first().click()
    await expect(page).toHaveURL(/\/servicios$/)
    await expect.poll(() => pageViews(page)).toBe(2)
    await page.waitForTimeout(500)
    expect(await pageViews(page)).toBe(2)
  })

  test('a direct visit to the thank-you page fires no Lead', async ({ page, context, baseURL }) => {
    await setConsent(context, baseURL, true)
    await page.goto('/contacto/gracias?e=forged-event-1234')
    await expect.poll(() => pageViews(page)).toBe(1)
    await page.waitForTimeout(1500) // TrackLead polls for fbq for a while
    expect((await calls(page)).filter((c) => c[1] === 'Lead')).toEqual([])
  })

  test.describe('real submission', () => {
    test('a saved submission with marketing consent fires exactly one Lead with the event id', async ({ page, context, baseURL }) => {
      await setConsent(context, baseURL, true)
      await page.goto('/contacto?type=web')
      await page.getByLabel('Nombre *').fill('Playwright Lead')
      await page.getByLabel('Email *').fill(e2eContactEmail('lead'))
      await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del evento Lead con consentimiento de marketing.')
      await page.getByLabel(/política de privacidad/).check()
      await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: 15_000 })
      await page.getByRole('button', { name: 'Enviar solicitud' }).click()
      await expect(page).toHaveURL(/\/contacto\/gracias\?e=/)
      const eventId = new URL(page.url()).searchParams.get('e')

      await expect.poll(async () => (await calls(page)).filter((c) => c[1] === 'Lead')).toHaveLength(1)
      const [lead] = (await calls(page)).filter((c) => c[1] === 'Lead')
      expect(lead[3]).toEqual({ eventID: eventId })
      // The proof cookie is consumed, so a reload cannot count the lead twice.
      expect((await context.cookies()).find((c) => c.name === 'cp_lead')).toBeUndefined()
    })
  })
})
