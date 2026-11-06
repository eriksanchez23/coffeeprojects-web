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
  // Focus moves to the first invalid field (the project description, first field of the "new website" path).
  await expect(page.locator('#message')).toBeFocused()
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

test('a new website: choose the type of website, then maintenance or none, and the price follows (S17)', async ({ page }) => {
  await page.goto('/contacto?type=web&plan=landing-page')
  const summary = page.getByTestId('quote-summary')
  const planSelect = page.getByLabel('Tipo de web')
  const maintenance = page.getByLabel('Mantenimiento', { exact: true })
  await expect(planSelect).toHaveValue('landing-page')
  // Each type of website shows its price with and without maintenance (VAT excluded, like the pricing page).
  await expect(planSelect.locator('option[value="landing-page"]')).toHaveText(/Landing Page — 349\s€ con mantenimiento · 590\s€ sin mantenimiento/)
  // The plan's minimum maintenance comes preselected; the summary shows prices with 21 % VAT.
  await expect(maintenance).toHaveValue('esencial')
  await expect(summary).toContainText(/Mantenimiento\s*Esencial · 30,25\s€\/mes/)
  await expect(summary).toContainText(/Precio de la web\s*422,29\s€/)
  await expect(summary).toContainText(/Plazo estimado\s*1-2 semanas/)
  await expect(summary).toContainText('IVA (21 %) incluido')

  await maintenance.selectOption('none')
  await expect(summary).toContainText(/Mantenimiento\s*Sin mantenimiento/)
  await expect(summary).toContainText(/Precio de la web\s*713,90\s€/)

  // An online store only offers the maintenance plans that unlock its reduced price, and is sent as a store.
  await planSelect.selectOption('tienda-online')
  await expect(maintenance.locator('option')).toHaveText([/^Plan Plus/, /^Plan Pro/, /^Sin mantenimiento/])
  await expect(maintenance).toHaveValue('plus')
  await expect(summary).toContainText(/Plus · 54,45\s€\/mes/)
  await expect(summary).toContainText(/Precio de la web\s*1\.802,90\s€/)
  await expect(page.locator('input[name="projectType"]')).toHaveValue('ecommerce')

  // "Not sure yet": no maintenance select and no price until a type of website is chosen.
  await planSelect.selectOption('')
  await expect(maintenance).toHaveCount(0)
  await expect(summary).toContainText('Elige el tipo de web para ver su precio.')
  await expect(page.locator('input[name="projectType"]')).toHaveValue('web')

  await expect(page.getByLabel(/Presupuesto estimado/)).toHaveCount(0)
  await expect(page.locator('select[name="budget"], select[name="timeline"]')).toHaveCount(0)

  // Another project: the summary follows the project type select.
  await page.getByText('Otro proyecto', { exact: true }).click()
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

test('the free review link pre-fills the website and asks for its URL instead of a description', async ({ page }) => {
  await page.goto('/contacto?type=audit&url=miweb.es')
  await expect(page.locator('input[name="projectType"]')).toHaveValue('audit')
  await expect(page.getByLabel('Dirección de tu web actual *')).toHaveValue('miweb.es')
  await expect(page.getByLabel(/solo quiero la revisión gratuita/)).toBeChecked()
  // The description is optional on this path and the price summary is replaced by the review fields.
  await expect(page.getByLabel('Cuéntanos más (opcional)')).toBeVisible()
  await expect(page.getByTestId('quote-summary')).toHaveCount(0)
  await page.getByLabel(/solo quiero la revisión gratuita/).uncheck()
  await expect(page.locator('input[name="projectType"]')).toHaveValue('redesign')
})

test('a URL that is not a website is not pre-filled', async ({ page }) => {
  await page.goto('/contacto?type=audit&url=javascript:alert(1)')
  await expect(page.getByLabel('Dirección de tu web actual *')).toHaveValue('')
})
