import { expect, test } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL!
const password = process.env.E2E_ADMIN_PASSWORD!

test.describe('admin panel', () => {
  test.skip(!email || !password, 'E2E admin credentials not configured')
  // Both tests sign in as the same team member; run them one after the other.
  test.describe.configure({ mode: 'serial' })

  test('team member logs in, sees new requests and changes a status', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password|contraseña/i).fill(password)
    await page.getByRole('button', { name: /login|iniciar/i }).click()

    const banner = page.getByTestId('inbox-banner')
    await expect(banner).toBeVisible()
    await banner.getByRole('link').click()
    await expect(page).toHaveURL(/collections\/contacts/)

    // The list view rewrites its own query string once on load; retry the click until it navigates.
    await expect(async () => {
      await page.locator('table tbody tr').first().getByRole('link').first().click({ timeout: 2_000 })
      await expect(page).toHaveURL(/collections\/contacts\/\d+/, { timeout: 2_000 })
    }).toPass({ timeout: 15_000 })
    await page.locator('#field-status').click()
    await page.getByRole('option', { name: 'in-progress' }).click()
    await page.getByRole('button', { name: /save|guardar/i }).click()
    await expect(page.getByText(/updated successfully|actualizado/i)).toBeVisible()
  })

  test('the pricing global is editable in every locale', async ({ page }) => {
    // API login sets the auth cookie on this context (the UI login flow is covered by the test above).
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)
    for (const [locale, title] of [
      ['es', 'Propuesta de tarifas — Landing Pages y Mantenimiento'],
      ['en', 'Pricing — Landing Pages & Maintenance'],
      ['fr', 'Nos tarifs — Landing pages et maintenance'],
    ]) {
      await page.goto(`/admin/globals/pricing?locale=${locale}`)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-title')).toBeEditable()
    }
  })
})

test('the admin is not indexable', async ({ request }) => {
  const res = await request.get('/admin/login')
  expect(res.headers()['x-robots-tag']).toContain('noindex')
})
