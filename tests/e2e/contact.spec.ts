import { expect, test } from './support/client-ip'
import { setConsent } from './support/consent'
import { e2eContactEmail } from './support/contacts'

test.beforeEach(async ({ context, baseURL }) => {
  // Pre-set a "rejected" consent so the banner does not cover the form.
  await setConsent(context, baseURL, false)
})

test('shows localized validation errors', async ({ page }) => {
  await page.goto('/en/contact')
  await page.getByRole('button', { name: 'Send request' }).click()
  // The submit first waits for the Turnstile token (loaded on first interaction), then validates on the server.
  await expect(page.getByText('This field is required.').first()).toBeVisible({ timeout: 20_000 })
  // Focus moves to the first invalid field.
  await expect(page.getByLabel('Name *')).toBeFocused()
})

test('submits a valid request and lands on the thank-you page', async ({ page }) => {
  await page.goto('/contacto')
  await page.getByLabel('Nombre *').fill('Playwright')
  await page.getByLabel('Email *').fill(e2eContactEmail('contact'))
  await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del formulario de contacto de CoffeeProjects.')
  await page.getByLabel(/política de privacidad/).check()
  // Submitting right away (before the Turnstile token exists) must wait for the token client-side, then send.
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page).toHaveURL(/\/contacto\/gracias\?e=[A-Za-z0-9-]+$/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Recibido')
  // Personal data never travels in the URL.
  expect(page.url()).not.toContain('@')
})

test('shows the final price with VAT and the estimated time instead of budget/timeline inputs (S17)', async ({ page }) => {
  await page.goto('/contacto?type=web&plan=landing-page')
  const summary = page.getByTestId('quote-summary')
  await expect(summary).toContainText('Landing Page')
  // Landing Page: 349 € / 590 € + 21 % VAT.
  await expect(summary).toContainText(/Con mantenimiento\s*422,29\s€/)
  await expect(summary).toContainText(/Solo la web\s*713,90\s€/)
  await expect(summary).toContainText(/Plazo estimado\s*1-2 semanas/)
  await expect(summary).toContainText('IVA (21 %) incluido')
  await expect(page.getByLabel(/Presupuesto estimado/)).toHaveCount(0)
  await expect(page.getByLabel(/Plazo deseado/)).toHaveCount(0)
  await expect(page.locator('select[name="budget"], select[name="timeline"]')).toHaveCount(0)

  // Without a plan the summary follows the project type select.
  await page.goto('/contacto')
  await expect(summary).toContainText(/Precio final\s*desde 422,29\s€/)
  await page.getByLabel('Tipo de proyecto *').selectOption('ecommerce')
  await expect(summary).toContainText(/desde 1\.802,90\s€/)
  await expect(summary).toContainText(/4-8 semanas/)
  await page.getByLabel('Tipo de proyecto *').selectOption('custom')
  await expect(summary).toContainText('A medida (bajo presupuesto)')
  // Screen readers hear the update.
  await expect(page.locator('#quote-summary')).toHaveAttribute('aria-live', 'polite')
})

test('the quote summary is localized', async ({ page }) => {
  await page.goto('/en/contact?type=ecommerce')
  await expect(page.getByTestId('quote-summary')).toContainText(/from €1,802\.90/)
  await expect(page.getByTestId('quote-summary')).toContainText('VAT (21%) included')
})
