import { expect, test } from '@playwright/test'
import { setConsent } from './support/consent'

test.beforeEach(async ({ context, baseURL }) => {
  await setConsent(context, baseURL, false)
})

test.describe('reduced motion', () => {
  // reducedMotion is a browser-context option (not a top-level test option) in Playwright 1.58.
  test.use({ colorScheme: 'dark', contextOptions: { reducedMotion: 'reduce' } })

  test('disables smooth scroll and the 3D canvas, keeps the poster and shows final counters', async ({ page }) => {
    await page.goto('/')
    // Engage like a visitor would (this is what loads the 3D scene with full motion), then wait past its idle window.
    await page.mouse.move(120, 160)
    await page.mouse.move(220, 260)
    await page.waitForTimeout(2500)
    await expect(page.locator('canvas')).toHaveCount(0)
    // Static, decorative poster stays in place of the scene.
    await expect(page.locator('section[aria-labelledby="hero-title"] svg[aria-hidden="true"]').first()).toBeVisible()
    // Lenis tags <html class="lenis"> when it runs.
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)

    const counters = page.locator('[data-count-to]')
    expect(await counters.count()).toBeGreaterThan(0)
    for (const counter of await counters.all()) {
      await counter.scrollIntoViewIfNeeded()
      await expect(counter).toBeVisible()
      await expect(counter).toHaveText((await counter.getAttribute('data-count-to')) as string)
    }
    // Below-the-fold reveals are never hidden either.
    const reveal = page.locator('[data-reveal]').last()
    await reveal.scrollIntoViewIfNeeded()
    await expect(reveal).toHaveCSS('opacity', '1')
  })
})

test.describe('full motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('the hero headline (LCP) is visible immediately and never split or hidden', async ({ page }) => {
    await page.goto('/')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveCSS('opacity', '1')
    // Wait until the deferred scroll-effects runtime has set itself up: it must leave above-the-fold content alone.
    await expect(page.locator('html')).toHaveAttribute('data-scroll-effects', 'ready', { timeout: 10_000 })
    await expect(h1).toHaveCSS('opacity', '1')
    await expect(h1.locator('*')).toHaveCount(0)
    await expect(h1).toHaveCSS('visibility', 'visible')
    // Smooth scroll is on.
    await expect(page.locator('html')).toHaveClass(/\blenis\b/)
  })

  test('the 3D scene loads only once the visitor engages, over the poster', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Pointer-driven check; touch devices engage by touching or scrolling')
    await page.goto('/')
    await page.waitForTimeout(2000)
    await expect(page.locator('canvas')).toHaveCount(0)
    await page.mouse.move(120, 160)
    await page.mouse.move(220, 260)
    // Headless Chromium uses software WebGL; the scene still mounts its canvas.
    await expect(page.locator('section[aria-labelledby="hero-title"] canvas')).toHaveCount(1, { timeout: 10_000 })
  })
})
