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

// The radios are visually hidden inside their cards: visitors (and these tests) click the card itself.
test('a new website: pick the type of website, then maintenance or none, and the price follows (S17)', async ({ page }) => {
  await page.goto('/contacto?type=web&plan=landing-page')
  const summary = page.getByTestId('quote-summary')
  const payment = page.getByTestId('quote-payment')
  const plans = page.getByRole('group', { name: 'Tipo de web', exact: true })
  const maintenance = page.getByRole('group', { name: 'Mantenimiento', exact: true })
  await expect(plans.getByRole('radio', { name: /^Landing Page/ })).toBeChecked()
  // Each type of website is a card with its price with and without maintenance (VAT excluded, like the pricing page).
  await expect(page.getByTestId('plan-landing-page')).toContainText(/Landing Page\s*349\s€\s*con mantenimiento\s*590\s€ sin mantenimiento/)
  await expect(page.getByTestId('plan-tienda-online')).toContainText('Recomendado')
  // The plan's minimum maintenance comes preselected; the summary shows prices with 21 % VAT.
  await expect(maintenance.getByRole('radio', { name: /^Esencial/ })).toBeChecked()
  await expect(page.getByTestId('maintenance-esencial')).toContainText(/25\s€\/mes\s*Permanencia de 24 meses\s*La web te sale por 349\s€/)
  await expect(summary).toContainText(/Mantenimiento\s*Esencial · 30,25\s€\/mes/)
  await expect(summary).toContainText(/Plazo estimado\s*1-2 semanas/)
  await expect(summary).toContainText('IVA (21 %) incluido')
  // What the visitor will pay: the web up front, the fees over the minimum term and the total.
  await expect(payment).toContainText(/Al inicio: la web \(pago único\)\s*422,29\s€/)
  await expect(payment).toContainText(/Mantenimiento · 24 meses\s*726\s€/)
  await expect(page.getByTestId('quote-total')).toContainText(/Total en 24 meses\s*1\.148,29\s€/)
  await expect(payment).toContainText('Tras la permanencia se renueva mes a mes')

  await page.getByTestId('maintenance-none').click()
  await expect(summary).toContainText(/Mantenimiento\s*Sin mantenimiento/)
  await expect(payment).toContainText(/Al inicio: la web \(pago único\)\s*713,90\s€/)
  await expect(page.getByTestId('quote-total')).toContainText(/Total \(sin cuotas mensuales\)\s*713,90\s€/)
  await expect(payment).not.toContainText('Tras la permanencia')

  // An online store only offers the maintenance plans that unlock its reduced price, and is sent as a store.
  await page.getByTestId('plan-tienda-online').click()
  await expect(maintenance.getByRole('radio')).toHaveCount(3)
  await expect(page.getByTestId('maintenance-esencial')).toHaveCount(0)
  await expect(maintenance.getByRole('radio', { name: /^Plus/ })).toBeChecked()
  await expect(summary).toContainText(/Plus · 54,45\s€\/mes/)
  await expect(payment).toContainText(/Al inicio: la web \(pago único\)\s*1\.802,90\s€/)
  await expect(page.getByTestId('quote-total')).toContainText(/Total en 24 meses\s*3\.109,70\s€/)
  await expect(page.locator('input[name="projectType"]')).toHaveValue('ecommerce')

  // Arrow keys move through the maintenance cards like any radio group.
  await maintenance.getByRole('radio', { name: /^Plus/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(maintenance.getByRole('radio', { name: /^Pro/ })).toBeChecked()
  await expect(page.getByTestId('quote-total')).toContainText(/Total en 12 meses\s*2\.949,98\s€/)

  // "Not sure yet": no maintenance choice and no price until a type of website is chosen.
  await page.getByTestId('plan-unsure').click()
  await expect(maintenance).toHaveCount(0)
  await expect(payment).toHaveCount(0)
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

test('the chosen website and maintenance show what they include, with links to their pricing cards', async ({ page, context }) => {
  await page.goto('/contacto')
  const plans = page.getByRole('group', { name: 'Tipo de web', exact: true })
  // Nothing chosen yet: a link to compare every plan.
  await expect(page.getByTestId('plan-details')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Ver y comparar todos los planes/ })).toHaveAttribute('href', '/precios')

  await page.getByTestId('plan-tienda-online').click()
  const web = page.getByTestId('plan-info')
  const plan = page.getByTestId('maintenance-info')
  await expect(web).toContainText('Tienda Online')
  await expect(web).toContainText('Catálogo sin límite de productos')
  await expect(web.getByRole('link', { name: /Ver el plan en precios/ })).toHaveAttribute('href', '/precios#plan-tienda-online')
  await expect(plan).toContainText('Plus')
  await expect(plan).toContainText(/45\s€\/mes \+ IVA · permanencia de 24 meses/)
  await expect(plan).toContainText(/la web te sale 700\s€ más barata/)
  await expect(plan.getByRole('link', { name: /Ver el mantenimiento en precios/ })).toHaveAttribute('href', '/precios#maintenance-plus')

  await page.getByTestId('maintenance-pro').click()
  await expect(plan).toContainText(/79\s€\/mes \+ IVA · permanencia de 12 meses/)
  await expect(plan.getByRole('link', { name: /Ver el mantenimiento en precios/ })).toHaveAttribute('href', '/precios#maintenance-pro')

  await page.getByTestId('maintenance-none').click()
  await expect(plan).toContainText('Solo la web')
  await expect(plan).toContainText(/cuesta 700\s€ más/)
  await expect(plan.getByRole('link', { name: /Comparar con y sin mantenimiento/ })).toHaveAttribute('href', '/precios#pricing-comparison-title')

  // The link opens the pricing page in a new tab (the form keeps what was typed) on the plan's card.
  const [pricing] = await Promise.all([context.waitForEvent('page'), web.getByRole('link', { name: /Ver el plan en precios/ }).click()])
  await pricing.waitForLoadState()
  await expect(pricing).toHaveURL(/\/precios#plan-tienda-online$/)
  await expect(pricing.locator('#plan-tienda-online')).toBeInViewport()
  await expect(plans.getByRole('radio', { name: /^Tienda Online/ })).toBeChecked()
})

test('a chosen plan has a fixed price: no "from" in the summary, even for a plan listed "from" an amount', async ({ page }) => {
  await page.goto('/contacto?type=web&plan=web-profesional')
  const summary = page.getByTestId('quote-summary')
  await expect(page.getByTestId('quote-total')).toContainText(/Total en 12 meses\s*3\.312,98\s€/)
  await expect(page.getByTestId('quote-payment')).toContainText(/Al inicio: la web \(pago único\)\s*2\.165,90\s€/)
  await page.getByTestId('maintenance-none').click()
  await expect(page.getByTestId('quote-total')).toContainText(/Total \(sin cuotas mensuales\)\s*3\.133,90\s€/)
  await expect(summary).not.toContainText('desde')
  // Fixed price: no "indicative price" note, only the VAT one.
  await expect(summary).toContainText('IVA (21 %) incluido')
  await expect(summary).not.toContainText('Precio orientativo')
  // Without a plan, a project type still shows its indicative "from" price.
  await page.getByText('Otro proyecto', { exact: true }).click()
  await page.getByLabel('Tipo de proyecto *').selectOption('ecommerce')
  await expect(summary).toContainText(/desde 1\.802,90\s€/)
  await expect(summary).toContainText('Precio orientativo')
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

test('improving a website: ticking "Other" unfolds a field to say what it is', async ({ page }) => {
  await page.goto('/contacto?type=redesign&url=miweb.es')
  const other = page.getByRole('checkbox', { name: 'Otro', exact: true })
  const detail = page.getByLabel('¿Qué otro motivo? Cuéntanos qué es *')
  await expect(detail).toHaveCount(0)
  await expect(other).toHaveAttribute('aria-expanded', 'false')
  // Retried until the page has hydrated (the server HTML has no handlers yet).
  await expect(async () => {
    if (!(await other.isChecked())) await other.check()
    await expect(detail).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await expect(other).toHaveAttribute('aria-expanded', 'true')
  await expect(detail).toBeFocused()
  await expect(detail).toHaveAttribute('maxlength', '200')
  await detail.fill('El formulario no envía')
  await other.uncheck()
  await expect(detail).toHaveCount(0)
})

test('the "Other" field is translated', async ({ page }) => {
  await page.goto('/en/contact?type=redesign')
  await expect(async () => {
    await page.getByRole('checkbox', { name: 'Other', exact: true }).check()
    await expect(page.getByLabel('What else? Tell us what it is *')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await page.goto('/fr/contact?type=redesign')
  await expect(async () => {
    await page.getByRole('checkbox', { name: 'Autre', exact: true }).check()
    await expect(page.getByLabel('Quel autre problème ? Dites-nous lequel *')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
})

test('a URL that is not a website is not pre-filled', async ({ page }) => {
  await page.goto('/contacto?type=audit&url=javascript:alert(1)')
  await expect(page.getByLabel('Dirección de tu web actual *')).toHaveValue('')
})
