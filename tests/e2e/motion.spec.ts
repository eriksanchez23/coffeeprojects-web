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

  test('the hero headline (LCP) is visible immediately and never split or hidden', async ({ page }) => {
    await page.goto('/')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveCSS('opacity', '1')
    // Wait until the deferred scroll-effects runtime has set itself up: it must leave above-the-fold content alone.
    await expect(page.locator('html')).toHaveAttribute('data-scroll-effects', 'ready', { timeout: 10_000 })
    await expect(h1).toHaveCSS('opacity', '1')
    await expect(h1).toHaveCSS('visibility', 'visible')
    // Smooth scroll is on.
    await expect(page.locator('html')).toHaveClass(/\blenis\b/)
  })

  test('the hero ships no 3D scene', async ({ page }) => {
    await page.goto('/')
    await page.mouse.move(120, 160)
    await page.mouse.move(220, 260)
    await page.waitForTimeout(1500)
    await expect(page.locator('canvas')).toHaveCount(0)
  })
})
