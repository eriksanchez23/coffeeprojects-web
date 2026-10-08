import { expect, test } from './support/client-ip'
import { setConsent } from './support/consent'
import { e2eContactEmail } from './support/contacts'

// Prices are rendered with non-breaking spaces; compare on normalized text.
const norm = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()
// Adjacent elements (dt/dd, table cells) may or may not leave a space between their texts.
const escape = (p: string) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const seq = (...parts: string[]) => new RegExp(parts.map(escape).join('\\s*'))

test.beforeEach(async ({ context, baseURL }) => {
  await setConsent(context, baseURL, false)
})

test('step 1 lists the six v4 web plans with both prices, VAT notes and minimum plans (es)', async ({ page }) => {
  await page.goto('/presupuestos')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tarifas web')
  await expect(page.getByRole('heading', { level: 2, name: '1. Elige tu web' })).toBeVisible()

  const web = page.locator('section[aria-labelledby="pricing-web-title"]')
  await expect(web.getByRole('listitem').getByRole('heading', { level: 3 })).toHaveText([
    'Landing Page',
    'Landing Premium',
    'Custom',
    'Web Corporativa',
    'Tienda Online',
    'Web Profesional',
  ])

  const card = (name: string) => web.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name, exact: true }) })
  for (const [name, withMaintenance, webOnly, minPlan] of [
    ['Landing Page', '349 € + IVA', '590 € + IVA', 'Esencial'],
    ['Landing Premium', '590 € + IVA', '890 € + IVA', 'Esencial'],
    ['Custom', 'Desde 490 € + IVA', 'desde 790 € + IVA', 'Plus'],
    ['Web Corporativa', '890 € + IVA', '1.390 € + IVA', 'Esencial'],
    ['Tienda Online', '1.490 € + IVA', '2.190 € + IVA', 'Plus'],
    ['Web Profesional', 'Desde 1.790 € + IVA', 'desde 2.590 € + IVA', 'Pro'],
  ]) {
    const text = norm(await card(name).textContent())
    expect(text, name).toMatch(seq('Con mantenimiento', withMaintenance))
    expect(text, name).toMatch(seq('Solo la web', webOnly))
    expect(text, name).toMatch(seq('Precio reducido desde el plan', minPlan))
  }

  // Badges: Tienda Online is recommended, Landing Premium is new.
  await expect(card('Tienda Online').getByText('Recomendado')).toBeVisible()
  await expect(card('Landing Premium').getByText('Nuevo')).toBeVisible()
  await expect(card('Web Profesional').getByText('El precio base incluye exactamente:')).toBeVisible()
  await expect(page.getByText(/Todas incluyen diseño responsive, SSL, textos legales, 2 rondas de revisiones/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Forma de pago' })).toBeVisible()
})

test('step 2 lists the maintenance plans, tailored support, comparison, change rules and extras (es)', async ({ page }) => {
  await page.goto('/presupuestos')
  const maintenance = page.locator('section[aria-labelledby="pricing-maintenance-title"]')
  await expect(maintenance.getByRole('heading', { level: 2 })).toHaveText('2. Elige tu mantenimiento (opcional)')

  const text = norm(await maintenance.textContent())
  for (const fragment of ['25 €/mes + IVA', '45 €/mes + IVA', '79 €/mes + IVA', 'desde 139 €/mes + IVA y 12 meses de permanencia']) {
    expect(text).toContain(fragment)
  }
  expect(text).toMatch(seq('Permanencia', '24 meses'))
  expect(text).toMatch(seq('Permanencia', '12 meses'))
  const plus = maintenance.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name: 'Plus', exact: true }) })
  await expect(plus.getByText('Recomendado')).toBeVisible()
  // An exclusion is announced as such, not as an included item.
  await expect(page.getByRole('list', { name: 'Qué incluye Esencial' }).getByRole('listitem').last()).toHaveText(/No incluido:\s*Sin correo profesional/)

  await expect(page.getByRole('heading', { level: 3, name: '¿Qué cuenta como un cambio?' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Reglas del cupo' })).toBeVisible()

  const comparison = page.getByRole('table', { name: 'Con mantenimiento vs. solo la web' })
  await expect(comparison.getByRole('row', { name: /Hosting y dominio/ })).toContainText('Los contrata y paga el cliente')
  await expect(comparison.getByRole('row', { name: /Permanencia/ })).toContainText('12 o 24 meses')

  const extras = page.getByRole('table', { name: 'Tarifa de servicios' })
  await expect(extras.getByRole('row')).toHaveCount(12)
  const row = async (name: RegExp) => norm(await extras.getByRole('row', { name }).textContent())
  expect(await row(/Idioma adicional/)).toMatch(seq('180 € + IVA', '320 € + IVA'))
  expect(await row(/Limpieza tras hackeo/)).toMatch(seq('Incluida', '290 € + IVA'))
  expect(await row(/Cambio \(texto/)).toMatch(seq('En el cupo · 20 € fuera', '35 € + IVA'))
  expect(await row(/Rediseño o funciones nuevas/)).toMatch(seq('Presupuesto', 'Presupuesto'))

  // Internal pages of the source are not published.
  const main = norm(await page.locator('main').textContent())
  for (const internal of ['Vercel', 'margen', 'v3', 'Ley de Consumidores']) expect(main).not.toContain(internal)

  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  const catalog = ld.map((s) => JSON.parse(s)).flat().find((d) => d['@type'] === 'OfferCatalog')
  expect(catalog.itemListElement).toHaveLength(10)
  expect(catalog.itemListElement[0].priceSpecification[0]).toMatchObject({ price: 349, valueAddedTaxIncluded: false })
})

test('en and fr pricing routes render translated plans', async ({ request }) => {
  for (const [path, vat, names] of [
    ['/en/pricing', '+ VAT', ['1. Choose your website', 'Business Website', '€1,490', 'Essential']],
    ['/fr/tarifs', '+ TVA', ['1. Choisissez votre site', 'Boutique en ligne', '1 490 €', 'Essentielle']],
  ] as const) {
    const res = await request.get(path)
    expect(res.status(), path).toBe(200)
    const html = norm(await res.text())
    expect(html).toContain(vat)
    for (const name of names) expect(html, `${path} ${name}`).toContain(name)
  }
})

test('a web plan CTA carries type and plan to the contact page, which shows the plan', async ({ page }) => {
  await page.goto('/presupuestos')
  const cta = page.getByRole('link', { name: 'Solicitar este plan' }).nth(3)
  await expect(cta).toHaveAttribute('href', '/contacto?type=web&plan=web-corporativa')
  await expect(page.getByRole('link', { name: 'Solicitar este plan' }).nth(4)).toHaveAttribute('href', '/contacto?type=ecommerce&plan=tienda-online')
  await page.goto((await cta.getAttribute('href'))!)

  await expect(page.getByTestId('selected-plan')).toContainText('Web Corporativa')
  await expect(page.getByLabel('Tipo de proyecto *')).toHaveValue('web')
  await expect(page.locator('input[type="hidden"][name="plan"]')).toHaveValue('web-corporativa')

  await page.goto('/presupuestos')
  await expect(page.getByRole('link', { name: 'Quiero este plan' }).first()).toHaveAttribute('href', '/contacto?type=maintenance')
})

test('an unknown plan is ignored by the contact page', async ({ page }) => {
  for (const plan of ['premium', 'esencial']) {
    await page.goto(`/contacto?type=web&plan=${plan}`)
    await expect(page.getByTestId('selected-plan')).toHaveCount(0)
    await expect(page.locator('input[name="plan"]')).toHaveCount(0)
  }
})

test('submitting with a plan stores it and keeps personal data out of the URL', async ({ page, request }) => {
  const email = e2eContactEmail('pricing')
  await page.goto('/contacto?type=web&plan=landing-page')
  await page.getByLabel('Nombre *').fill('Playwright')
  await page.getByLabel('Email *').fill(email)
  await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del plan Landing Page desde la página de presupuestos.')
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
  expect(docs[0]).toMatchObject({ plan: 'landing-page', projectType: 'web' })
})

test('home teaser and navigation link to the pricing page', async ({ page, isMobile }) => {
  await page.goto('/')
  const teaser = page.locator('#pricing')
  await expect(teaser.getByRole('heading', { level: 3 })).toHaveText([
    /Landing Page/,
    /Landing Premium/,
    /Custom/,
    /Web Corporativa/,
    /Tienda Online/,
    /Web Profesional/,
  ])
  expect(norm(await teaser.textContent())).toContain('Mantenimiento opcional desde 25 €/mes + IVA')
  await expect(teaser.getByRole('link', { name: 'Ver presupuestos' })).toHaveAttribute('href', '/presupuestos')
  await expect(page.locator('footer').getByRole('link', { name: 'Presupuestos' })).toHaveAttribute('href', '/presupuestos')
  if (!isMobile) {
    await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Presupuestos' })).toHaveAttribute('href', '/presupuestos')
  }
})

test('web and maintenance services show the v4 prices and link to the plans', async ({ page }) => {
  for (const [path, price] of [
    ['/servicios/webs-y-landing-pages', '349 € + IVA'],
    ['/servicios/mantenimiento-web', '25 €/mes + IVA'],
  ]) {
    await page.goto(path)
    expect(norm(await page.locator('main').textContent()), path).toContain(price)
    await expect(page.getByRole('link', { name: 'Ver planes y precios' })).toHaveAttribute('href', '/presupuestos')
  }
})

test('the services list shows the re-priced services with the VAT note', async ({ page }) => {
  await page.goto('/servicios')
  const main = norm(await page.locator('main').textContent())
  expect(main).toContain('Desde 349 € + IVA')
  expect(main).toContain('Desde 1.490 € + IVA')
  expect(main).toContain('Desde 25 €/mes + IVA')
})
