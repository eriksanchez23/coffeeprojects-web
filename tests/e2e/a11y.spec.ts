import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Reduced motion keeps below-the-fold reveals in their final, visible state for axe.
test.use({ contextOptions: { reducedMotion: 'reduce' } })

const pages = ['/', '/en/services', '/fr/services/boutiques-en-ligne', '/equipo', '/proyectos', '/contacto', '/privacidad']

for (const path of pages) {
  test(`no serious a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    // The consent banner is open on a first visit, so it is audited too.
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious, JSON.stringify(serious.map((v) => [v.id, v.nodes.length]), null, 2)).toEqual([])
  })
}
