import { expect, test } from '@playwright/test'
import { setConsent } from './support/consent'

test.beforeEach(async ({ context, baseURL }) => {
  await setConsent(context, baseURL, false)
})

test.describe('reduced motion', () => {
  // reducedMotion is a browser-context option (not a top-level test option) in Playwright 1.58.
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('disables smooth scroll and never hides reveal content', async ({ page }) => {
    await page.goto('/')
    // Lenis tags <html class="lenis"> when it runs.
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)
    // Below-the-fold reveals are never hidden.
    const reveal = page.locator('[data-reveal]').last()
    await reveal.scrollIntoViewIfNeeded()
    await expect(reveal).toHaveCSS('opacity', '1')
  })
})

test.describe('full motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('the hero headline (LCP) is visible immediately and never split or hidden', async ({ page, isMobile }) => {
    await page.goto('/')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveCSS('opacity', '1')
    // Wait until the deferred scroll-effects runtime has set itself up: it must leave above-the-fold content alone.
    await expect(page.locator('html')).toHaveAttribute('data-scroll-effects', 'ready', { timeout: 10_000 })
    await expect(h1).toHaveCSS('opacity', '1')
    await expect(h1).toHaveCSS('visibility', 'visible')
    // Smooth scroll is on with a mouse; touch screens keep native scrolling (Lenis would only add main-thread work).
    if (isMobile) await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)
    else await expect(page.locator('html')).toHaveClass(/\blenis\b/)
  })

  test('changing page never snapshots the whole page for a view transition', async ({ page }) => {
    // A full-page snapshot (over 10,000 px tall) made iOS Safari run out of memory and reload the tab at the top.
    await page.addInitScript(() => {
      const w = window as unknown as { __viewTransitions: number }
      w.__viewTransitions = 0
      const start = document.startViewTransition?.bind(document)
      if (start) document.startViewTransition = ((arg: never) => (w.__viewTransitions++, start(arg))) as typeof document.startViewTransition
    })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-scroll-effects', 'ready', { timeout: 10_000 })
    await page.goto('/precios')
    // A client-side navigation (retried until the page has hydrated and the router handles the click).
    await page.locator('a[href="/proyectos"]').filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/proyectos$/, { timeout: 15_000 })
    expect(await page.evaluate(() => (window as unknown as { __viewTransitions: number }).__viewTransitions)).toBe(0)
  })

  test('phones get the light version of the effects', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only')
    await page.goto('/')
    // No blur filters behind the hero and no frosted header: both are large GPU layers repainted while scrolling.
    await expect(page.locator('.aurora > span').first()).toHaveCSS('filter', 'none')
    await expect(page.locator('.hero-glow')).toHaveCSS('filter', 'none')
    await expect(page.locator('header').first()).toHaveCSS('backdrop-filter', 'none')
    // The reading progress bar sits on its own compositor layer.
    await expect(page.locator('.scroll-progress')).toHaveCSS('will-change', 'transform')
  })

  test('the hero ships no 3D scene', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(120, 160)
    await page.mouse.move(220, 260)
    await page.waitForTimeout(1500)
    await expect(page.locator('canvas')).toHaveCount(0)
  })
})
