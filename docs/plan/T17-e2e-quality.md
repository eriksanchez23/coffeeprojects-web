# T17 — Quality gates: Playwright E2E, accessibility, Lighthouse CI, GitHub Actions

**Files:**
- Create: `tests/e2e/navigation.spec.ts`, `tests/e2e/contact.spec.ts`, `tests/e2e/consent.spec.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/a11y.spec.ts`, `scripts/create-e2e-user.ts`, `lighthouserc.json`
- Modify: `.github/workflows/ci.yml` (add `e2e` job), `package.json` (scripts `e2e:user`, `lhci`)
- Test: the files above **are** the tests.

**Interfaces:**
- Consumes: every page and feature from T03–T16; `tests/e2e/admin.spec.ts` (T16).
- Produces: CI that blocks merges to `staging`/`main` when unit, E2E, a11y or Lighthouse checks fail.

- [ ] **Step 1: E2E user script** — `scripts/create-e2e-user.ts` (test credentials only, refuses to run in production)

```ts
import config from '@payload-config'
import { getPayload } from 'payload'

if (process.env.NEXT_PUBLIC_SITE_ENV === 'production') throw new Error('Refusing to create test users in production')
const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
if (!email || !password) throw new Error('E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD missing')

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
if (existing.totalDocs === 0) {
  await payload.create({ collection: 'users', data: { email, password, name: 'E2E Bot', role: 'admin' } })
}
// Ensure at least one `new` contact for the admin inbox test.
await payload.create({
  collection: 'contacts',
  overrideAccess: true,
  data: { name: 'E2E Lead', email: 'e2e@example.com', projectType: 'web', message: 'Automated E2E contact request for the inbox test.', privacyAccepted: true, status: 'new', locale: 'es' },
})
payload.logger.info('E2E user ready')
process.exit(0)
```

`package.json` scripts: `"e2e:user": "payload run scripts/create-e2e-user.ts"`, `"lhci": "lhci autorun"`.

- [ ] **Step 2: Navigation + i18n spec** — `tests/e2e/navigation.spec.ts` (Review Focus #1)

```ts
import { expect, test } from '@playwright/test'

test('home renders in each locale with matching lang attribute', async ({ page }) => {
  for (const [path, lang] of [['/', 'es'], ['/en', 'en'], ['/fr', 'fr']] as const) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

test('language switch keeps the localized slug of a service page', async ({ page }) => {
  await page.goto('/servicios/tiendas-online')
  await page.locator('footer').getByRole('link', { name: 'en', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/services\/online-stores$/)
  await page.locator('footer').getByRole('link', { name: 'fr', exact: true }).click()
  await expect(page).toHaveURL(/\/fr\/services\/boutiques-en-ligne$/)
})

test('translated slug-less fallback still resolves (ES slug under /en)', async ({ page }) => {
  const res = await page.goto('/en/services/tiendas-online')
  expect(res?.status()).toBe(200)
})

test('unknown pages return a branded 404', async ({ page }) => {
  const res = await page.goto('/esto-no-existe')
  expect(res?.status()).toBe(404)
  await expect(page.getByText('error 404: coffee not found')).toBeVisible()
})

test('no stat or GitHub block renders 0 or an em dash placeholder', async ({ page }) => {
  await page.goto('/')
  const statValues = await page.locator('[data-count-to]').allTextContents()
  for (const v of statValues) expect(Number(v)).toBeGreaterThan(0)
  await expect(page.locator('#team dd', { hasText: /^—$/ })).toHaveCount(0)
})

test('service CTA pre-selects the project type in the contact form', async ({ page }) => {
  await page.goto('/servicios/tiendas-online')
  await page.getByRole('link', { name: 'Pide tu presupuesto' }).first().click()
  await expect(page).toHaveURL(/\/contacto\?type=ecommerce/)
  await expect(page.getByLabel(/Tipo de proyecto/)).toHaveValue('ecommerce')
})
```

- [ ] **Step 3: Contact spec** — `tests/e2e/contact.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Pre-set a "rejected" consent so the banner does not cover the form.
  await context.addCookies([{ name: 'cp_consent', value: encodeURIComponent(JSON.stringify({ v: 1, marketing: false, ts: Date.now() })), url: 'http://localhost:3000' }])
})

test('shows localized validation errors', async ({ page }) => {
  await page.goto('/en/contact')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText('This field is required.').first()).toBeVisible()
})

test('submits a valid request and lands on the thank-you page', async ({ page }) => {
  await page.goto('/contacto')
  await page.getByLabel('Nombre *').fill('Playwright')
  await page.getByLabel('Email *').fill(`pw-${Date.now()}@example.com`)
  await page.getByLabel('Cuéntanos tu proyecto *').fill('Prueba automática del formulario de contacto de CoffeeProjects.')
  await page.getByLabel(/política de privacidad/).check()
  // Turnstile test key auto-passes; wait for its hidden token input.
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: 15_000 })
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page).toHaveURL(/\/contacto\/gracias\?e=/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Recibido')
})
```

> The valid-submission test saves one contact per Playwright project (2 per run). Locally, the 5/hour/IP rate limit is reached after a few runs — delete test contacts in `/admin` or wait an hour. CI always starts from a fresh database.

- [ ] **Step 4: Consent spec** — `tests/e2e/consent.spec.ts` (Review Focus #5, browser side)

```ts
import { expect, test } from '@playwright/test'

test('rejecting cookies loads no Meta script', async ({ page }) => {
  const metaRequests: string[] = []
  page.on('request', (r) => {
    if (/facebook\.(net|com)/.test(r.url())) metaRequests.push(r.url())
  })
  await page.goto('/servicios/webs-y-landing-pages?utm_source=facebook&fbclid=E2E')
  await page.getByRole('button', { name: 'Rechazar' }).click()
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(metaRequests).toEqual([])
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === 'cp_attr')).toBeUndefined()
})

test('the banner gives Reject the same prominence as Accept', async ({ page }) => {
  await page.goto('/')
  const reject = page.getByRole('button', { name: 'Rechazar' })
  const accept = page.getByRole('button', { name: 'Aceptar todas' })
  await expect(reject).toBeVisible()
  await expect(accept).toBeVisible()
  expect(await reject.getAttribute('class')).toBe(await accept.getAttribute('class'))
})
```

> Only run the "accept → Pixel loads" check manually (T12 Step 10) — CI has no Pixel ID configured.

- [ ] **Step 5: Reduced-motion spec** — `tests/e2e/motion.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test.use({ colorScheme: 'dark', reducedMotion: 'reduce' })

test('reduced motion disables the 3D canvas and shows final counters', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2000) // past the idle callback window
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByRole('img', { name: /coffee cup/i })).toBeVisible()
  const first = page.locator('[data-count-to]').first()
  await expect(first).toHaveText(await first.getAttribute('data-count-to') as string)
})
```

- [ ] **Step 6: Accessibility spec** — `tests/e2e/a11y.spec.ts`

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = ['/', '/en/services', '/fr/services/boutiques-en-ligne', '/equipo', '/proyectos', '/contacto', '/privacidad']

for (const path of pages) {
  test(`no serious a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious, JSON.stringify(serious.map((v) => [v.id, v.nodes.length]), null, 2)).toEqual([])
  })
}
```

- [ ] **Step 7: Lighthouse CI** — `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "startServerReadyPattern": "Ready",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/en",
        "http://localhost:3000/fr",
        "http://localhost:3000/servicios/webs-y-landing-pages",
        "http://localhost:3000/equipo",
        "http://localhost:3000/contacto"
      ],
      "numberOfRuns": 3,
      "settings": { "preset": "perf", "formFactor": "mobile", "screenEmulation": { "mobile": true } }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95, "aggregationMethod": "median-run" }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

> Lighthouse SEO is evaluated with `NEXT_PUBLIC_SITE_ENV=production` in CI; on staging the intentional `noindex` would fail the SEO category.

- [ ] **Step 8: CI job** — append to `.github/workflows/ci.yml`

```yaml
  e2e:
    needs: checks
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: coffeeprojects }
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/coffeeprojects
      PAYLOAD_SECRET: ci-secret-not-for-production-0123456789
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
      NEXT_PUBLIC_SITE_ENV: production
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
      TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA
      IP_HASH_SALT: ci-salt
      PREVIEW_SECRET: ci-preview
      E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
      E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm payload migrate
      - run: pnpm seed
      - run: NEXT_PUBLIC_SITE_ENV=staging pnpm e2e:user
      - run: pnpm build
      - run: pnpm test:e2e
        env: { E2E_BASE_URL: '' }
      - run: pnpm lhci
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

> `E2E_BASE_URL` empty → Playwright's `webServer` starts `pnpm start` (the build already exists, `reuseExistingServer` keeps it). If GitHub secrets for E2E credentials are not set, the admin spec is skipped (see T16).

- [ ] **Step 9: Run everything locally**

```bash
pnpm build
pnpm test:e2e
pnpm lhci
```

Expected: all specs pass on `desktop` and `mobile` projects; LHCI assertions pass. Fix any failure in the owning task's code (not by loosening thresholds) and re-run.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "test: add E2E, accessibility and Lighthouse CI quality gates"
```
