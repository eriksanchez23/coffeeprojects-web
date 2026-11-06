import { expect, test } from './support/client-ip'
import { setConsent } from './support/consent'

// Amounts are rendered with non-breaking spaces; compare on normalized text.
const norm = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()

test.beforeEach(async ({ context, baseURL }) => {
  await setConsent(context, baseURL, false)
})

const locales = [
  {
    path: '/colaboradores',
    title: 'Gana dinero con nosotros',
    notice: 'Sin compra no hay comisión',
    noticeText: 'no contrata ningún paquete, no se genera ningún pago',
    landing: ['Landing Page', '349 €', '34,90 €', '590 €', '29,50 €'],
    store: ['Tienda Online', '1.490 €', '149,00 €', '2.190 €', '109,50 €'],
    custom: ['Custom', 'desde 490 €', 'desde 49,00 €', 'desde 790 €', 'desde 39,50 €'],
    register: 'Registrar un cliente',
    pricingLink: 'Ver planes y precios',
  },
  {
    path: '/en/partners',
    title: 'Earn with us',
    notice: 'No purchase, no commission',
    noticeText: 'does not hire any package, no payment is made',
    landing: ['Landing Page', '€349', '€34.90', '€590', '€29.50'],
    store: ['Online Store', '€1,490', '€149.00', '€2,190', '€109.50'],
    custom: null,
    register: 'Register a client',
    pricingLink: null,
  },
  {
    path: '/fr/partenaires',
    title: 'Gagnez avec nous',
    notice: "Pas d'achat, pas de commission",
    noticeText: "ne commande aucune offre, aucun paiement n'est dû",
    landing: ['Landing Page', '349 €', '34,90 €', '590 €', '29,50 €'],
    store: null,
    custom: null,
    register: 'Enregistrer un client',
    pricingLink: null,
  },
]

for (const l of locales) {
  test(`partner programme page renders with the no-purchase notice and commissions (${l.path})`, async ({ page }) => {
    await page.goto(l.path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(l.title)

    // The programme's hard rule is visible near the top, not buried in the terms.
    const notice = page.getByTestId('partners-notice')
    await expect(notice).toBeVisible()
    await expect(notice.getByRole('heading', { name: l.notice })).toBeVisible()
    expect(norm(await notice.textContent())).toContain(l.noticeText)
    // ...and restated in the conditions table.
    await expect(page.getByRole('rowheader', { name: l.notice })).toBeVisible()

    const table = page.locator('section[aria-labelledby="partners-table-title"] table')
    const row = (name: string) => table.getByRole('row').filter({ has: page.getByRole('rowheader', { name, exact: true }) })
    for (const cells of [l.landing, l.store, l.custom]) {
      if (!cells) continue
      const [name, ...values] = cells
      const texts = (await row(name).getByRole('cell').allTextContents()).map(norm)
      expect(texts, name).toEqual(values)
    }

    // Register CTA: a mailto with a prefilled subject and an empty form, no personal data.
    const register = page.getByRole('link', { name: l.register })
    await expect(register).toBeVisible()
    const href = (await register.getAttribute('href')) ?? ''
    expect(href).toMatch(/^mailto:[^?]+@[^?]+\?subject=.+&body=/)

    if (l.pricingLink) await expect(page.getByRole('link', { name: l.pricingLink })).toHaveAttribute('href', '/precios')
  })
}

test('the partner page is linked from the footer and listed in the sitemap', async ({ page, request }) => {
  await page.goto('/')
  await page.locator('footer').getByRole('link', { name: 'Programa de colaboradores' }).click()
  await expect(page).toHaveURL(/\/colaboradores$/)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const path of ['/colaboradores', '/en/partners', '/fr/partenaires']) expect(sitemap).toContain(`${path}<`)
})

test('the partner page declares its canonical and hreflang alternates', async ({ page }) => {
  await page.goto('/en/partners')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/partners$/)
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', /\/colaboradores$/)
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', /\/fr\/partenaires$/)
  const title = await page.title()
  expect(title.length).toBeLessThanOrEqual(60)
})
