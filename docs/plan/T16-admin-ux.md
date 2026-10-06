# T16 — Admin UX: branding, contacts inbox, roles

**Files:**
- Create: `src/components/admin/logo.tsx`, `src/components/admin/icon.tsx`, `src/components/admin/inbox-banner.tsx`, `src/components/admin/status-cell.tsx`, `src/app/(payload)/custom.scss` (exists in template — modify)
- Modify: `src/payload.config.ts` (admin.components), `src/collections/Contacts.ts` (status cell, default filter), `src/collections/Users.ts` (no change unless noted)
- Generated: `src/app/(payload)/admin/importMap.js`
- Test: `tests/e2e/admin.spec.ts` (executed in T17's E2E run)

**Interfaces:**
- Consumes: collections (T04), contact statuses (T04).
- Produces: branded admin (logo, colors), dashboard banner with count of `new` contact requests linking to the filtered list, colored status badges in the contacts list.

- [ ] **Step 1: Write the failing E2E test** — `tests/e2e/admin.spec.ts`

```ts
import { expect, test } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL!
const password = process.env.E2E_ADMIN_PASSWORD!

test.describe('admin panel', () => {
  test.skip(!email || !password, 'E2E admin credentials not configured')

  test('team member logs in, sees new requests and changes a status', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password|contraseña/i).fill(password)
    await page.getByRole('button', { name: /login|iniciar/i }).click()

    const banner = page.getByTestId('inbox-banner')
    await expect(banner).toBeVisible()
    await banner.getByRole('link').click()
    await expect(page).toHaveURL(/collections\/contacts/)

    await page.locator('table tbody tr').first().getByRole('link').first().click()
    await page.getByLabel(/status/i).click()
    await page.getByRole('option', { name: 'in-progress' }).click()
    await page.getByRole('button', { name: /save|guardar/i }).click()
    await expect(page.getByText(/updated successfully|actualizado/i)).toBeVisible()
  })

  test('the admin is not indexable', async ({ request }) => {
    const res = await request.get('/admin/login')
    expect(res.headers()['x-robots-tag']).toContain('noindex')
  })
})
```

Credentials are **test users** created by a human in the dev/staging DB (never real personal passwords) and stored as `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` in `.env.local` and GitHub Actions secrets.

- [ ] **Step 2: Run — expect FAIL** (no `inbox-banner`)

```bash
pnpm exec playwright test tests/e2e/admin.spec.ts --project=desktop
```

- [ ] **Step 3: Admin components**

`src/components/admin/logo.tsx`:

```tsx
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff7e8' }}>
      <span style={{ color: '#f5a742', fontSize: 28 }}>☕</span>
      coffee<span style={{ color: '#f5a742' }}>projects</span>
      <span style={{ fontSize: 12, color: '#a89584', marginLeft: 8 }}>admin</span>
    </div>
  )
}
```

`src/components/admin/icon.tsx`:

```tsx
export function Icon() {
  return <span style={{ color: '#f5a742', fontSize: 20 }}>☕</span>
}
```

`src/components/admin/inbox-banner.tsx` (Server Component — Payload passes `payload` to custom admin RSCs):

```tsx
import type { Payload } from 'payload'

export async function InboxBanner({ payload }: { payload: Payload }) {
  const { totalDocs } = await payload.count({ collection: 'contacts', where: { status: { equals: 'new' } } })
  const href = '/admin/collections/contacts?where[status][equals]=new'
  return (
    <div data-testid="inbox-banner" style={{ margin: '0 0 24px', padding: 20, borderRadius: 14, border: '1px solid rgba(245,167,66,.32)', background: 'rgba(245,167,66,.08)' }}>
      <strong style={{ fontSize: 18 }}>
        {totalDocs === 1 ? '1 new contact request' : `${totalDocs} new contact requests`}
      </strong>
      <div style={{ marginTop: 8 }}>
        <a href={href} style={{ color: '#f5a742' }}>Open inbox →</a>
      </div>
    </div>
  )
}
```

`src/components/admin/status-cell.tsx`:

```tsx
const colors: Record<string, string> = { new: '#f5a742', 'in-progress': '#7cc5ff', answered: '#6ee7b7', archived: '#6b5d4f' }

export function StatusCell({ cellData }: { cellData?: string }) {
  const value = cellData ?? 'new'
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontFamily: 'monospace', color: '#0b0706', background: colors[value] ?? '#a89584' }}>
      {value}
    </span>
  )
}
```

- [ ] **Step 4: Register components**

`src/payload.config.ts` → `admin`:

```ts
admin: {
  user: Users.slug,
  importMap: { baseDir: path.resolve(dirname) },
  meta: { titleSuffix: ' · coffeeProjects admin', robots: 'noindex, nofollow' },
  components: {
    graphics: { Logo: '/components/admin/logo#Logo', Icon: '/components/admin/icon#Icon' },
    beforeDashboard: ['/components/admin/inbox-banner#InboxBanner'],
  },
},
```

`src/collections/Contacts.ts` → status field:

```ts
{
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'new',
  options: toOptions(contactStatuses),
  admin: { components: { Cell: '/components/admin/status-cell#StatusCell' } },
},
```

Then:

```bash
pnpm generate:importmap
```

`src/app/(payload)/custom.scss` (brand the admin with Payload CSS variables):

```scss
:root {
  --theme-success-500: #6ee7b7;
}
[data-theme='dark'] {
  --theme-bg: #0b0706;
  --theme-elevation-0: #0b0706;
  --theme-elevation-50: #120c09;
  --theme-elevation-100: #1a1310;
  --theme-elevation-150: #241812;
  --theme-elevation-1000: #fff7e8;
}
.btn--style-primary {
  background-color: #f5a742;
  color: #0b0706;
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
pnpm exec playwright test tests/e2e/admin.spec.ts --project=desktop
```

- [ ] **Step 6: Manual role check**

Create an `editor` user from an admin account. As editor: can edit services/projects/home, read and update contacts, **cannot** delete contacts, **cannot** create users or change roles. As admin: everything.

- [ ] **Step 7: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(admin): brand admin panel and add contacts inbox banner and status badges"
```
