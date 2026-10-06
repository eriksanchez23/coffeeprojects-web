import { expect, test } from '@playwright/test'
import { setConsent } from './support/consent'
import { e2eContactEmail } from './support/contacts'

// Prices are rendered with non-breaking spaces; compare on normalized text.
const norm = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()

test.beforeEach(async ({ context, baseURL }) => {
  await setConsent(context, baseURL, false)
})

test('shows the price sheet packages with exact prices and VAT notes (es)', async ({ page }) => {
  await page.goto('/presupuestos')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Propuesta de tarifas — Landing Pages y Mantenimiento')

  const cards = page.getByRole('heading', { level: 3 })
  await expect(cards).toHaveText(['Básico', 'Estándar', 'Profesional'])

  const main = norm(await page.locator('main').textContent())
  for (const price of ['300 € + IVA', '+ 20 €/mes + IVA', '400 € + IVA', '+ 30 €/mes + IVA', '1.000 € + IVA', '+ 50 €/mes + IVA', '500 € + IVA']) {
    expect(main).toContain(price)
  }
  await expect(page.getByText('Recomendado')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Servicio personalizado' })).toBeVisible()
  await expect(page.getByText('Los importes mostrados no incluyen IVA, que se aplicará según la normativa vigente.')).toBeVisible()
  // An exclusion is announced as such, not as an included item.
  await expect(page.getByRole('list', { name: 'Qué incluye Básico' }).getByRole('listitem').nth(2)).toHaveText(/No incluido:\s*Sin SEO/)

  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  const catalog = ld.map((s) => JSON.parse(s)).flat().find((d) => d['@type'] === 'OfferCatalog')
  expect(catalog.itemListElement).toHaveLength(4)
  expect(catalog.itemListElement[1].priceSpecification[0]).toMatchObject({ price: 400, valueAddedTaxIncluded: false })
})

test('en and fr pricing routes render translated packages', async ({ request }) => {
  for (const [path, vat, name] of [
    ['/en/pricing', '+ VAT', 'Standard'],
    ['/fr/tarifs', '+ TVA', 'Professionnel'],
  ]) {
    const res = await request.get(path)
    expect(res.status(), path).toBe(200)
    const html = norm(await res.text())
    expect(html).toContain(vat)
    expect(html).toContain(name)
  }
})

test('a package CTA carries type and plan to the contact page, which shows the plan', async ({ page }) => {
  await page.goto('/presupuestos')
  const cta = page.getByRole('link', { name: 'Solicitar este paquete' }).nth(1)
  await expect(cta).toHaveAttribute('href', '/contacto?type=web&plan=estandar')
  await page.goto((await cta.getAttribute('href'))!)

  await expect(page.getByTestId('selected-plan')).toContainText('Estándar')
  await expect(page.getByLabel('Tipo de proyecto *')).toHaveValue('web')
  await expect(page.locator('input[type="hidden"][name="plan"]')).toHaveValue('estandar')

  const custom = page.getByRole('link', { name: 'Pedir presupuesto a medida' })
  await page.goto('/presupuestos')
  await expect(custom).toHaveAttribute('href', '/contacto?type=custom')
})

test('an unknown plan is ignored by the contact page', async ({ page }) => {
  await page.goto('/contacto?type=web&plan=premium')
  await expect(page.getByTestId('selected-plan')).toHaveCount(0)
  await expect(page.locator('input[name="plan"]')).toHaveCount(0)
})

test('submitting with a plan stores it and keeps personal data out of the URL', async ({ page, request }) => {
  const email = e2eContactEmail('pricing')
  await page.goto('/contacto?type=web&plan=basico')
  await page.getByLabel('Nombre *').fill('Playwright')
  await page.getByLabel('Email *').fill(email)
  await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del paquete Básico desde la página de presupuestos.')
  await page.getByLabel(/política de privacidad/).check()
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page).toHaveURL(/\/contacto\/gracias\?e=[A-Za-z0-9-]+$/, { timeout: 20_000 })
  expect(page.url()).not.toContain('@')
  expect(page.url()).not.toContain('Playwright')

  // The stored request carries the validated plan (needs the local admin test credentials to read the inbox).
  const adminEmail = process.env.E2E_ADMIN_EMAIL
  const adminPassword = process.env.E2E_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return
  const login = await request.post('/api/users/login', { data: { email: adminEmail, password: adminPassword } })
  const { token } = (await login.json()) as { token: string }
  const res = await request.get(`/api/contacts?where[email][equals]=${encodeURIComponent(email)}&depth=0`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const { docs } = (await res.json()) as { docs: { plan?: string; projectType: string }[] }
  expect(docs[0]).toMatchObject({ plan: 'basico', projectType: 'web' })
})

test('home teaser and navigation link to the pricing page', async ({ page, isMobile }) => {
  await page.goto('/')
  const teaser = page.locator('#pricing')
  await expect(teaser.getByRole('heading', { level: 3 })).toHaveText([/Básico/, /Estándar/, /Profesional/])
  await expect(teaser.getByRole('link', { name: 'Ver presupuestos' })).toHaveAttribute('href', '/presupuestos')
  await expect(page.locator('footer').getByRole('link', { name: 'Presupuestos' })).toHaveAttribute('href', '/presupuestos')
  if (!isMobile) {
    await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Presupuestos' })).toHaveAttribute('href', '/presupuestos')
  }
})
