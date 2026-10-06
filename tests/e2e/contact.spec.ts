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
  await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del formulario de contacto de coffeeProjects.')
  await page.getByLabel(/política de privacidad/).check()
  // Submitting right away (before the Turnstile token exists) must wait for the token client-side, then send.
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page).toHaveURL(/\/contacto\/gracias\?e=[A-Za-z0-9-]+$/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Recibido')
  // Personal data never travels in the URL.
  expect(page.url()).not.toContain('@')
})
