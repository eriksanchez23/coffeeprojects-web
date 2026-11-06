import { expect, test } from '@playwright/test'
import { setConsent } from './support/consent'

test.beforeEach(async ({ context, baseURL }) => {
  await setConsent(context, baseURL, false)
})

test('hero showcase: swipe or arrows change the project, a click opens it', async ({ page }) => {
  await page.goto('/')
  const frame = page.getByTestId('hero-showcase-link')
  const caption = page.getByTestId('hero-showcase-caption')
  // Skipped when the database has fewer than two projects with a cover (no carousel then).
  test.skip((await page.getByRole('button', { name: /^Ver / }).count()) < 2, 'needs two projects with a cover')
  const first = await caption.locator('a').innerText()

  // Swipe left with the mouse: next project, and the press does not navigate. Retried, since a swipe made before
  // the page has hydrated does nothing (the server HTML has no handlers yet).
  await expect(async () => {
    const box = (await frame.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect(caption.locator('a')).not.toHaveText(first, { timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/$/)

  // The arrows go back.
  await page.getByRole('button', { name: 'Proyecto anterior' }).click()
  await expect(caption.locator('a')).toHaveText(first)

  // A plain click opens the project page, whose details show its technologies.
  // (The frame floats gently, so it is never "stable" for Playwright's actionability check.)
  await frame.click({ force: true })
  await expect(page).toHaveURL(/\/proyectos\/[\w-]+$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first)
})

test('home projects: a swipeable row of cards with technologies and links', async ({ page }) => {
  await page.goto('/')
  const track = page.getByTestId('project-carousel')
  await expect(track).toBeVisible()
  const cards = track.getByTestId('project-card')
  test.skip((await cards.count()) < 2, 'needs two featured website projects')

  // Cards fade in as they scroll into view.
  await track.scrollIntoViewIfNeeded()
  // Every card lists its technologies; public sites have a direct link that opens in a new tab.
  await expect(cards.first().getByRole('list', { name: 'Tecnologías y lenguajes' })).toBeVisible()
  const visit = track.getByTestId('project-visit').first()
  await expect(visit).toHaveAttribute('target', '_blank')
  await expect(visit).toHaveAttribute('href', /^https:\/\//)

  // The "next" button scrolls the row (retried until the page has hydrated); dragging with the mouse scrolls it
  // too, without opening a card.
  await expect(async () => {
    await page.getByRole('button', { name: 'Ver más proyectos' }).click()
    await expect.poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 1500 }).toBeGreaterThan(0)
  }).toPass({ timeout: 15_000 })
  const box = (await track.boundingBox())!
  const atNext = await track.evaluate((el) => el.scrollLeft)
  await page.mouse.move(box.x + box.width * 0.3, box.y + 120)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + 120, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeLessThan(atNext)
  await expect(page).toHaveURL(/\/$/)

  // A click on a card opens its page.
  const title = await cards.first().getByRole('heading').innerText()
  await track.evaluate((el) => el.scrollTo({ left: 0 }))
  await cards.first().getByRole('heading').click()
  await expect(page).toHaveURL(/\/proyectos\/[\w-]+$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
})

test('project page: details with website, technologies, type and status, and previous/next links', async ({ page }) => {
  await page.goto('/proyectos/coffeeprojects-es')
  const details = page.getByTestId('project-details')
  await expect(details.getByRole('heading', { name: 'Ficha del proyecto' })).toBeVisible()
  await expect(page.getByTestId('project-url')).toHaveAttribute('href', 'https://coffeeprojects.es')
  await expect(page.getByTestId('project-stack')).toContainText('Next.js')
  await expect(details).toContainText('Web nueva')
  await expect(details).toContainText('Publicada')
  const next = page.getByTestId('project-next')
  const nextTitle = (await next.locator('span').last().innerText()).trim()
  await next.click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(nextTitle)
  await expect(page.getByTestId('project-prev')).toContainText('coffeeprojects.es')
})

test('a project under NDA shows no link', async ({ page }) => {
  await page.goto('/proyectos/portal-web-institucional')
  await expect(page.getByTestId('project-url')).toHaveCount(0)
  await expect(page.getByTestId('project-details')).toContainText('Privada (bajo NDA)')
})
