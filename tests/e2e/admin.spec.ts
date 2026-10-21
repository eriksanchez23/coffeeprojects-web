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
    await page.getByRole('option', { name: /^(En curso|In progress)$/ }).click()
    await page.getByRole('button', { name: /save|guardar/i }).click()
    await expect(page.getByText(/updated successfully|actualizado/i)).toBeVisible()
  })

  test('the reply box reports a missing email setup and leaves the status unchanged (S19)', async ({ page }) => {
    test.skip(Boolean(process.env.RESEND_API_KEY), 'Only meaningful while email sending is not configured')
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)
    const found = await page.request.get('/api/contacts?where[email][equals]=e2e-inbox-2@example.com&depth=0')
    const contact = ((await found.json()) as { docs: { id: number; status: string; replies?: unknown[] }[] }).docs[0]!
    expect(contact).toBeTruthy()

    await page.goto(`/admin/collections/contacts/${contact.id}`)
    const box = page.getByTestId('contact-reply')
    await expect(box.getByLabel(/^(Asunto|Subject)$/)).toHaveValue(/^Re: /)
    await box.getByLabel(/^(Mensaje|Message)$/).fill('Hola, esto es una prueba automática del panel.')
    await box.getByRole('button', { name: /Enviar respuesta|Send reply/ }).click()
    await expect(box.getByTestId('contact-reply-error')).toContainText('RESEND_API_KEY')

    const after = (await (await page.request.get(`/api/contacts/${contact.id}?depth=0`)).json()) as { status: string; replies?: unknown[] }
    expect(after.status).toBe(contact.status)
    expect(after.replies ?? []).toHaveLength((contact.replies ?? []).length)
  })

  test('the thank-you PDF box downloads the PDF and reports a missing email setup (S22)', async ({ page }) => {
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)
    const found = await page.request.get('/api/contacts?where[email][equals]=e2e-inbox-2@example.com&depth=0')
    const contact = ((await found.json()) as { docs: Record<string, unknown>[] }).docs[0]!
    expect(contact).toBeTruthy()

    await page.goto(`/admin/collections/contacts/${contact.id}`)
    const box = page.getByTestId('contact-thank-you')
    await expect(box).toContainText(/Agradecimiento \(PDF\)|Thank-you note \(PDF\)/)

    const [download] = await Promise.all([page.waitForEvent('download'), box.getByTestId('contact-thank-you-download').click()])
    expect(download.suggestedFilename()).toMatch(new RegExp(`^CoffeeProjects-.+-${contact.id}\\.pdf$`))
    const pdf = await page.request.get(`/api/contacts/${contact.id}/thank-you.pdf`)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toBe('application/pdf')
    expect((await pdf.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-')

    if (!process.env.RESEND_API_KEY) {
      await box.getByTestId('contact-thank-you-send').click()
      await expect(box.getByTestId('contact-thank-you-error')).toContainText('RESEND_API_KEY')
      const after = (await (await page.request.get(`/api/contacts/${contact.id}?depth=0`)).json()) as Record<string, unknown>
      // Nothing changed on the request: same status, history and update time.
      expect(after).toEqual(contact)
    }
  })

  test('the thank-you endpoints reject anonymous callers', async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL })
    expect((await anon.get('/api/contacts/1/thank-you.pdf')).status()).toBe(401)
    expect((await anon.post('/api/contacts/1/thank-you')).status()).toBe(401)
    await anon.dispose()
  })

  test('the sidebar lists the open requests assigned to me (S20)', async ({ page }) => {
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)
    const me = ((await (await page.request.get('/api/users/me')).json()) as { user: { id: number } }).user
    const found = await page.request.get('/api/contacts?where[email][equals]=e2e-inbox-1@example.com&depth=0')
    const contact = ((await found.json()) as { docs: { id: number; name: string }[] }).docs[0]!
    const assign = (assignedTo: number | null) => page.request.patch(`/api/contacts/${contact.id}`, { data: { assignedTo, status: 'new' } })
    expect((await assign(me.id)).ok()).toBe(true)
    try {
      await page.goto('/admin')
      const box = page.getByTestId('assigned-requests')
      await expect(box).toContainText(/Mis solicitudes abiertas|My open requests/)
      await expect(box.getByRole('link', { name: new RegExp(contact.name) })).toHaveAttribute('href', `/admin/collections/contacts/${contact.id}`)
      expect(await box.getByRole('link', { name: /Ver todas|View all/ }).getAttribute('href')).toContain(`[assignedTo][equals]=${me.id}`)
    } finally {
      await assign(null)
    }
  })

  test('a project shows the "Import from website" box, which refuses private addresses (S23)', async ({ page }) => {
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)

    await page.goto('/admin/collections/projects/create')
    const box = page.getByTestId('project-import')
    await expect(box).toContainText(/Importar desde la web|Import from website/)
    await expect(box.getByTestId('project-import-run')).toBeDisabled()

    // A loopback URL is refused by the server's guard before any request goes out: no real network in this test.
    await page.locator('#field-url').fill('http://127.0.0.1:3000/')
    await box.getByTestId('project-import-run').click()
    await expect(box.getByTestId('project-import-error')).toContainText(/red privada o local|private or local network/)
    await expect(page.locator('#field-title')).toHaveValue('')
  })

  test('the project import endpoint rejects anonymous callers', async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL })
    expect((await anon.post('/api/projects/import-from-url', { data: { url: 'https://example.com' } })).status()).toBe(401)
    await anon.dispose()
  })

  test('the reply endpoint rejects anonymous callers', async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL })
    const res = await anon.post('/api/contacts/1/reply', { data: { subject: 'Re: x', message: 'x' } })
    expect(res.status()).toBe(401)
    await anon.dispose()
  })

  test('the pricing global is editable in every locale', async ({ page }) => {
    // API login sets the auth cookie on this context (the UI login flow is covered by the test above).
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)
    for (const [locale, title] of [
      ['es', 'Tarifas web'],
      ['en', 'Website pricing'],
      ['fr', 'Nos tarifs web'],
    ]) {
      await page.goto(`/admin/globals/pricing?locale=${locale}`)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-title')).toBeEditable()
    }
  })

  test('the partner programme global is editable in every locale', async ({ page }) => {
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)
    for (const [locale, title] of [
      ['es', 'Gana dinero con nosotros'],
      ['en', 'Earn with us'],
      ['fr', 'Gagnez avec nous'],
    ]) {
      await page.goto(`/admin/globals/partners?locale=${locale}`)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-title')).toBeEditable()
    }
  })
})

test('the admin is not indexable', async ({ request }) => {
  const res = await request.get('/admin/login')
  expect(res.headers()['x-robots-tag']).toContain('noindex')
})
