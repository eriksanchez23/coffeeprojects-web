import { expect, test } from '@playwright/test'
import { setConsent } from './support/consent'
import { e2eContactEmail } from './support/contacts'

test.beforeEach(async ({ context, baseURL }) => {
  // Pre-set a "rejected" consent so the banner does not cover the form.
  await setConsent(context, baseURL, false)
})

test('shows localized validation errors', async ({ page }) => {
  await page.goto('/en/contact')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText('This field is required.').first()).toBeVisible()
  // Focus moves to the first invalid field.
  await expect(page.getByLabel('Name *')).toBeFocused()
})

test('submits a valid request and lands on the thank-you page', async ({ page }) => {
  await page.goto('/contacto')
  await page.getByLabel('Nombre *').fill('Playwright')
  await page.getByLabel('Email *').fill(e2eContactEmail('contact'))
  await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del formulario de contacto de coffeeProjects.')
  await page.getByLabel(/política de privacidad/).check()
  // Turnstile test key auto-passes; wait for its hidden token input.
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: 15_000 })
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page).toHaveURL(/\/contacto\/gracias\?e=[A-Za-z0-9-]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Recibido')
  // Personal data never travels in the URL.
  expect(page.url()).not.toContain('@')
})
